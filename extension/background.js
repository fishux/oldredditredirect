"use strict";

/**
 * Old Reddit Auto-Redirect
 * ------------------------
 * This background script listens for every navigation request to any reddit domain.
 * If the destination is the modern Reddit interface ("www", "new", "m", etc.), the script
 * rewrites the URL so Firefox immediately loads the classic "old" layout instead.
 *
 * The logic is intentionally verbose and heavily commented to help new developers follow along.
 */

/*
 * The `browser` namespace is standard in Firefox. The optional fallback to `chrome` makes the
 * extension work in other Chromium-based browsers if you ever decide to reuse it.
 */
const extensionAPI = typeof browser !== "undefined" ? browser : chrome;

// Defensive guard: If the WebRequest API is unavailable we log an error instead of throwing.
if (!extensionAPI || !extensionAPI.webRequest || !extensionAPI.webRequest.onBeforeRequest) {
  console.error("Old Reddit Auto-Redirect: The WebRequest API is not available in this browser.");
} else {
  /**
   * The canonical host that serves the classic Reddit interface. Every redirect points here.
   */
  const OLD_REDDIT_HOST = "old.reddit.com";

  /**
   * Some reddit.com subdomains power services (OAuth, APIs, ads, etc.). Redirecting those breaks
   * logins and background requests. We keep them in a set for quick lookups and skip rewriting
   * whenever a request targets one of them.
   */
  const REDDIT_SUBDOMAIN_BLOCKLIST = new Set([
    "old.reddit.com", // Already using the classic layout.
    "oauth.reddit.com", // Used for logging in.
    "gateway.reddit.com", // Powers the new web app's data API.
    "gql.reddit.com", // GraphQL endpoint for the new UI.
    "ads.reddit.com", // Advertising dashboard (no old equivalent).
    "accounts.reddit.com", // Account management portal.
    "events.reddit.com", // Events platform.
    "mod.reddit.com", // Moderator interface.
    "blog.reddit.com" // Corporate blog.
  ]);

  /**
   * reddit also uses the `redd.it` domain. Some subdomains there host images and videos.
   * Rewriting media requests would cause broken images, so we explicitly avoid those as well.
   */
  const REDD_IT_MEDIA_SUBDOMAINS = new Set([
    "i.redd.it", // Static images
    "v.redd.it", // Hosted videos
    "preview.redd.it", // Thumbnails and previews
    "styles.redd.it" // CSS and theme assets
  ]);

  /**
   * Helper that decides whether a hostname belongs to Reddit's main site (e.g. reddit.com,
   * www.reddit.com, new.reddit.com) and therefore should be redirected.
   */
  function isStandardRedditHost(hostname) {
    return hostname === "reddit.com" || hostname.endsWith(".reddit.com");
  }

  /**
   * Helper that determines whether a hostname is one of the short-link domains (redd.it).
   */
  function isShortLinkHost(hostname) {
    return hostname === "redd.it" || hostname.endsWith(".redd.it");
  }

  /**
   * Main redirect handler. Firefox calls this function before it actually loads a URL.
   * We can inspect the request and optionally return a new destination.
   */
  function handleRequest(details) {
    try {
      // The URL constructor gives us easy access to parts of the address (hostname, path, etc.).
      const url = new URL(details.url);
      const hostname = url.hostname.toLowerCase();

      // 1) Skip anything already on old.reddit.com or explicitly blocklisted.
      if (REDDIT_SUBDOMAIN_BLOCKLIST.has(hostname)) {
        return {}; // Returning an empty object tells Firefox to continue without changes.
      }

      // 2) Skip image/video subdomains on redd.it (they do not have "old" equivalents).
      if (REDD_IT_MEDIA_SUBDOMAINS.has(hostname)) {
        return {};
      }

      // 3) Regular reddit hosts (www, new, m, amp, etc.). They all redirect to old.reddit.com.
      if (isStandardRedditHost(hostname)) {
        url.hostname = OLD_REDDIT_HOST;
        return { redirectUrl: url.toString() };
      }

      // 4) Short links like https://redd.it/abc123 should also land on old.reddit.com.
      if (isShortLinkHost(hostname)) {
        // Only rewrite plain redd.it links. Subdomains such as i.redd.it were already skipped above.
        if (hostname === "redd.it") {
          url.hostname = OLD_REDDIT_HOST;
          return { redirectUrl: url.toString() };
        }

        return {};
      }

      // 5) If we reach this point the URL does not belong to Reddit, so we leave it alone.
      return {};
    } catch (error) {
      // The URL constructor can throw on malformed addresses. We log and allow the request through.
      console.error("Old Reddit Auto-Redirect: Failed to process", details.url, error);
      return {};
    }
  }

  // Finally we register the handler above. "blocking" permission lets us supply a redirect target.
  extensionAPI.webRequest.onBeforeRequest.addListener(
    handleRequest,
    {
      urls: [
        "*://reddit.com/*",
        "*://*.reddit.com/*",
        "*://redd.it/*",
        "*://*.redd.it/*"
      ],
      types: ["main_frame", "sub_frame"] // Only trigger on top-level pages and embedded frames.
    },
    ["blocking"]
  );
}
