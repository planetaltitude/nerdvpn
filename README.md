# nerdvpn

Chrome extension that redirects visits to specific domains:

- `x.com` → `xcancel.com` (allows logged out X browsing)
- `reddit.com` → `reddit.nerdvpn.de` (makes Reddit work again on VPNs)

## Getting started

1. Install dependencies: none — this extension is entirely static.
2. Load the extension in Chrome:
   - Open `chrome://extensions`.
   - Toggle **Developer mode**.
   - Click **Load unpacked** and choose the repository root.
3. Navigate to `x.com` or `reddit.com`; you will be redirected automatically (paths, queries, and fragments are preserved).
4. To toggle redirects, open the background page at `chrome-extension://<extension-id>/background.html` (copy the extension ID from `chrome://extensions`) and use the X/Reddit checkboxes.

Tested - 12/17/25.
