import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { buildAuthorityGeocodingQueries } from '@/components/authority/authority-location';
import type { AuthorityComplaint } from '@/components/authority/store-authority-dashboard';

export type AuthorityGeocodeResult = {
  latitude: number;
  longitude: number;
  matchedQuery: string;
  exactQuery: boolean;
};

type CachedGeocodeResult = {
  cachedAt: number;
  result: AuthorityGeocodeResult | null;
};

const CACHE_PREFIX = '@nogorshomadhan/authority-geocode/v1/';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 180;
const memoryCache = new Map<string, AuthorityGeocodeResult | null>();

let permissionPromise: Promise<boolean> | null = null;
let geocodeQueue: Promise<void> = Promise.resolve();

const getCacheKey = (query: string) =>
  `${CACHE_PREFIX}${encodeURIComponent(query.trim().toLowerCase())}`;

async function readCachedResult(
  query: string,
): Promise<AuthorityGeocodeResult | null | undefined> {
  if (memoryCache.has(query)) return memoryCache.get(query);

  try {
    const raw = await AsyncStorage.getItem(getCacheKey(query));
    if (!raw) return undefined;

    const cached = JSON.parse(raw) as CachedGeocodeResult;
    if (Date.now() - cached.cachedAt > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(getCacheKey(query));
      return undefined;
    }

    memoryCache.set(query, cached.result);
    return cached.result;
  } catch {
    return undefined;
  }
}

async function cacheResult(
  query: string,
  result: AuthorityGeocodeResult | null,
) {
  memoryCache.set(query, result);

  try {
    const payload: CachedGeocodeResult = {
      cachedAt: Date.now(),
      result,
    };
    await AsyncStorage.setItem(getCacheKey(query), JSON.stringify(payload));
  } catch {
    // A cache failure must not prevent the authority map from loading.
  }
}

function enqueueGeocode<T>(task: () => Promise<T>): Promise<T> {
  const result = geocodeQueue.then(task, task);
  geocodeQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export async function ensureAuthorityGeocodingPermission() {
  if (process.env.EXPO_OS !== 'android') return true;
  if (permissionPromise) return permissionPromise;

  permissionPromise = (async () => {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.granted) return true;

    const requested = await Location.requestForegroundPermissionsAsync();
    return requested.granted;
  })().finally(() => {
    permissionPromise = null;
  });

  return permissionPromise;
}

export async function geocodeAuthorityComplaint(
  complaint: AuthorityComplaint,
): Promise<AuthorityGeocodeResult | null> {
  const queries = buildAuthorityGeocodingQueries(complaint);
  if (queries.length === 0) return null;

  const primaryQuery = queries[0];
  const cached = await readCachedResult(primaryQuery);
  if (cached !== undefined) return cached;

  return enqueueGeocode(async () => {
    const queuedCached = await readCachedResult(primaryQuery);
    if (queuedCached !== undefined) return queuedCached;

    for (let index = 0; index < queries.length; index += 1) {
      const query = queries[index];

      try {
        const locations = await Location.geocodeAsync(query);
        const location = locations[0];

        if (location) {
          const result: AuthorityGeocodeResult = {
            latitude: location.latitude,
            longitude: location.longitude,
            matchedQuery: query,
            exactQuery: index === 0,
          };

          await cacheResult(primaryQuery, result);
          return result;
        }
      } catch {
        // Try a less specific address before reporting that no pin is available.
      }
    }

    await cacheResult(primaryQuery, null);
    return null;
  });
}
