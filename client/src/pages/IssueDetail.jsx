import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    MapPin,
    ArrowUp,
    Calendar,
    ChevronLeft,
    Share2,
    Trash2,
    Clock,
    Image as ImageIcon,
    CheckCircle,
    AlertTriangle
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import Loader, { PageLoader } from '../components/common/Loader';
import Modal from '../components/common/Modal';
import StatusTimeline from '../components/issues/StatusTimeline';
import CommentSection from '../components/issues/CommentSection';
import { useUpvote } from '../hooks/useUpvote';
import { useUserContext } from '../context/UserContext';
import { issueApi } from '../services/api';
import {
    formatDate,
    formatDateTime,
    categoryConfig,
    getInitials,
} from '../utils/helpers';
import toast from 'react-hot-toast';

/**
 * Issue Detail Page Component
 * Displays full issue details with comments and status timeline
 */
const IssueDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isSignedIn, isAdmin } = useUserContext();

    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeImage, setActiveImage] = useState(0);
    const [deleting, setDeleting] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const { upvoted, count, toggleUpvote, loading: upvoteLoading } = useUpvote(
        id,
        issue?.upvotesCount || 0
    );

    // Fetch issue details
    useEffect(() => {
        const fetchIssue = async () => {
            try {
                setLoading(true);
                const response = await issueApi.getIssueById(id);
                setIssue(response.data.data);
            } catch (err) {
                setError(err.message || 'Failed to load issue');
            } finally {
                setLoading(false);
            }
        };

        fetchIssue();
    }, [id]);

    const handleDeleteClick = () => {
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            setDeleting(true);
            await issueApi.deleteIssue(id);
            toast.success('Issue deleted');
            navigate('/');
        } catch (err) {
            toast.error(err.message || 'Failed to delete issue');
            setDeleting(false); // Only reset if failed, successful delete navigates away
            setDeleteModalOpen(false);
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: issue.title,
                text: issue.description,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied to clipboard');
        }
    };

    if (loading) return <PageLoader text="Loading issue..." />;

    if (error) {
        return (
            <div className="min-h-screen bg-dark-900">
                <Navbar />
                <div className="container-custom py-16 text-center">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 max-w-md mx-auto">
                        <p className="text-red-400 mb-4">{error}</p>
                        <Link to="/">
                            <Button variant="secondary">Back to Feed</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!issue) return null;

    const category = categoryConfig[issue.category] || categoryConfig.other;
    const isOwner = user && issue.createdBy?._id === user._id;
    const canDelete = isOwner || isAdmin;

    return (
        <div className="min-h-screen bg-dark-900">
            <Navbar />

            <main className="container-custom py-8">
                {/* Back Button */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-dark-400 hover:text-white mb-6 transition-colors"
                >
                    <ChevronLeft size={20} />
                    <span>Back to Feed</span>
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header Card */}
                        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                            {/* Status & Category */}
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <StatusBadge status={issue.status} />
                                <span
                                    className={`inline-flex items-center text-sm px-3 py-1 rounded-full ${category.bg} ${category.color}`}
                                >
                                    {category.label}
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                                {issue.title}
                            </h1>

                            {/* Meta */}
                            <div className="flex flex-wrap items-center gap-4 text-dark-400 text-sm mb-6">
                                <span className="flex items-center gap-1.5">
                                    <Calendar size={16} />
                                    {formatDate(issue.createdAt)}
                                </span>
                                {issue.location?.address && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin size={16} />
                                        {issue.location.address}
                                    </span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={() => isSignedIn && toggleUpvote()}
                                    disabled={upvoteLoading || !isSignedIn}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${upvoted
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-dark-700 text-dark-200 hover:bg-dark-600'
                                        } ${!isSignedIn && 'opacity-50 cursor-not-allowed'}`}
                                >
                                    <ArrowUp size={18} className={upvoted ? 'fill-white' : ''} />
                                    <span>{count} Upvotes</span>
                                </button>

                                <Button variant="secondary" icon={Share2} onClick={handleShare}>
                                    Share
                                </Button>

                                {canDelete && (
                                    <Button
                                        variant="danger"
                                        icon={Trash2}
                                        onClick={handleDeleteClick}
                                        loading={deleting}
                                    >
                                        Delete
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Images */}
                        {issue.images && issue.images.length > 0 && (
                            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <ImageIcon size={20} className="text-primary-400" />
                                    Photos ({issue.images.length})
                                </h3>

                                {/* Main Image */}
                                <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                                    <img
                                        src={issue.images[activeImage]}
                                        alt={`Issue photo ${activeImage + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Thumbnails */}
                                {issue.images.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {issue.images.map((img, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setActiveImage(index)}
                                                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${activeImage === index
                                                    ? 'border-primary-500'
                                                    : 'border-transparent hover:border-dark-500'
                                                    }`}
                                            >
                                                <img
                                                    src={img}
                                                    alt={`Thumbnail ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Description
                            </h3>
                            <p className="text-dark-200 whitespace-pre-wrap leading-relaxed">
                                {issue.description}
                            </p>
                        </div>

                        {/* Resolution Proof */}
                        {issue.status === 'resolved' && issue.resolutionProof && (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                                    <CheckCircle size={20} />
                                    Resolution Proof
                                </h3>
                                {issue.resolutionProof.note && (
                                    <p className="text-dark-200 mb-4">{issue.resolutionProof.note}</p>
                                )}
                                {issue.resolutionProof.images?.length > 0 && (
                                    <div className="grid grid-cols-3 gap-3">
                                        {issue.resolutionProof.images.map((img, index) => (
                                            <img
                                                key={index}
                                                src={img}
                                                alt={`Resolution proof ${index + 1}`}
                                                className="w-full h-24 object-cover rounded-lg"
                                            />
                                        ))}
                                    </div>
                                )}
                                <p className="text-dark-500 text-sm mt-4">
                                    Resolved on {formatDateTime(issue.resolutionProof.resolvedAt)}
                                    {issue.resolutionProof.resolvedBy?.name &&
                                        ` by ${issue.resolutionProof.resolvedBy.name}`}
                                </p>
                            </div>
                        )}

                        {/* Comments Section */}
                        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                            <CommentSection issueId={id} />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Reporter Card */}
                        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Reported By
                            </h3>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                                    {issue.createdBy?.avatar ? (
                                        <img
                                            src={issue.createdBy.avatar}
                                            alt={issue.createdBy.name}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        getInitials(issue.createdBy?.name)
                                    )}
                                </div>
                                <div>
                                    <p className="text-white font-medium">
                                        {issue.createdBy?.name || 'Anonymous'}
                                    </p>
                                    <p className="text-dark-400 text-sm">
                                        {formatDate(issue.createdAt)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Status Timeline */}
                        <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Clock size={20} className="text-primary-400" />
                                Status Timeline
                            </h3>
                            <StatusTimeline timeline={issue.statusTimeline} />
                        </div>

                        {/* Location Card */}
                        {issue.location && (
                            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <MapPin size={20} className="text-primary-400" />
                                    Location
                                </h3>
                                {issue.location.address && (
                                    <p className="text-dark-300 mb-4">{issue.location.address}</p>
                                )}
                                {/* Google Maps link - use coordinates if valid, otherwise search by address */}
                                <a
                                    href={
                                        issue.location.coordinates &&
                                            issue.location.coordinates.length === 2 &&
                                            (issue.location.coordinates[0] !== 0 || issue.location.coordinates[1] !== 0)
                                            ? `https://www.google.com/maps?q=${issue.location.coordinates[1]},${issue.location.coordinates[0]}`
                                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(issue.location.address || '')}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-400 text-sm hover:underline"
                                >
                                    View on Google Maps →
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
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
                            onClick={() => setDeleteModalOpen(false)}
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

export default IssueDetail;
