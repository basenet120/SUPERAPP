import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useApi = (apiFunction, immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFunction(...args);
      setData(response.data.data);
      return response.data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || err.message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return { data, loading, error, execute, setData };
};

export const usePagination = (apiFunction, defaultParams = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState(null);

  const fetchData = useCallback(async (params = {}, append = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFunction({
        ...defaultParams,
        ...params,
        page: params.page || page
      });

      const { data: newData, pagination: newPagination } = response.data;

      if (append) {
        setData(prev => [...prev, ...newData]);
      } else {
        setData(newData);
      }

      setPagination(newPagination);
      setHasMore(newPagination.page < newPagination.totalPages);
      setPage(newPagination.page + 1);

      return newData;
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || err.message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, defaultParams, page]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchData({}, true);
    }
  }, [fetchData, loading, hasMore]);

  const refresh = useCallback(() => {
    setPage(1);
    setHasMore(true);
    fetchData({ page: 1 }, false);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    hasMore,
    pagination,
    fetchData,
    loadMore,
    refresh,
    setData
  };
};

export default useApi;
