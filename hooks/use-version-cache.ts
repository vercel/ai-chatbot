"use client";

import { useState, useCallback, useRef } from "react";
import type { DBMessage } from "@/lib/db/schema";

interface VersionCache {
  [versionGroupId: string]: {
    versions: DBMessage[];
    lastFetched: number;
    currentVersionIndex: number;
  };
}

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const MAX_CACHED_VERSIONS = 10; // Cache first 10 versions for instant access

export function useVersionCache() {
  const cacheRef = useRef<VersionCache>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const getCachedVersions = useCallback((versionGroupId: string) => {
    const cached = cacheRef.current[versionGroupId];
    if (!cached) return null;

    const isExpired = Date.now() - cached.lastFetched > CACHE_EXPIRY;
    if (isExpired) {
      delete cacheRef.current[versionGroupId];
      return null;
    }

    return cached;
  }, []);

  const setCachedVersions = useCallback((
    versionGroupId: string,
    versions: DBMessage[],
    currentVersionIndex: number
  ) => {
    // Only cache first 10 versions to keep memory usage reasonable
    const versionsToCache = versions.slice(0, MAX_CACHED_VERSIONS);
    
    cacheRef.current[versionGroupId] = {
      versions: versionsToCache,
      lastFetched: Date.now(),
      currentVersionIndex,
    };
  }, []);

  const setLoading = useCallback((versionGroupId: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [versionGroupId]: loading,
    }));
  }, []);

  const isLoading = useCallback((versionGroupId: string) => {
    return loadingStates[versionGroupId] || false;
  }, [loadingStates]);

  const clearCache = useCallback((versionGroupId?: string) => {
    if (versionGroupId) {
      delete cacheRef.current[versionGroupId];
    } else {
      cacheRef.current = {};
    }
  }, []);

  const preloadVersions = useCallback(async (
    versionGroupId: string,
    fetchFunction: () => Promise<DBMessage[]>
  ) => {
    const cached = getCachedVersions(versionGroupId);
    if (cached) return cached;

    setLoading(versionGroupId, true);
    try {
      const versions = await fetchFunction();
      // Note: isCurrentVersion is not available in new versioning system
      // Assuming the first version is the current one for now
      const currentVersionIndex = 0;
      
      setCachedVersions(versionGroupId, versions, Math.max(0, currentVersionIndex));
      
      return {
        versions,
        currentVersionIndex: Math.max(0, currentVersionIndex),
        lastFetched: Date.now(),
      };
    } finally {
      setLoading(versionGroupId, false);
    }
  }, [getCachedVersions, setCachedVersions, setLoading]);

  return {
    getCachedVersions,
    setCachedVersions,
    preloadVersions,
    isLoading,
    clearCache,
  };
}
