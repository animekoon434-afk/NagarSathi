/**
 * API Features Utility
 * Provides filtering, sorting, pagination, and field selection
 */
class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    /**
     * Filter by query parameters
     * Supports: category, status, createdBy, state (multi-select)
     * Excludes pagination/sorting fields from filtering
     */
    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields', 'search', 'lat', 'lng', 'radius'];
        excludedFields.forEach((field) => delete queryObj[field]);

        // Remove empty values (empty strings, null, undefined, empty arrays)
        Object.keys(queryObj).forEach((key) => {
            const value = queryObj[key];
            if (value === '' || value === null || value === undefined ||
                (Array.isArray(value) && value.length === 0)) {
                delete queryObj[key];
            }
        });

        // Handle multi-select for state field (comma-separated values)
        if (queryObj.state && queryObj.state.includes(',')) {
            const states = queryObj.state.split(',').filter(Boolean);
            queryObj.state = { $in: states };
        }

        // Handle advanced filtering (gte, gt, lte, lt)
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

        this.query = this.query.find(JSON.parse(queryStr));
        return this;
    }

    /**
     * Text search in title and description
     */
    search() {
        if (this.queryString.search) {
            const searchRegex = new RegExp(this.queryString.search, 'i');
            this.query = this.query.find({
                $or: [{ title: searchRegex }, { description: searchRegex }],
            });
        }
        return this;
    }

    /**
     * Geospatial search - find issues within radius of coordinates
     * @param lat - Latitude
     * @param lng - Longitude
     * @param radius - Radius in kilometers (default: 10km)
     */
    nearLocation() {
        if (this.queryString.lat && this.queryString.lng) {
            const lat = parseFloat(this.queryString.lat);
            const lng = parseFloat(this.queryString.lng);
            const radius = parseFloat(this.queryString.radius) || 10; // Default 10km

            // Convert radius from km to radians (Earth radius = 6378.1 km)
            const radiusInRadians = radius / 6378.1;

            this.query = this.query.find({
                location: {
                    $geoWithin: {
                        $centerSphere: [[lng, lat], radiusInRadians],
                    },
                },
            });
        }
        return this;
    }

    /**
     * Sort results
     * Default: newest first
     * Supports: -upvotesCount (most upvoted), createdAt (oldest first)
     */
    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            // Default sort: newest first
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }

    /**
     * Field limiting (projection)
     */
    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }
        return this;
    }

    /**
     * Pagination
     * Default: page 1, limit 10
     */
    paginate() {
        const page = parseInt(this.queryString.page, 10) || 1;
        const limit = parseInt(this.queryString.limit, 10) || 10;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);
        this.page = page;
        this.limit = limit;

        return this;
    }
}

export default APIFeatures;
