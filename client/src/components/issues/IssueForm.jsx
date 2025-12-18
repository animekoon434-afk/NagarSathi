import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, MapPin, Loader, Crosshair } from 'lucide-react';
import Button from '../common/Button';
import toast from 'react-hot-toast';
import statesAndDistricts from '../../utils/states-and-districts.json';

/**
 * Issue Form Component
 * Form for creating/editing issues with image upload and text-based location
 */
const IssueForm = ({ onSubmit, initialData = null, loading = false }) => {
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        category: initialData?.category || '',
        state: initialData?.state || '',
        district: initialData?.district || '',
        address: initialData?.location?.address || '',
    });
    const [images, setImages] = useState([]);
    const [existingImages] = useState(initialData?.images || []);
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [coordinates, setCoordinates] = useState(
        initialData?.location?.coordinates || [0, 0]
    );
    const debounceTimeoutRef = useRef(null);

    // Process states data from JSON - create value/label pairs for dropdowns
    const statesData = useMemo(() => {
        return statesAndDistricts.states.map(item => ({
            value: item.state.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, ''),
            label: item.state,
            aliases: [
                item.state.toLowerCase(),
                item.state.toLowerCase().replace(/\s+/g, ''),
                // Add common abbreviations
                ...(item.state === 'Uttar Pradesh' ? ['up'] : []),
                ...(item.state === 'Madhya Pradesh' ? ['mp'] : []),
                ...(item.state === 'Andhra Pradesh' ? ['ap'] : []),
                ...(item.state === 'Tamil Nadu' ? ['tn', 'tamilnadu'] : []),
                ...(item.state === 'Maharashtra' ? ['mh'] : []),
                ...(item.state === 'Karnataka' ? ['kar'] : []),
                ...(item.state === 'Gujarat' ? ['gj'] : []),
                ...(item.state === 'Rajasthan' ? ['rj'] : []),
                ...(item.state === 'West Bengal' ? ['wb'] : []),
                ...(item.state === 'Bihar' ? ['br'] : []),
                ...(item.state === 'Telangana' ? ['ts', 'tg'] : []),
                ...(item.state === 'Delhi (NCT)' ? ['delhi', 'new delhi', 'nd'] : []),
            ]
        }));
    }, []);

    // Process districts data from JSON - create a map of state value to districts array
    const districtsData = useMemo(() => {
        const districtMap = {};
        statesAndDistricts.states.forEach(item => {
            const stateValue = item.state.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '');
            districtMap[stateValue] = item.districts.map(district => ({
                value: district.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, ''),
                label: district,
                aliases: [
                    district.toLowerCase(),
                    district.toLowerCase().replace(/\s+/g, ''),
                    // Add common city aliases
                    ...(district.includes('Bengaluru') || district.includes('Bangalore') ? ['bangalore', 'bengaluru', 'blr'] : []),
                    ...(district === 'Mumbai City' || district === 'Mumbai Suburban' ? ['mumbai', 'bombay'] : []),
                    ...(district === 'Chennai' ? ['chennai', 'madras'] : []),
                    ...(district === 'Kolkata' ? ['kolkata', 'calcutta'] : []),
                    ...(district === 'Hyderabad' ? ['hyderabad', 'hyd'] : []),
                    ...(district.includes('Mysuru') || district.includes('Mysore') ? ['mysore', 'mysuru'] : []),
                ]
            }));
        });
        return districtMap;
    }, []);

    // Function to detect state and district from address
    const detectStateAndDistrict = useCallback((address) => {
        if (!address || address.length < 3) return;

        const normalizedAddress = address.toLowerCase().trim();
        let detectedState = '';
        let detectedDistrict = '';

        // First, try to detect district/city (more specific match)
        for (const [stateKey, districts] of Object.entries(districtsData)) {
            for (const district of districts) {
                for (const alias of district.aliases) {
                    if (normalizedAddress.includes(alias)) {
                        detectedState = stateKey;
                        detectedDistrict = district.value;
                        break;
                    }
                }
                if (detectedDistrict) break;
            }
            if (detectedDistrict) break;
        }

        // If no district found, try to detect state
        if (!detectedState) {
            for (const state of statesData) {
                for (const alias of state.aliases) {
                    if (normalizedAddress.includes(alias)) {
                        detectedState = state.value;
                        break;
                    }
                }
                if (detectedState) break;
            }
        }

        // Update form data if something was detected
        if (detectedState || detectedDistrict) {
            setFormData(prev => {
                const updates = {};
                if (detectedState && prev.state !== detectedState) {
                    updates.state = detectedState;
                }
                if (detectedDistrict && prev.district !== detectedDistrict) {
                    updates.district = detectedDistrict;
                }
                if (Object.keys(updates).length > 0) {
                    return { ...prev, ...updates };
                }
                return prev;
            });
        }
    }, []);

    // Geocode address to get coordinates
    const geocodeAddress = useCallback(async (addressQuery) => {
        if (!addressQuery || addressQuery.length < 5) return;

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${apiUrl}/geocode/search?q=${encodeURIComponent(addressQuery)}`);
            const result = await response.json();

            if (result.success && result.data) {
                const { lat, lon } = result.data;
                // MongoDB GeoJSON expects [longitude, latitude]
                setCoordinates([parseFloat(lon), parseFloat(lat)]);
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        }
    }, []);

    // Handle address change with debounced detection
    const handleAddressChange = useCallback((e) => {
        const { value } = e.target;
        setFormData(prev => ({ ...prev, address: value }));

        // Clear previous timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Set new timeout for detection
        if (value.length >= 3) {
            setIsDetectingLocation(true);
            debounceTimeoutRef.current = setTimeout(() => {
                detectStateAndDistrict(value);
                geocodeAddress(value);
                setIsDetectingLocation(false);
            }, 800);
        }
    }, [detectStateAndDistrict, geocodeAddress]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    // Get current location using browser geolocation and reverse geocode
    const getCurrentLocation = useCallback(async () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        setIsGettingLocation(true);

        try {
            // Helper to get position with given options
            const getPosition = (options) => new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, options);
            });

            let position;
            try {
                // First try with high accuracy (GPS) - longer timeout
                position = await getPosition({
                    enableHighAccuracy: true,
                    timeout: 30000, // 30 seconds for GPS
                    maximumAge: 60000 // Accept cached position up to 1 minute old
                });
            } catch (highAccuracyError) {
                // If high accuracy fails, try with low accuracy (network-based)
                console.log('High accuracy failed, trying low accuracy...', highAccuracyError);
                toast.loading('GPS slow, trying network location...', { id: 'location-fallback' });
                position = await getPosition({
                    enableHighAccuracy: false,
                    timeout: 15000, // 15 seconds for network
                    maximumAge: 300000 // Accept cached position up to 5 minutes old
                });
                toast.dismiss('location-fallback');
            }

            const { latitude, longitude } = position.coords;

            // Reverse geocode using backend proxy (avoids CORS issues)
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const response = await fetch(
                `${apiUrl}/geocode/reverse?lat=${latitude}&lon=${longitude}`
            );

            if (!response.ok) {
                throw new Error('Failed to get address from coordinates');
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Geocoding failed');
            }

            const address = result.data?.address || {};

            // Build a readable address string
            const addressParts = [];
            if (address.road) addressParts.push(address.road);
            if (address.neighbourhood) addressParts.push(address.neighbourhood);
            if (address.suburb) addressParts.push(address.suburb);
            if (address.city || address.town || address.village) {
                addressParts.push(address.city || address.town || address.village);
            }
            if (address.state_district) addressParts.push(address.state_district);
            if (address.state) addressParts.push(address.state);
            if (address.postcode) addressParts.push(address.postcode);

            const fullAddress = addressParts.join(', ') || data.display_name || '';

            // Save coordinates for form submission (GeoJSON format: [longitude, latitude])
            setCoordinates([longitude, latitude]);

            // Update the address field
            setFormData(prev => ({ ...prev, address: fullAddress }));

            // Try to detect state and district from the address
            if (fullAddress) {
                detectStateAndDistrict(fullAddress);
            }

            toast.success('Location detected successfully!');
        } catch (error) {
            console.error('Geolocation error:', error);
            if (error.code === 1) {
                toast.error('Location access denied. Please enable location permissions.');
            } else if (error.code === 2) {
                toast.error('Unable to determine your location. Please try again.');
            } else if (error.code === 3) {
                toast.error('Location request timed out. Please try again.');
            } else {
                toast.error('Failed to get your location. Please enter manually.');
            }
        } finally {
            setIsGettingLocation(false);
        }
    }, [detectStateAndDistrict]);

    // Image dropzone
    const onDrop = useCallback(
        (acceptedFiles) => {
            const totalImages = images.length + existingImages.length;
            const remainingSlots = 5 - totalImages;

            if (remainingSlots <= 0) {
                toast.error('Maximum 5 images allowed');
                return;
            }

            const newFiles = acceptedFiles.slice(0, remainingSlots).map((file) =>
                Object.assign(file, {
                    preview: URL.createObjectURL(file),
                })
            );

            setImages((prev) => [...prev, ...newFiles]);
        },
        [images, existingImages]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
        },
        maxSize: 5 * 1024 * 1024, // 5MB
    });

    const removeImage = (index) => {
        setImages((prev) => {
            const newImages = [...prev];
            URL.revokeObjectURL(newImages[index].preview);
            newImages.splice(index, 1);
            return newImages;
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error('Please enter a title');
            return;
        }
        if (!formData.description.trim()) {
            toast.error('Please enter a description');
            return;
        }
        if (!formData.category) {
            toast.error('Please select a category');
            return;
        }
        if (!formData.address.trim()) {
            toast.error('Please enter a location address');
            return;
        }

        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('category', formData.category);
        if (formData.state) data.append('state', formData.state);
        if (formData.district) data.append('district', formData.district);
        data.append(
            'location',
            JSON.stringify({
                type: 'Point',
                coordinates: coordinates, // Use saved coordinates from GPS or default [0, 0]
                address: formData.address,
            })
        );

        images.forEach((image) => {
            data.append('images', image);
        });

        onSubmit(data);
    };

    const categories = [
        { value: 'pothole', label: 'Pothole' },
        { value: 'garbage', label: 'Garbage' },
        { value: 'water_leak', label: 'Water Leak' },
        { value: 'streetlight', label: 'Streetlight' },
        { value: 'drainage', label: 'Drainage' },
        { value: 'road_damage', label: 'Road Damage' },
        { value: 'other', label: 'Other' },
    ];

    // Use statesData for the dropdown
    const states = statesData;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
                <label className="block text-dark-200 text-sm font-medium mb-2">
                    Issue Title *
                </label>
                <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Large pothole on Main Street"
                    className="input-field"
                    maxLength={100}
                />
                <p className="text-dark-500 text-xs mt-1">
                    {formData.title.length}/100 characters
                </p>
            </div>

            {/* Category */}
            <div>
                <label className="block text-dark-200 text-sm font-medium mb-2">
                    Category *
                </label>
                <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="select-field"
                >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                            {cat.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* State and District */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-dark-200 text-sm font-medium mb-2">
                        State
                    </label>
                    <select
                        name="state"
                        value={formData.state}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, state: e.target.value, district: '' }));
                        }}
                        className="select-field"
                    >
                        <option value="">Select state</option>
                        {states.map((st) => (
                            <option key={st.value} value={st.value}>
                                {st.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-dark-200 text-sm font-medium mb-2">
                        District
                    </label>
                    <select
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        className="select-field"
                        disabled={!formData.state || !districtsData[formData.state]}
                    >
                        <option value="">Select district</option>
                        {formData.state && districtsData[formData.state] &&
                            districtsData[formData.state].map((district) => (
                                <option key={district.value} value={district.value}>
                                    {district.label}
                                </option>
                            ))
                        }
                    </select>
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-dark-200 text-sm font-medium mb-2">
                    Description *
                </label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Provide details about the issue..."
                    className="input-field min-h-[120px] resize-y"
                    maxLength={2000}
                />
                <p className="text-dark-500 text-xs mt-1">
                    {formData.description.length}/2000 characters
                </p>
            </div>

            {/* Location - Text Based */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-dark-200 text-sm font-medium">
                        Location Address *
                    </label>
                    <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-400 bg-primary-500/10 hover:bg-primary-500/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGettingLocation ? (
                            <>
                                <Loader size={14} className="animate-spin" />
                                <span>Getting location...</span>
                            </>
                        ) : (
                            <>
                                <Crosshair size={14} />
                                <span>Get My Location</span>
                            </>
                        )}
                    </button>
                </div>
                <div className="relative">
                    <MapPin
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400"
                    />
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleAddressChange}
                        placeholder="Enter address or click 'Get My Location'"
                        className="input-field pl-10 pr-10"
                    />
                    {isDetectingLocation && (
                        <Loader
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 animate-spin"
                        />
                    )}
                </div>
                <p className="text-dark-500 text-xs mt-1">
                    E.g., "Near Gandhi Statue, MG Road, Bangalore" or "Sector 15, Noida"
                    {(formData.state || formData.district) && (
                        <span className="text-primary-400 ml-2">
                            ✓ Auto-detected: {formData.state && statesData.find(s => s.value === formData.state)?.label}
                            {formData.district && districtsData[formData.state]?.find(d => d.value === formData.district)?.label && (
                                <>, {districtsData[formData.state].find(d => d.value === formData.district)?.label}</>
                            )}
                        </span>
                    )}
                </p>
            </div>

            {/* Image Upload */}
            <div>
                <label className="block text-dark-200 text-sm font-medium mb-2">
                    Photos (Max 5)
                </label>

                {/* Dropzone */}
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${isDragActive
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-600 hover:border-primary-500 hover:bg-dark-700/50'
                        }`}
                >
                    <input {...getInputProps()} />
                    <Upload
                        size={40}
                        className={`mx-auto mb-3 ${isDragActive ? 'text-primary-400' : 'text-dark-400'
                            }`}
                    />
                    <p className="text-dark-300">
                        {isDragActive
                            ? 'Drop the images here...'
                            : 'Drag & drop images here, or click to select'}
                    </p>
                    <p className="text-dark-500 text-sm mt-1">
                        JPG, PNG, WebP up to 5MB each
                    </p>
                </div>

                {/* Image Previews */}
                {(images.length > 0 || existingImages.length > 0) && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                        {/* Existing Images */}
                        {existingImages.map((url, index) => (
                            <div key={`existing-${index}`} className="relative group">
                                <img
                                    src={url}
                                    alt={`Existing ${index + 1}`}
                                    className="w-full h-20 object-cover rounded-lg"
                                />
                            </div>
                        ))}

                        {/* New Images */}
                        {images.map((file, index) => (
                            <div key={file.name} className="relative group">
                                <img
                                    src={file.preview}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-20 object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={loading}
            >
                {initialData ? 'Update Issue' : 'Report Issue'}
            </Button>
        </form>
    );
};

export default IssueForm;
