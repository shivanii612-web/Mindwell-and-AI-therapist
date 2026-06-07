/**
 * server/utils/dashboardCache.js
 *
 * Short-lived Redis cache for dashboard analytics.
 * Reduces repeated MongoDB aggregation queries for admin/therapist stats.
 *
 * Cache TTL: 60 seconds (admin stats don't need to be real-time to the second).
 * Falls back silently when Redis is unavailable — MongoDB is always the source of truth.
 */

import { getCachedData, setCachedData, deleteCachedData } from './redisClient.js';

const CACHE_TTL = 60; // seconds

// ── Cache keys ───────────────────────────────────────────────────────────────
export const CACHE_KEYS = {
    ADMIN_STATS:         'dashboard:admin:stats',
    THERAPIST_COUNT:     'dashboard:admin:therapist_count',
    APPOINTMENT_SUMMARY: 'dashboard:admin:appointment_summary',
    USER_COUNT:          'dashboard:admin:user_count',
};

/**
 * getAdminStatsCache — returns cached admin stats or null.
 * @returns {Promise<object|null>}
 */
export const getAdminStatsCache = () =>
    getCachedData(CACHE_KEYS.ADMIN_STATS);

/**
 * setAdminStatsCache — caches admin stats for 60 seconds.
 * @param {object} stats
 */
export const setAdminStatsCache = (stats) =>
    setCachedData(CACHE_KEYS.ADMIN_STATS, stats, CACHE_TTL);

/**
 * invalidateAdminStatsCache — clears admin stats cache.
 * Call after any write that changes platform-level counts.
 */
export const invalidateAdminStatsCache = () =>
    deleteCachedData(CACHE_KEYS.ADMIN_STATS);

/**
 * withCache — generic cache-or-compute helper.
 *
 * Usage:
 *   const data = await withCache('my:key', 60, async () => {
 *     return await MyModel.find({});
 *   });
 *
 * @param {string}   key      Redis cache key
 * @param {number}   ttl      TTL in seconds
 * @param {Function} fetchFn  Async function returning fresh data
 */
export const withCache = async (key, ttl, fetchFn) => {
    const cached = await getCachedData(key);
    if (cached !== null) return cached;

    const fresh = await fetchFn();
    // Cache result in background — non-blocking, non-fatal
    setCachedData(key, fresh, ttl).catch(() => {});
    return fresh;
};
