import { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { List, Filter } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import MapView from '../components/map/MapView';
import Button from '../components/common/Button';
import statesAndDistricts from '../utils/states-and-districts.json';

/**
 * Map Page Component
 * Full-screen map view of all issues
 */
const MapPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [filters, setFilters] = useState(location.state?.filters || {});
    const [showFilters, setShowFilters] = useState(false);

    const categories = [
        { value: '', label: 'All Categories' },
        { value: 'pothole', label: 'Pothole' },
        { value: 'garbage', label: 'Garbage' },
        { value: 'water_leak', label: 'Water Leak' },
        { value: 'streetlight', label: 'Streetlight' },
        { value: 'drainage', label: 'Drainage' },
        { value: 'road_damage', label: 'Road Damage' },
        { value: 'other', label: 'Other' },
    ];

    const statuses = [
        { value: '', label: 'All Status' },
        { value: 'reported', label: 'Reported' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'resolved', label: 'Resolved' },
    ];

    // Process states data
    const states = useMemo(() => {
        return statesAndDistricts?.states?.map(item => ({
            value: item.state.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, ''),
            label: item.state
        })) || [];
    }, []);

    // Process districts data
    const districtsData = useMemo(() => {
        const districtMap = {};
        statesAndDistricts?.states?.forEach(item => {
            const stateValue = item.state.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '');
            districtMap[stateValue] = item.districts.map(district => ({
                value: district.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, ''),
                label: district
            }));
        });
        return districtMap;
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => {
            const newFilters = {
                ...prev,
                [name]: value || undefined,
            };

            // Clear district if state changes
            if (name === 'state') {
                newFilters.district = undefined;
            }

            return newFilters;
        });
    };

    const handleIssueClick = (issue) => {
        navigate(`/issues/${issue._id}`);
    };

    return (
        <div className="h-screen flex flex-col bg-dark-900">
            <Navbar />

            {/* Map Controls */}
            <div className="bg-dark-800 border-b border-dark-700 px-4 py-3">
                <div className="container-custom flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" state={{ filters }}>
                            <Button variant="secondary" size="sm" icon={List}>
                                List View
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={Filter}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            Filters
                        </Button>
                    </div>
                    <div className="text-dark-400 text-sm">
                        Click on markers to view issue details
                    </div>
                </div>

                {/* Filter Options */}
                {showFilters && (
                    <div className="container-custom mt-3 flex flex-wrap gap-3 animate-slide-down">
                        <select
                            name="state"
                            value={filters.state || ''}
                            onChange={handleFilterChange}
                            className="select-field w-auto min-w-[150px]"
                        >
                            <option value="">All States</option>
                            {states.map((state) => (
                                <option key={state.value} value={state.value}>
                                    {state.label}
                                </option>
                            ))}
                        </select>
                        <select
                            name="district"
                            value={filters.district || ''}
                            onChange={handleFilterChange}
                            className="select-field w-auto min-w-[150px]"
                            disabled={!filters.state || !districtsData[filters.state]}
                        >
                            <option value="">All Districts</option>
                            {filters.state && districtsData[filters.state]?.map((district) => (
                                <option key={district.value} value={district.value}>
                                    {district.label}
                                </option>
                            ))}
                        </select>
                        <select
                            name="category"
                            value={filters.category || ''}
                            onChange={handleFilterChange}
                            className="select-field w-auto"
                        >
                            {categories.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                        <select
                            name="status"
                            value={filters.status || ''}
                            onChange={handleFilterChange}
                            className="select-field w-auto"
                        >
                            {statuses.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Map */}
            <div className="flex-1 min-h-0 relative">
                <MapView
                    filters={filters}
                    onIssueClick={handleIssueClick}
                    height="100%"
                />
            </div>

            {/* Legend */}
            <div className="bg-dark-800 border-t border-dark-700 px-4 py-2">
                <div className="container-custom flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-dark-400">Reported</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-dark-400">In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-dark-400">Resolved</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapPage;
