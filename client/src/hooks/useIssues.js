import { useState, useEffect, useCallback } from 'react';
import { issueApi } from '../services/api';

/**
 * Custom hook for fetching and managing issues
 */
export const useIssues = (initialParams = {}) => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        pages: 1,
        total: 0,
    });
    const [params, setParams] = useState(initialParams);

    const fetchIssues = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Clean up params - remove empty strings and undefined values
            const cleanParams = Object.fromEntries(
                Object.entries(params).filter(([_, value]) => value !== '' && value !== undefined && value !== null)
            );

            const response = await issueApi.getIssues(cleanParams);

            setIssues(response.data.data);
            setPagination({
                page: response.data.page,
                pages: response.data.pages,
                total: response.data.total,
            });
        } catch (err) {
            setError(err.message || 'Failed to fetch issues');
            setIssues([]);
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => {
        fetchIssues();
    }, [fetchIssues]);

    const updateParams = (newParams) => {
        setParams((prev) => ({ ...prev, ...newParams }));
    };

    const resetParams = () => {
        setParams(initialParams);
    };

    const goToPage = (page) => {
        setParams((prev) => ({ ...prev, page }));
    };

    const refetch = () => {
        fetchIssues();
    };

    return {
        issues,
        loading,
        error,
        pagination,
        params,
        updateParams,
        resetParams,
        goToPage,
        refetch,
    };
};

export default useIssues;
