# Download the latest extension version

[Download the latest signed XPI](https://github.com/fishux/oldredditredirect/releases/latest)

# Old Reddit Auto-Redirect (Firefox Extension)

This repository contains a lightweight Firefox WebExtension that automatically converts every
`reddit.com` link you visit into its classic `old.reddit.com` equivalent. The script watches for
navigation requests before Firefox loads them and swaps the destination to the old interface while
leaving Reddit's media and API hosts untouched.

Because this project is meant for a first-time extension author, the code is intentionally kept
small and is heavily commented to explain each line.

---

## File structure

```
oldredditredirect/
├── README.md            ← Setup and usage instructions (this file)
└── extension/
    ├── background.js    ← Redirect logic with detailed comments
    └── manifest.json    ← Firefox extension manifest (permissions, metadata, etc.)
```

---

## How the redirect works

1. `background.js` listens to every top-level navigation (`webRequest.onBeforeRequest`).
2. Each URL is parsed with the built-in `URL` class so we can safely inspect the hostname.
3. Requests that already point to `old.reddit.com`, or to critical infrastructure such as
   `oauth.reddit.com`, `gateway.reddit.com`, `i.redd.it`, etc. are ignored. This avoids breaking logins,
   APIs, or media.
4. If the hostname is a modern Reddit UI (`www.reddit.com`, `new.reddit.com`, `amp.reddit.com`,
   short links like `redd.it`, and many others), the hostname is swapped with `old.reddit.com`.
5. Firefox completes the navigation using the rewritten address, so you always land on the old layout.

Error handling is built in: malformed URLs simply log an error and are allowed through without being
modified. This keeps the extension stable even when Firefox encounters unusual URLs.

---

## Quick test: run it temporarily

Use this to confirm the redirect works before making it permanent.

1. Open Firefox and visit `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…**.
3. Select the `extension/manifest.json` file from this repository.
4. Open a new tab and try visiting `https://www.reddit.com`. You should immediately end up on
   `https://old.reddit.com`.

Temporary add-ons disappear when Firefox restarts—follow the next section to install it permanently.

---

## Permanent installation options

Firefox requires permanently-installed extensions to be signed. Below are two common, no-code
approaches you can choose from on macOS.

### Option A – Firefox Developer Edition (no signing required)

1. [Download Firefox Developer Edition](https://www.mozilla.org/firefox/developer/) for macOS and
   install it alongside your regular Firefox.
2. Launch Developer Edition and go to `about:config`.
3. Search for `xpinstall.signatures.required` and set it to `false` (double-click the entry).
4. Open `about:addons`, click the gear icon, and pick **Install Add-on From File…**.
5. Choose the `extension` folder, highlight `manifest.json`, and confirm. The add-on now installs and
   persists across restarts in Developer Edition.

### Option B – Self-sign the extension through Mozilla Add-ons (works on regular Firefox)

1. Install [Node.js](https://nodejs.org/) if you do not already have it (`brew install node` on macOS).
2. Install Mozilla's helper tool globally: `npm install --global web-ext`.
3. From a terminal, navigate into this project directory and run `web-ext build`. This creates a
   signed-ready ZIP in `web-ext-artifacts/`.
4. Create a free account on the [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/).
5. Choose **Submit a New Add-on**, opt for "On your own" (unlisted) distribution, and upload the ZIP
   created in step 3. Mozilla automatically signs the file and gives you a downloadable `.xpi` package.
6. Open Firefox, go to `about:addons`, click the gear icon, and select **Install Add-on From File…**.
7. Pick the signed `.xpi`. The extension installs permanently and survives browser or computer restarts.

Mozilla's signing service keeps your add-on private—you do not need to publish it publicly in the
store. Whenever you update the code, rebuild and upload again to receive a new signed package.

---

## Customising the redirect rules

Open `extension/background.js` and adjust the sets named `REDDIT_SUBDOMAIN_BLOCKLIST` and
`REDD_IT_MEDIA_SUBDOMAINS` if you encounter Reddit hosts that should be redirected (or skipped).
Every change includes comments explaining what each entry does.

After editing, rebuild and reinstall the add-on using the steps above.

---

## Troubleshooting tips

- If you ever want to temporarily disable the redirect, open `about:addons`, find **Old Reddit
  Auto-Redirect**, and toggle it off.
- To inspect the extension while debugging, return to `about:debugging#/runtime/this-firefox`, click
  the extension, and open the console. Any logged errors (for example, from malformed URLs) will show
  there.
- When using `web-ext build`, you can also run `web-ext run` to launch a temporary Firefox instance
  with the extension preloaded for testing.

Enjoy browsing Reddit with the classic layout!
