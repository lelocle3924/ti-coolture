import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;

/**
 * Returns Upstash Redis instance if configured in environment, or null.
 * Uses HTTP REST protocol to prevent connection exhaustion in Serverless functions.
 */
export function getRedis(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  redisClient = new Redis({
    url,
    token,
  });

  return redisClient;
}

/**
 * Gets a cached item. Fails gracefully to null if Redis is offline or unconfigured.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    if (!redis) return null;
    return await redis.get<T>(key);
  } catch (err) {
    console.warn(`[Redis] Get cache error for key ${key}:`, err);
    return null;
  }
}

/**
 * Sets a value in cache with a TTL in seconds (default: 180s = 3 minutes).
 */
export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds: number = 180
): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    console.warn(`[Redis] Set cache error for key ${key}:`, err);
  }
}

/**
 * Deletes a single key from cache.
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;
    await redis.del(key);
  } catch (err) {
    console.warn(`[Redis] Delete cache error for key ${key}:`, err);
  }
}
