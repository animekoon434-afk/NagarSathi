import express from 'express';

const router = express.Router();

/**
 * Geocoding Routes
 * Base path: /api/geocode
 * Proxy for OpenStreetMap Nominatim API to avoid CORS issues
 */

// Search (forward) geocode - convert address to coordinates
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Address query is required',
            });
        }

        // Call Nominatim API
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
            {
                headers: {
                    'Accept-Language': 'en',
                    'User-Agent': 'NagarSathi-CivicApp/1.0 (contact@nagarsathi.app)',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Nominatim API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.length === 0) {
            return res.json({
                success: true,
                data: null, // No results found
            });
        }

        // Return the first result
        const result = data[0];

        res.json({
            success: true,
            data: {
                lat: result.lat,
                lon: result.lon,
                display_name: result.display_name,
            },
        });
    } catch (error) {
        console.error('Forward geocoding error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to find coordinates for address',
            error: error.message,
        });
    }
});

// Reverse geocode - convert coordinates to address
router.get('/reverse', async (req, res) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required',
            });
        }

        // Call Nominatim API from server (no CORS issues)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
            {
                headers: {
                    'Accept-Language': 'en',
                    'User-Agent': 'NagarSathi-CivicApp/1.0 (contact@nagarsathi.app)',
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Nominatim API error: ${response.status}`);
        }

        const data = await response.json();

        res.json({
            success: true,
            data: {
                display_name: data.display_name,
                address: data.address,
                lat: data.lat,
                lon: data.lon,
            },
        });
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get address from coordinates',
            error: error.message,
        });
    }
});

export default router;
