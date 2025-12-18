import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import Button from '../common/Button';
import statesAndDistricts from '../../utils/states-and-districts.json';
import { issueApi } from '../../services/api';

/**
 * Issue Filters Component
 * Sidebar-style filter panel with multi-select for states
 */
const IssueFilters = ({ params, onFilterChange, onReset }) => {
    const [expandedSections, setExpandedSections] = useState({
        states: true,
        districts: true,
        categories: true,
        status: true,
        sort: true,
    });

    const [showAllStates, setShowAllStates] = useState(false);
    const [showAllDistricts, setShowAllDistricts] = useState(false);
    const [filterCounts, setFilterCounts] = useState({
        states: {},
        districts: {},
        categories: {},
        statuses: {},
    });

    // Fetch filter counts on mount and when filters change (optional, but good for real-time feel)
    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const response = await issueApi.getFilterCounts();
                if (response.data.success) {
                    setFilterCounts(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching filter counts:', error);
            }
        };

        fetchCounts();
    }, []);

    // Process states data from JSON - create value/label pairs for dropdowns
    const states = useMemo(() => {
        return statesAndDistricts.states.map(item => ({
            value: item.state.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, ''),
            label: item.state,
        }));
    }, []);

    // Process districts data from JSON - create a map of state value to districts array
    const districtsByState = useMemo(() => {
        const districtMap = {};
        statesAndDistricts.states.forEach(item => {
            const stateValue = item.state.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '');
            districtMap[stateValue] = item.districts.map(district => ({
                value: district.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, ''),
                label: district,
            }));
        });
        return districtMap;
    }, []);

    // Check if all filter params are empty
    const activeFiltersCount = useMemo(() => {
        return [
            params.category,
            params.status,
            params.search,
            params.state,
            params.district,
        ].filter(Boolean).length;
    }, [params.category, params.status, params.search, params.state, params.district]);
    const categories = [
        { value: 'pothole', label: 'Pothole' },
        { value: 'garbage', label: 'Garbage' },
        { value: 'water_leak', label: 'Water Leak' },
        { value: 'streetlight', label: 'Streetlight' },
        { value: 'drainage', label: 'Drainage' },
        { value: 'road_damage', label: 'Road Damage' },
        { value: 'other', label: 'Other' },
    ];

    const statuses = [
        { value: 'reported', label: 'Reported' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'resolved', label: 'Resolved' },
    ];

    const sortOptions = [
        { value: '-createdAt', label: 'Newest First' },
        { value: 'createdAt', label: 'Oldest First' },
        { value: '-upvotesCount', label: 'Most Upvoted' },
    ];

    // Parse selected states from params (stored as comma-separated string)
    const getSelectedStates = () => {
        if (!params.state) return [];
        return params.state.split(',').filter(Boolean);
    };

    // Handle multi-select for states
    const handleStateToggle = (stateValue) => {
        const currentSelected = getSelectedStates();
        let newSelected;

        if (currentSelected.includes(stateValue)) {
            // Remove state from selection
            newSelected = currentSelected.filter(s => s !== stateValue);
        } else {
            // Add state to selection
            newSelected = [...currentSelected, stateValue];
        }

        // Update filter - if empty, shows all issues
        onFilterChange({
            state: newSelected.length > 0 ? newSelected.join(',') : '',
            district: '', // Reset district when states change
            page: 1
        });
    };

    // Handle single select for category and status
    const handleCheckboxChange = (name, value) => {
        const currentValue = params[name];
        if (currentValue === value) {
            // Deselect - show all
            onFilterChange({ [name]: '', page: 1 });
        } else {
            // Select
            onFilterChange({ [name]: value, page: 1 });
        }
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            onFilterChange({ search: e.target.value, page: 1 });
        }
    };

    const handleSortChange = (e) => {
        onFilterChange({ sort: e.target.value, page: 1 });
    };

    const toggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const selectedStates = getSelectedStates();

    // Get districts for all selected states
    const getAvailableDistricts = () => {
        const districts = [];
        selectedStates.forEach(state => {
            if (districtsByState[state]) {
                districts.push(...districtsByState[state]);
            }
        });
        return districts;
    };

    const availableDistricts = getAvailableDistricts();

    const displayedStates = showAllStates ? states : states.slice(0, 7);
    const displayedDistricts = showAllDistricts ? availableDistricts : availableDistricts.slice(0, 5);

    return (
        <div className="bg-dark-800 border border-dark-700 rounded-xl h-full flex flex-col">
            {/* Fixed Search Bar */}
            <div className="p-4 pb-0 flex-shrink-0">
                <div className="pb-4 border-b border-dark-700">
                    <div className="relative">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400"
                        />
                        <input
                            type="text"
                            placeholder="Search issues..."
                            defaultValue={params.search}
                            onKeyDown={handleSearch}
                            className="input-field pl-9 py-2 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Scrollable filter options */}
            <div className="p-4 pt-0 space-y-1 overflow-y-auto flex-1 scrollbar-hide">
                {/* States Filter - Multi-select */}
                <div className="py-3 border-b border-dark-700">
                    <button
                        onClick={() => toggleSection('states')}
                        className="flex items-center justify-between w-full text-left"
                    >
                        <span className="font-semibold text-white text-sm">
                            States {selectedStates.length > 0 && (
                                <span className="text-primary-400 ml-1">({selectedStates.length})</span>
                            )}
                        </span>
                        {expandedSections.states ? (
                            <ChevronUp size={16} className="text-dark-400" />
                        ) : (
                            <ChevronDown size={16} className="text-dark-400" />
                        )}
                    </button>
                    {expandedSections.states && (
                        <div className="mt-3 space-y-2">
                            {displayedStates.map((state) => (
                                <label
                                    key={state.value}
                                    className="flex items-center gap-2 cursor-pointer group"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedStates.includes(state.value)}
                                        onChange={() => handleStateToggle(state.value)}
                                        className="w-4 h-4 rounded border-dark-500 bg-dark-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
                                    />
                                    <span className="text-sm text-dark-300 group-hover:text-white transition-colors flex items-center justify-between flex-1">
                                        <span>{state.label}</span>
                                        {filterCounts.states[state.value] > 0 && (
                                            <span className="text-xs text-dark-500 group-hover:text-dark-400 bg-dark-700 group-hover:bg-dark-600 px-1.5 py-0.5 rounded-full">
                                                {filterCounts.states[state.value]}
                                            </span>
                                        )}
                                    </span>
                                </label>
                            ))}
                            {states.length > 7 && (
                                <button
                                    onClick={() => setShowAllStates(!showAllStates)}
                                    className="text-primary-400 text-sm hover:text-primary-300 mt-2"
                                >
                                    {showAllStates ? '▲ See less' : '▼ See more'}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Districts Filter - Only show if states are selected */}
                {selectedStates.length > 0 && availableDistricts.length > 0 && (
                    <div className="py-3 border-b border-dark-700">
                        <button
                            onClick={() => toggleSection('districts')}
                            className="flex items-center justify-between w-full text-left"
                        >
                            <span className="font-semibold text-white text-sm">Districts</span>
                            {expandedSections.districts ? (
                                <ChevronUp size={16} className="text-dark-400" />
                            ) : (
                                <ChevronDown size={16} className="text-dark-400" />
                            )}
                        </button>
                        {expandedSections.districts && (
                            <div className="mt-3 space-y-2">
                                {displayedDistricts.map((district) => (
                                    <label
                                        key={district.value}
                                        className="flex items-center gap-2 cursor-pointer group"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={params.district === district.value}
                                            onChange={() => handleCheckboxChange('district', district.value)}
                                            className="w-4 h-4 rounded border-dark-500 bg-dark-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
                                        />
                                        <span className="text-sm text-dark-300 group-hover:text-white transition-colors flex items-center justify-between flex-1">
                                            <span>{district.label}</span>
                                            {filterCounts.districts[district.value] > 0 && (
                                                <span className="text-xs text-dark-500 group-hover:text-dark-400 bg-dark-700 group-hover:bg-dark-600 px-1.5 py-0.5 rounded-full">
                                                    {filterCounts.districts[district.value]}
                                                </span>
                                            )}
                                        </span>
                                    </label>
                                ))}
                                {availableDistricts.length > 5 && (
                                    <button
                                        onClick={() => setShowAllDistricts(!showAllDistricts)}
                                        className="text-primary-400 text-sm hover:text-primary-300 mt-2"
                                    >
                                        {showAllDistricts ? '▲ See less' : '▼ See more'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Category Filter */}
                <div className="py-3 border-b border-dark-700">
                    <button
                        onClick={() => toggleSection('categories')}
                        className="flex items-center justify-between w-full text-left"
                    >
                        <span className="font-semibold text-white text-sm">Category</span>
                        {expandedSections.categories ? (
                            <ChevronUp size={16} className="text-dark-400" />
                        ) : (
                            <ChevronDown size={16} className="text-dark-400" />
                        )}
                    </button>
                    {expandedSections.categories && (
                        <div className="mt-3 space-y-2">
                            {categories.map((cat) => (
                                <label
                                    key={cat.value}
                                    className="flex items-center gap-2 cursor-pointer group"
                                >
                                    <input
                                        type="checkbox"
                                        checked={params.category === cat.value}
                                        onChange={() => handleCheckboxChange('category', cat.value)}
                                        className="w-4 h-4 rounded border-dark-500 bg-dark-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
                                    />
                                    <span className="text-sm text-dark-300 group-hover:text-white transition-colors flex items-center justify-between flex-1">
                                        <span>{cat.label}</span>
                                        {filterCounts.categories[cat.value] > 0 && (
                                            <span className="text-xs text-dark-500 group-hover:text-dark-400 bg-dark-700 group-hover:bg-dark-600 px-1.5 py-0.5 rounded-full">
                                                {filterCounts.categories[cat.value]}
                                            </span>
                                        )}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status Filter */}
                <div className="py-3 border-b border-dark-700">
                    <button
                        onClick={() => toggleSection('status')}
                        className="flex items-center justify-between w-full text-left"
                    >
                        <span className="font-semibold text-white text-sm">Status</span>
                        {expandedSections.status ? (
                            <ChevronUp size={16} className="text-dark-400" />
                        ) : (
                            <ChevronDown size={16} className="text-dark-400" />
                        )}
                    </button>
                    {expandedSections.status && (
                        <div className="mt-3 space-y-2">
                            {statuses.map((status) => (
                                <label
                                    key={status.value}
                                    className="flex items-center gap-2 cursor-pointer group"
                                >
                                    <input
                                        type="checkbox"
                                        checked={params.status === status.value}
                                        onChange={() => handleCheckboxChange('status', status.value)}
                                        className="w-4 h-4 rounded border-dark-500 bg-dark-700 text-primary-500 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
                                    />
                                    <span className="text-sm text-dark-300 group-hover:text-white transition-colors flex items-center justify-between flex-1">
                                        <span>{status.label}</span>
                                        {filterCounts.statuses[status.value] > 0 && (
                                            <span className="text-xs text-dark-500 group-hover:text-dark-400 bg-dark-700 group-hover:bg-dark-600 px-1.5 py-0.5 rounded-full">
                                                {filterCounts.statuses[status.value]}
                                            </span>
                                        )}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sort */}
                <div className="py-3 border-b border-dark-700">
                    <button
                        onClick={() => toggleSection('sort')}
                        className="flex items-center justify-between w-full text-left"
                    >
                        <span className="font-semibold text-white text-sm">Sort By</span>
                        {expandedSections.sort ? (
                            <ChevronUp size={16} className="text-dark-400" />
                        ) : (
                            <ChevronDown size={16} className="text-dark-400" />
                        )}
                    </button>
                    {expandedSections.sort && (
                        <div className="mt-3">
                            <select
                                value={params.sort || '-createdAt'}
                                onChange={handleSortChange}
                                className="select-field py-2 text-sm"
                            >
                                {sortOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Reset Button */}
                {activeFiltersCount > 0 && (
                    <div className="pt-3">
                        <Button
                            variant="ghost"
                            icon={X}
                            onClick={onReset}
                            className="w-full text-dark-400 hover:text-white text-sm"
                        >
                            Clear All Filters ({activeFiltersCount})
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IssueFilters;
