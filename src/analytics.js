// Where the analytics Worker lives. Set VITE_ANALYTICS_URL in your Vercel
// environment (or edit the fallback) to your deployed Worker URL, e.g.
// https://analytics.<your-subdomain>.workers.dev or a custom domain.
export const ANALYTICS_URL =
  import.meta.env.VITE_ANALYTICS_URL || "https://analytics.sladdagiri.workers.dev";

// Fire-and-forget page-view beacon. Sent from the visitor's browser straight to
// the Worker so the Worker sees the visitor's real IP and edge geolocation.
// Never throws; analytics must never break the page.
export function sendBeacon(path) {
  try {
    fetch(`${ANALYTICS_URL}/collect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, referrer: document.referrer || "" }),
      keepalive: true,
      mode: "cors",
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}
