import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Map, AlertCircle, MapPin } from 'lucide-react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import IssueCard from '../components/issues/IssueCard';
import IssueFilters from '../components/issues/IssueFilters';
import Button from '../components/common/Button';
import { CardSkeletonList } from '../components/common/Loader';
import { useIssues } from '../hooks/useIssues';
import ActionAdSidebar from '../components/home/ActionAdSidebar';

/**
 * Home Page Component
 * Main feed showing all issues
 */
const Home = () => {
    const location = useLocation();
    const {
        issues,
        loading,
        error,
        pagination,
        params,
        updateParams,
        resetParams,
        goToPage,
        refetch,
    } = useIssues(location.state?.filters || { limit: 10 });

    return (
        <div className="h-screen bg-dark-900 flex flex-col overflow-hidden">
            <Navbar />

            <main className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-8 py-6">
                {/* Header - Fixed at top */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 flex-shrink-0">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                            Issue Feed
                        </h1>
                        <p className="text-dark-400">
                            {pagination.total} issues reported in your community
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/map" state={{ filters: params }}>
                            <Button variant="secondary" icon={Map}>
                                Map View
                            </Button>
                        </Link>
                        <SignedIn>
                            <Link to="/report">
                                <Button icon={Plus}>Report Issue</Button>
                            </Link>
                        </SignedIn>
                        <SignedOut>
                            <Link to="/sign-in">
                                <Button icon={Plus}>Sign In to Report</Button>
                            </Link>
                        </SignedOut>
                    </div>
                </div>

                {/* Main Content with Sidebar Layout - Takes remaining height */}
                <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                    {/* Left Sidebar - Filters (fixed width, scrolls internally) */}
                    <aside className="w-full lg:w-[280px] flex-shrink-0 order-2 lg:order-1 lg:overflow-y-auto scrollbar-hide">
                        <IssueFilters
                            params={params}
                            onFilterChange={updateParams}
                            onReset={resetParams}
                        />
                    </aside>

                    {/* Center Content - Issue List (scrollable feed) */}
                    <div className="flex-1 min-w-0 order-1 lg:order-2 overflow-y-auto scrollbar-hide">
                        {loading ? (
                            <CardSkeletonList count={5} />
                        ) : error ? (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
                                <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
                                <p className="text-red-400 mb-4">{error}</p>
                                <Button variant="secondary" onClick={refetch}>
                                    Try Again
                                </Button>
                            </div>
                        ) : issues.length === 0 ? (
                            <div className="bg-dark-800 border border-dark-700 rounded-xl p-12 text-center">
                                <MapPin size={48} className="text-dark-600 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    No Issues Found
                                </h3>
                                <p className="text-dark-400 mb-6">
                                    {params.category || params.status || params.search || params.state || params.district
                                        ? 'Try adjusting your filters to see more results.'
                                        : 'Be the first to report an issue in your community!'}
                                </p>
                                {params.category || params.status || params.search || params.state || params.district ? (
                                    <Button variant="secondary" onClick={resetParams}>
                                        Clear Filters
                                    </Button>
                                ) : (
                                    <SignedIn>
                                        <Link to="/report">
                                            <Button icon={Plus}>Report Issue</Button>
                                        </Link>
                                    </SignedIn>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    {issues.map((issue) => (
                                        <IssueCard key={issue._id} issue={issue} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {pagination.pages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-10 pb-4">
                                        <Button
                                            variant="secondary"
                                            onClick={() => goToPage(pagination.page - 1)}
                                            disabled={pagination.page <= 1}
                                        >
                                            Previous
                                        </Button>
                                        <span className="text-dark-400 px-4">
                                            Page {pagination.page} of {pagination.pages}
                                        </span>
                                        <Button
                                            variant="secondary"
                                            onClick={() => goToPage(pagination.page + 1)}
                                            disabled={pagination.page >= pagination.pages}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Right Sidebar - Action Ads (Desktop Only) */}
                    <aside className="hidden xl:block w-[300px] flex-shrink-0 order-3 overflow-y-auto scrollbar-hide">
                        <ActionAdSidebar />
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default Home;
