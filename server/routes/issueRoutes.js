import express from 'express';
import {
    createIssue,
    getIssues,
    getIssueById,
    updateIssue,
    deleteIssue,
    getMyIssues,
    getIssuesForMap,
    getFilterCounts,
} from '../controllers/issueController.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { uploadIssueImages } from '../config/cloudinary.js';

const router = express.Router();

/**
 * Issue Routes
 * Base path: /api/issues
 */

// Public routes
router.get('/', optionalAuth, getIssues);
router.get('/map', getIssuesForMap);
router.get('/filter-counts', getFilterCounts);
router.get('/:id', optionalAuth, getIssueById);

// Private routes
router.post('/', requireAuth, uploadIssueImages, createIssue);
router.put('/:id', requireAuth, uploadIssueImages, updateIssue);
router.delete('/:id', requireAuth, deleteIssue);
router.get('/user/my-issues', requireAuth, getMyIssues);

export default router;
