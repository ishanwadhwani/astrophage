import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from "axios";

// ── In-memory GET cache 
// 30-second TTL. Revisiting any page within that window returns instantly.

const CACHE_TTL = 5 * 60_000; // 5 minutes

type CacheEntry = { response: AxiosResponse; expires: number };
const responseCache = new Map<string, CacheEntry>();

function cacheKey(config: InternalAxiosRequestConfig): string {
  return (config.baseURL ?? "") + (config.url ?? "") + JSON.stringify(config.params ?? {});
}

/** Call after any write mutation so the next fetch gets fresh data. */
export function invalidateCache(urlFragment?: string) {
  if (!urlFragment) { responseCache.clear(); return; }
  for (const key of responseCache.keys()) {
    if (key.includes(urlFragment)) responseCache.delete(key);
  }
}

// Axios instance 

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // for cross-domain auth cookie
});

// Request interceptor: auth + cache shortcut
// Setting config.adapter per-request overrides only that request; it does NOT
// touch axios.defaults.adapter (which may be the string 'xhr' or 'fetch' in v1).

axiosInstance.interceptors.request.use((config) => {
  // Attach auth token
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  // Return cached response without hitting the network
  if (config.method?.toLowerCase() === "get") {
    const key = cacheKey(config);
    const entry = responseCache.get(key);
    if (entry && Date.now() < entry.expires) {
      config.adapter = () => Promise.resolve({ ...entry.response, config });
    }
  }

  return config;
});

// Response interceptor: populate cache + 401 redirect

axiosInstance.interceptors.response.use(
  (response) => {
    // Store successful GET responses
    if (
      response.config.method?.toLowerCase() === "get" &&
      response.status === 200 &&
      // Don't re-cache responses that were served from cache
      typeof response.config.adapter !== "function"
    ) {
      const key = cacheKey(response.config as InternalAxiosRequestConfig);
      responseCache.set(key, { response, expires: Date.now() + CACHE_TTL });
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      document.cookie = "auth-token=; path=/; max-age=0";
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
