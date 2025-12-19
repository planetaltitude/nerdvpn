# nerdvpn

Chrome extension that redirects visits to specific domains:

- `x.com` → `xcancel.com` (allows logged out X browsing)
- `reddit.com` → `reddit.nerdvpn.de` (makes Reddit work again on VPNs)
- Paywalled news sites (e.g., nytimes.com, washingtonpost.com, wsj.com, ft.com, economist.com, bloomberg.com) → archive.is snapshots

## Getting started

1. Install dependencies: none — this extension is entirely static.
2. Load the extension in Chrome:
   - Open `chrome://extensions`.
   - Toggle **Developer mode**.
   - Click **Load unpacked** and choose the repository root.
3. Navigate to `x.com`, `reddit.com`, or supported paywalled news sites; you will be redirected automatically (paths, queries, and fragments are preserved).
4. To toggle redirects, open the background page at `chrome-extension://<extension-id>/background.html` (copy the extension ID from `chrome://extensions`) and use the checkboxes for X, Reddit, and archive.is redirects.

Tested - 12/17/25.

## Recommended companion extensions

- **YTBlock** – strips YouTube recommendations and Shorts to keep the homepage and sidebar distraction-free.
- **Newsfeed Eradicator** – hides algorithmic social feeds (Facebook, X, LinkedIn, YouTube, etc.) while leaving notifications and messaging accessible.
- **Unpaywalled** – surfaces legal, open-access versions of academic papers and journalism when available.
