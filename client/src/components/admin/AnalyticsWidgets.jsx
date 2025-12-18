import { useMemo } from 'react';
import {
    BarChart3,
    TrendingUp,
    CheckCircle,
    Clock,
    AlertCircle,
    Users,
    MapPin,
    Activity,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { formatNumber } from '../../utils/helpers';

/**
 * Analytics Widgets Component
 * Enhanced dashboard with charts and dynamic visualizations
 */
const AnalyticsWidgets = ({ data }) => {
    if (!data) return null;

    const { overview, statusBreakdown, categoryBreakdown, trendingIssues, hotspots, issuesOverTime } = data;

    // Stats cards
    const statsCards = [
        {
            title: 'Total Issues',
            value: overview?.totalIssues || 0,
            icon: BarChart3,
            color: 'text-primary-400',
            bgColor: 'bg-primary-500/20',
            change: overview?.issuesThisWeek ? `+${overview.issuesThisWeek} this week` : null,
        },
        {
            title: 'Reported Today',
            value: overview?.reportedToday || 0,
            icon: AlertCircle,
            color: 'text-red-400',
            bgColor: 'bg-red-500/20',
            change: null,
        },
        {
            title: 'Resolution Rate',
            value: `${overview?.resolutionRate || 0}%`,
            icon: CheckCircle,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/20',
            change: overview?.resolutionRate > 50 ? 'Good progress!' : 'Needs improvement',
        },
        {
            title: 'Total Users',
            value: overview?.totalUsers || 0,
            icon: Users,
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/20',
            change: null,
        },
    ];

    // Prepare data for Status Pie Chart
    const statusPieData = useMemo(() => [
        { name: 'Reported', value: statusBreakdown?.reported || 0, color: '#ef4444' },
        { name: 'In Progress', value: statusBreakdown?.in_progress || 0, color: '#f59e0b' },
        { name: 'Resolved', value: statusBreakdown?.resolved || 0, color: '#10b981' },
    ], [statusBreakdown]);

    // Prepare data for Category Bar Chart
    const categoryBarData = useMemo(() =>
        categoryBreakdown?.slice(0, 6).map(cat => ({
            name: cat._id?.replace('_', ' ') || 'Unknown',
            count: cat.count,
        })) || [], [categoryBreakdown]);

    // Prepare trend data from API issuesOverTime with status breakdown
    const trendData = useMemo(() => {
        // Use real data from issuesOverTime if available
        if (issuesOverTime && issuesOverTime.length > 0) {
            // Format the date and use status breakdown counts
            return issuesOverTime.slice(-7).map(item => {
                const date = new Date(item._id);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                return {
                    name: dayName,
                    date: item._id,
                    reported: item.reported || 0,
                    inProgress: item.in_progress || 0,
                    resolved: item.resolved || 0,
                    total: item.total || 0,
                };
            });
        }

        // Fallback: No data message
        return [];
    }, [issuesOverTime]);

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-dark-800 border border-dark-600 rounded-lg p-3 shadow-lg">
                    <p className="text-white font-medium mb-1">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-dark-800 border border-dark-700 rounded-xl p-5 hover:border-dark-600 transition-all duration-200"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-dark-400 text-sm">{stat.title}</span>
                            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                <stat.icon size={18} className={stat.color} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-white mb-1">
                            {formatNumber(stat.value)}
                        </p>
                        {stat.change && (
                            <p className="text-xs text-dark-400">{stat.change}</p>
                        )}
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Issue Trend Line Chart */}
                <div className="lg:col-span-2 bg-dark-800 border border-dark-700 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Activity size={20} className="text-primary-400" />
                        Issue Status Over Time (Last 7 Days)
                    </h3>
                    <div className="h-64 w-full min-w-0">
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                    <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="reported"
                                        name="Reported"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorReported)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="inProgress"
                                        name="In Progress"
                                        stroke="#f59e0b"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorInProgress)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="resolved"
                                        name="Resolved"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorResolved)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-dark-400">
                                <p>No issue data available for this period</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Pie Chart */}
                <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Clock size={20} className="text-primary-400" />
                        Status Distribution
                    </h3>
                    <div className="h-64 w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                            <PieChart>
                                <Pie
                                    data={statusPieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusPieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Legend
                                    formatter={(value) => <span className="text-dark-200 text-sm">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Category Bar Chart */}
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 size={20} className="text-primary-400" />
                    Issues by Category
                </h3>
                <div className="h-64 w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                        <BarChart data={categoryBarData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                stroke="#94a3b8"
                                fontSize={12}
                                width={100}
                                tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px'
                                }}
                                labelStyle={{ color: '#f1f5f9' }}
                            />
                            <Bar
                                dataKey="count"
                                fill="#3b82f6"
                                radius={[0, 4, 4, 0]}
                                name="Issues"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Trending Issues & Hotspots */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trending Issues */}
                <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-primary-400" />
                        Trending Issues
                    </h3>
                    {trendingIssues?.length > 0 ? (
                        <div className="space-y-3">
                            {trendingIssues.slice(0, 5).map((issue, index) => (
                                <div
                                    key={issue._id}
                                    className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-lg hover:bg-dark-700 transition-colors"
                                >
                                    <span
                                        className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${index === 0
                                            ? 'bg-amber-500 text-white'
                                            : index === 1
                                                ? 'bg-gray-400 text-white'
                                                : index === 2
                                                    ? 'bg-amber-700 text-white'
                                                    : 'bg-dark-600 text-dark-300'
                                            }`}
                                    >
                                        {index + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">
                                            {issue.title}
                                        </p>
                                        <p className="text-dark-400 text-xs capitalize">
                                            {issue.category?.replace('_', ' ')}
                                        </p>
                                    </div>
                                    <span className="text-primary-400 text-sm font-medium flex items-center gap-1">
                                        <TrendingUp size={14} />
                                        {issue.upvotesCount}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-40 text-dark-400">
                            <p>No trending issues yet.</p>
                        </div>
                    )}
                </div>

                {/* Hotspots */}
                <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <MapPin size={20} className="text-red-400" />
                        Issue Hotspots
                    </h3>
                    {hotspots?.length > 0 ? (
                        <div className="space-y-3">
                            {hotspots.slice(0, 5).map((hotspot, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-dark-700/50 rounded-lg hover:bg-dark-700 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${index === 0
                                                ? 'bg-red-500 text-white'
                                                : 'bg-dark-600 text-dark-300'
                                                }`}
                                        >
                                            {index + 1}
                                        </span>
                                        <span className="text-dark-200 text-sm truncate max-w-[200px]">
                                            {hotspot._id || 'Unknown Location'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-2 bg-dark-600 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-red-500 rounded-full"
                                                style={{
                                                    width: `${(hotspot.count / (hotspots[0]?.count || 1)) * 100}%`
                                                }}
                                            />
                                        </div>
                                        <span className="text-dark-400 text-sm min-w-[60px] text-right">
                                            {hotspot.count} issues
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-40 text-dark-400">
                            <p>No hotspot data available.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Stats Footer */}
            <div className="bg-gradient-to-r from-primary-600/20 to-primary-500/10 border border-primary-500/30 rounded-xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h3 className="text-white font-semibold mb-1">Quick Overview</h3>
                        <p className="text-dark-300 text-sm">
                            {overview?.totalIssues || 0} total issues • {statusBreakdown?.in_progress || 0} in progress • {overview?.resolutionRate || 0}% resolved
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-emerald-400">{statusBreakdown?.resolved || 0}</p>
                            <p className="text-xs text-dark-400">Resolved</p>
                        </div>
                        <div className="w-px h-10 bg-dark-600" />
                        <div className="text-center">
                            <p className="text-2xl font-bold text-amber-400">{statusBreakdown?.in_progress || 0}</p>
                            <p className="text-xs text-dark-400">In Progress</p>
                        </div>
                        <div className="w-px h-10 bg-dark-600" />
                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-400">{statusBreakdown?.reported || 0}</p>
                            <p className="text-xs text-dark-400">Pending</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsWidgets;
