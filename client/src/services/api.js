import axios from 'axios';

/**
 * API Service
 * Centralized Axios instance with interceptors
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds
});

// Token provider to get fresh tokens
let tokenProvider = null;

export const setTokenProvider = (provider) => {
    tokenProvider = provider;
};

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        // Get token from provider if available (preferred)
        if (tokenProvider) {
            try {
                const token = await tokenProvider();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                } else {
                    console.warn('[API Debug] Token provider returned null');
                }
            } catch (error) {
                console.error('Error fetching token from provider:', error);
            }
        }
        // Fallback to localStorage (legacy/backup)
        else {
            const token = localStorage.getItem('clerk-token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || 'Something went wrong';

        // Handle specific error codes
        if (error.response?.status === 401) {
            // Clear token and redirect to login if needed
            localStorage.removeItem('clerk-token');
            // Could dispatch an event or redirect here
        }

        return Promise.reject({
            message,
            status: error.response?.status,
            errors: error.response?.data?.errors,
        });
    }
);

// ============================================
// API ENDPOINTS
// ============================================

// User endpoints
export const userApi = {
    syncUser: () => api.post('/users/sync'),
    getMe: () => api.get('/users/me'),
    updateProfile: (data) => api.put('/users/me', data),
    getUserById: (id) => api.get(`/users/${id}`),
};

// Issue endpoints
export const issueApi = {
    getIssues: (params) => api.get('/issues', { params }),
    getFilterCounts: () => api.get('/issues/filter-counts'),
    getIssueById: (id) => api.get(`/issues/${id}`),
    getIssuesForMap: (params) => api.get('/issues/map', { params }),
    getMyIssues: (params) => api.get('/issues/user/my-issues', { params }),
    createIssue: (formData) =>
        api.post('/issues', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    updateIssue: (id, formData) =>
        api.put(`/issues/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    deleteIssue: (id) => api.delete(`/issues/${id}`),
};

// Comment endpoints
export const commentApi = {
    getComments: (issueId, params) =>
        api.get(`/issues/${issueId}/comments`, { params }),
    addComment: (issueId, content) =>
        api.post(`/issues/${issueId}/comments`, { content }),
    deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
};

// Upvote endpoints
export const upvoteApi = {
    toggleUpvote: (issueId) => api.post(`/issues/${issueId}/upvote`),
    getUpvoteStatus: (issueId) => api.get(`/issues/${issueId}/upvote/status`),
    getUpvoteCount: (issueId) => api.get(`/issues/${issueId}/upvote/count`),
};

// Admin endpoints
export const adminApi = {
    getAllIssues: (params) => api.get('/admin/issues', { params }),
    updateIssueStatus: (id, data) => api.put(`/admin/issues/${id}/status`, data),
    resolveIssue: (id, formData) =>
        api.post(`/admin/issues/${id}/resolve`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    getAnalytics: (params) => api.get('/admin/analytics', { params }),
    getAllUsers: (params) => api.get('/admin/users', { params }),
    updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
    deleteIssue: (id) => api.delete(`/issues/${id}`),
};

export default api;
