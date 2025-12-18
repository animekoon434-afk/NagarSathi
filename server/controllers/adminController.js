import Issue from '../models/Issue.js';
import User from '../models/User.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import APIFeatures from '../utils/apiFeatures.js';

/**
 * Admin Controller
 * Handles admin-specific operations
 */

// @desc    Get all issues (admin view with extra details)
// @route   GET /api/admin/issues
// @access  Private (Admin)
export const getAllIssues = asyncHandler(async (req, res) => {
    const features = new APIFeatures(Issue.find(), req.query)
        .filter()
        .search()
        .sort()
        .paginate();

    const total = await Issue.countDocuments(
        new APIFeatures(Issue.find(), req.query).filter().search().query.getFilter()
    );

    const issues = await features.query
        .populate('createdBy', 'name email avatar')
        .populate('statusTimeline.updatedBy', 'name')
        .lean();

    res.status(200).json({
        success: true,
        count: issues.length,
        total,
        page: features.page,
        pages: Math.ceil(total / features.limit),
        data: issues,
    });
});

// @desc    Update issue status (admin only)
// @route   PUT /api/admin/issues/:id/status
// @access  Private (Admin)
export const updateIssueStatus = asyncHandler(async (req, res) => {
    const { status, note } = req.body;

    if (!['reported', 'in_progress', 'resolved'].includes(status)) {
        throw new ApiError(400, 'Invalid status value');
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
        throw new ApiError(404, 'Issue not found');
    }

    // Add to status timeline
    issue.statusTimeline.push({
        status,
        updatedAt: new Date(),
        updatedBy: req.user._id,
        note: note || `Status changed to ${status}`,
    });

    issue.status = status;

    await issue.save();

    // Populate for response
    await issue.populate('createdBy', 'name avatar');
    await issue.populate('statusTimeline.updatedBy', 'name');

    res.status(200).json({
        success: true,
        message: `Issue status updated to ${status}`,
        data: issue,
    });
});

// @desc    Mark issue as resolved with proof
// @route   POST /api/admin/issues/:id/resolve
// @access  Private (Admin)
export const resolveIssue = asyncHandler(async (req, res) => {
    const { note } = req.body;

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
        throw new ApiError(404, 'Issue not found');
    }

    // Get image URLs from uploaded files
    const images = req.files ? req.files.map((file) => file.path) : [];

    // Update issue with resolution proof
    issue.status = 'resolved';
    issue.resolutionProof = {
        images,
        note: note || 'Issue has been resolved',
        resolvedAt: new Date(),
        resolvedBy: req.user._id,
    };

    // Add to status timeline
    issue.statusTimeline.push({
        status: 'resolved',
        updatedAt: new Date(),
        updatedBy: req.user._id,
        note: note || 'Issue resolved with proof',
    });

    await issue.save();

    // Populate for response
    await issue.populate('createdBy', 'name avatar');
    await issue.populate('resolutionProof.resolvedBy', 'name');

    res.status(200).json({
        success: true,
        message: 'Issue marked as resolved',
        data: issue,
    });
});

// @desc    Get analytics data
// @route   GET /api/admin/analytics
// @access  Private (Admin)
export const getAnalytics = asyncHandler(async (req, res) => {
    // Get date range (default: last 30 days)
    const days = parseInt(req.query.days, 10) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total counts
    const totalIssues = await Issue.countDocuments();
    const totalUsers = await User.countDocuments();

    // Status breakdown
    const statusCounts = await Issue.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
    ]);

    // Category breakdown
    const categoryCounts = await Issue.aggregate([
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
            },
        },
        { $sort: { count: -1 } },
    ]);

    // Issues over time (last N days) with status breakdown
    const issuesOverTime = await Issue.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                },
                total: { $sum: 1 },
                reported: {
                    $sum: { $cond: [{ $eq: ['$status', 'reported'] }, 1, 0] }
                },
                in_progress: {
                    $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
                },
                resolved: {
                    $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
                },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Trending issues (most upvoted in time period)
    const trendingIssues = await Issue.find({ createdAt: { $gte: startDate } })
        .sort('-upvotesCount')
        .limit(10)
        .select('title category status upvotesCount commentsCount createdAt')
        .lean();

    // Resolution rate
    const resolvedCount = statusCounts.find((s) => s._id === 'resolved')?.count || 0;
    const resolutionRate = totalIssues > 0 ? ((resolvedCount / totalIssues) * 100).toFixed(1) : 0;

    // Hotspot locations (areas with most issues)
    const hotspots = await Issue.aggregate([
        {
            $match: {
                'location.address': { $exists: true, $ne: '' },
            },
        },
        {
            $group: {
                _id: '$location.address',
                count: { $sum: 1 },
                avgLat: { $avg: { $arrayElemAt: ['$location.coordinates', 1] } },
                avgLng: { $avg: { $arrayElemAt: ['$location.coordinates', 0] } },
            },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
    ]);

    // Recent activity
    const recentIssues = await Issue.find()
        .sort('-createdAt')
        .limit(5)
        .select('title category status createdAt')
        .lean();

    res.status(200).json({
        success: true,
        data: {
            overview: {
                totalIssues,
                totalUsers,
                resolutionRate: parseFloat(resolutionRate),
                reportedToday: await Issue.countDocuments({
                    createdAt: { $gte: new Date().setHours(0, 0, 0, 0) },
                }),
            },
            statusBreakdown: statusCounts.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            categoryBreakdown: categoryCounts,
            issuesOverTime,
            trendingIssues,
            hotspots,
            recentIssues,
        },
    });
});

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAllUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments();
    const users = await User.find()
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean();

    // Get issue counts per user
    const usersWithStats = await Promise.all(
        users.map(async (user) => {
            const issueCount = await Issue.countDocuments({ createdBy: user._id });
            return { ...user, issueCount };
        })
    );

    res.status(200).json({
        success: true,
        count: users.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        data: usersWithStats,
    });
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
export const updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
        throw new ApiError(400, 'Invalid role value');
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true, runValidators: true }
    );

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.status(200).json({
        success: true,
        message: `User role updated to ${role}`,
        data: user,
    });
});
