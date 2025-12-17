import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

/**
 * Cloudinary Configuration
 * Used for uploading issue images and resolution proofs
 */
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage configuration for issue images
const issueStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'nagarsathi/issues',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
    },
});

// Storage configuration for resolution proof images
const resolutionStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'nagarsathi/resolutions',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
    },
});

// Multer upload middleware for issues (max 5 images)
export const uploadIssueImages = multer({
    storage: issueStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
}).array('images', 5);

// Multer upload middleware for resolution proof (max 3 images)
export const uploadResolutionImages = multer({
    storage: resolutionStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
}).array('images', 3);

// Helper function to delete images from Cloudinary
export const deleteImage = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
    }
};

export default cloudinary;
