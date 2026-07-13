import type {
  PrecacheEntry,
  RuntimeCaching,
  SerwistGlobalConfig,
} from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const self: WorkerGlobalScope & typeof globalThis & { __SW_MANIFEST: (import("serwist").PrecacheEntry | string)[] | undefined };

const STATIC_CACHE = "mi-salud-static-v1";

const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ sameOrigin, url }) =>
      sameOrigin &&
      (url.pathname.startsWith("/_next/static/") ||
        /\.(?:css|js|woff2?|png|svg|ico|webp)$/.test(url.pathname)),
    handler: new CacheFirst({
      cacheName: STATIC_CACHE,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 96,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        }),
      ],
    }),
  },
  // Health data, RSC payloads, HTML and Supabase requests must never be cached.
  {
    matcher: /.*/i,
    method: "GET",
    handler: new NetworkOnly(),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
});

serwist.addEventListeners();

// Remove caches created by the previous broad default strategy. Static assets
// are immediately repopulated, while personal responses are discarded.
self.addEventListener("activate", (event) => {
  (event as Event & { waitUntil(promise: Promise<unknown>): void }).waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter(
            (name) =>
              name !== STATIC_CACHE && !name.includes("precache-v2")
          )
          .map((name) => caches.delete(name))
      )
    )
  );
});
