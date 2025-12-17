const redirectTargets = {
  'x.com': 'https://xcancel.com',
  'www.x.com': 'https://xcancel.com',
  'reddit.com': 'https://nerdvpn.reddit.de',
  'www.reddit.com': 'https://nerdvpn.reddit.de'
};

function buildRedirect(url) {
  const originalUrl = new URL(url);
  const targetBase = redirectTargets[originalUrl.host];

  if (!targetBase) {
    return null;
  }

  const targetUrl = new URL(targetBase);
  targetUrl.pathname = originalUrl.pathname;
  targetUrl.search = originalUrl.search;
  targetUrl.hash = originalUrl.hash;
  return targetUrl.toString();
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const redirectUrl = buildRedirect(details.url);

    if (!redirectUrl) {
      return {};
    }

    return { redirectUrl };
  },
  {
    urls: [
      '*://x.com/*',
      '*://www.x.com/*',
      '*://reddit.com/*',
      '*://www.reddit.com/*'
    ]
  },
  ['blocking']
);
