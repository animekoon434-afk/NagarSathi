import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { LayoutDashboard, BarChart3, Users, Settings, AlertTriangle } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import IssueTable from '../components/admin/IssueTable';
import AnalyticsWidgets from '../components/admin/AnalyticsWidgets';
import StatusUpdateModal from '../components/admin/StatusUpdateModal';
import IssueFilters from '../components/issues/IssueFilters';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import { useUserContext } from '../context/UserContext';
import { adminApi } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Admin Dashboard Page
 * Issue management and analytics for admins
 */
const AdminDashboard = () => {
    const { user, isAdmin, loading: userLoading } = useUserContext();

    const [activeTab, setActiveTab] = useState('issues');
    const [issues, setIssues] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [params, setParams] = useState({ limit: 15 });
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Delete confirmation state
    const [deleteConfirmation, setDeleteConfirmation] = useState({
        open: false,
        issueId: null
    });
    const [deleting, setDeleting] = useState(false);

    // Fetch issues
    const fetchIssues = async () => {
        try {
            setLoading(true);
            const response = await adminApi.getAllIssues(params);
            setIssues(response.data.data);
            setPagination({
                page: response.data.page,
                pages: response.data.pages,
                total: response.data.total,
            });
        } catch (error) {
            toast.error('Failed to fetch issues');
        } finally {
            setLoading(false);
        }
    };

    // Fetch analytics
    const fetchAnalytics = async () => {
        try {
            const response = await adminApi.getAnalytics({ days: 30 });
            setAnalytics(response.data.data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchIssues();
            fetchAnalytics();
        }
    }, [isAdmin, params]);

    // Redirect if not admin
    if (userLoading) {
        return (
            <div className="min-h-screen bg-dark-900 flex items-center justify-center">
                <Loader size="lg" text="Loading..." />
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    const handlePageChange = (page) => {
        setParams((prev) => ({ ...prev, page }));
    };

    const handleFilterChange = (newParams) => {
        setParams((prev) => ({ ...prev, ...newParams, page: 1 }));
    };

    const handleResetFilters = () => {
        setParams({ limit: 15 });
    };

    const handleStatusUpdate = (issue) => {
        setSelectedIssue(issue);
        setModalOpen(true);
    };

    const handleSubmitStatus = async (issueId, data, isResolution) => {
        try {
            setUpdating(true);

            if (isResolution) {
                await adminApi.resolveIssue(issueId, data);
                toast.success('Issue marked as resolved');
            } else {
                await adminApi.updateIssueStatus(issueId, data);
                toast.success('Status updated');
            }

            setModalOpen(false);
            fetchIssues();
            fetchAnalytics();
        } catch (error) {
            toast.error(error.message || 'Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteClick = (issueId) => {
        setDeleteConfirmation({ open: true, issueId });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation.issueId) return;

        try {
            setDeleting(true);
            await adminApi.deleteIssue(deleteConfirmation.issueId);
            toast.success('Issue deleted');
            fetchIssues();
            fetchAnalytics();
            setDeleteConfirmation({ open: false, issueId: null });
        } catch (error) {
            toast.error(error.message || 'Failed to delete issue');
        } finally {
            setDeleting(false);
        }
    };

    const tabs = [
        { id: 'issues', label: 'Issues', icon: LayoutDashboard },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    ];

    return (
        <div className="h-screen bg-dark-900 flex flex-col overflow-hidden">
            <Navbar />

            <main className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-8 py-6">
                {/* Header - Fixed at top */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 flex-shrink-0">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                            Admin Dashboard
                        </h1>
                        <p className="text-dark-400">
                            Manage issues and monitor platform analytics
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-dark-400">
                        <Settings size={18} />
                        <span>Welcome, {user?.name}</span>
                    </div>
                </div>

                {/* Tabs - Fixed */}
                <div className="flex gap-2 mb-6 border-b border-dark-700 pb-4 flex-shrink-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id
                                ? 'bg-primary-600 text-white'
                                : 'text-dark-400 hover:text-white hover:bg-dark-700'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content - Takes remaining height */}
                {activeTab === 'issues' && (
                    <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                        {/* Left Sidebar - Filters (fixed width, no max-width) */}
                        <aside className="w-full lg:w-[280px] flex-shrink-0 order-2 lg:order-1 lg:overflow-y-auto scrollbar-hide">
                            <IssueFilters
                                params={params}
                                onFilterChange={handleFilterChange}
                                onReset={handleResetFilters}
                            />
                        </aside>

                        {/* Right Content - Issue Table (scrollable with max-width) */}
                        <div className="flex-1 min-w-0 order-1 lg:order-2 overflow-y-auto scrollbar-hide">
                            <div className="max-w-7xl">
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader size="lg" text="Loading issues..." />
                                    </div>
                                ) : (
                                    <IssueTable
                                        issues={issues}
                                        pagination={pagination}
                                        onPageChange={handlePageChange}
                                        onStatusUpdate={handleStatusUpdate}
                                        onDelete={handleDeleteClick}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="flex-1 overflow-y-auto scrollbar-hide w-full">
                        <div className="max-w-7xl mx-auto w-full">
                            <AnalyticsWidgets data={analytics} />
                        </div>
                    </div>
                )}
            </main>

            {/* Status Update Modal */}
            <StatusUpdateModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                issue={selectedIssue}
                onSubmit={handleSubmitStatus}
                loading={updating}
            />

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteConfirmation.open}
                onClose={() => setDeleteConfirmation({ open: false, issueId: null })}
                title="Delete Issue"
                size="sm"
            >
                <div className="flex flex-col items-center text-center p-2">
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Are you sure?</h3>
                    <p className="text-dark-300 mb-8">
                        This action cannot be undone. This will permanently delete the issue and remove all associated data.
                    </p>
                    <div className="flex gap-3 w-full">
                        <Button
                            variant="secondary"
                            onClick={() => setDeleteConfirmation({ open: false, issueId: null })}
                            className="flex-1"
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={confirmDelete}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            loading={deleting}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminDashboard;
