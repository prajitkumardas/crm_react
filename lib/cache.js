// Simple in-memory cache for performance optimization
class Cache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });

    // Auto-cleanup expired entries
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Get cache size for debugging
  size() {
    return this.cache.size;
  }
}

// Create singleton instance
export const cache = new Cache();

// Cache wrapper for Supabase queries
export function cachedQuery(queryFn, cacheKey, ttl = 5 * 60 * 1000) {
  return async (...args) => {
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Execute query
    const result = await queryFn(...args);

    // Cache result
    cache.set(cacheKey, result, ttl);

    return result;
  };
}

// Cache invalidation helpers
export const cacheKeys = {
  clients: (orgId) => `clients_${orgId}`,
  packages: (orgId) => `packages_${orgId}`,
  clientPackages: (orgId) => `client_packages_${orgId}`,
  dashboardStats: (orgId) => `dashboard_stats_${orgId}`,
  notifications: (orgId) => `notifications_${orgId}`,
};

export function invalidateCache(pattern) {
  for (const [key] of cache.cache) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

// React hook for cached data
import { useState, useEffect, useCallback } from 'react';

export function useCachedData(cacheKey, fetchFn, dependencies = [], ttl = 5 * 60 * 1000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      let result = cache.get(cacheKey);

      if (!result) {
        // Fetch fresh data
        result = await fetchFn();
        cache.set(cacheKey, result, ttl);
      }

      setData(result);
    } catch (err) {
      setError(err);
      console.error('Error fetching cached data:', err);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetchFn, ttl]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  const refetch = useCallback(() => {
    cache.delete(cacheKey);
    fetchData();
  }, [cacheKey, fetchData]);

  return { data, loading, error, refetch };
}