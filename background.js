const RULESET_IDS = {
  x: 'xRedirects',
  reddit: 'redditRedirects',
  archive: 'paywallArchiveRedirects',
};

const DYNAMIC_RULE_ID_START = 10000;
const STORAGE_KEY_PAYWALL_HOSTS = 'userPaywallHosts';
const DEFAULT_PAYWALL_SITES = [
  'nytimes.com',
  'washingtonpost.com',
  'wsj.com',
  'ft.com',
  'economist.com',
  'bloomberg.com',
  'wired.com',
];

const checkboxX = document.getElementById('toggle-x');
const checkboxReddit = document.getElementById('toggle-reddit');
const checkboxArchive = document.getElementById('toggle-archive');
const paywallForm = document.getElementById('add-paywall-form');
const paywallInput = document.getElementById('paywall-host');
const statusEl = document.getElementById('status');
const paywallSitesList = document.getElementById('paywall-sites');

function setStatus(message, type = '') {
  statusEl.textContent = message;
  statusEl.className = type ? type : '';
}

function normalizeHost(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const hasProtocol = /^[a-zA-Z]+:\/\//.test(trimmed);
  const urlLike = hasProtocol ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(urlLike);
    const host = url.hostname.toLowerCase();
    if (!host.includes('.')) {
      return null;
    }
    return host.startsWith('www.') ? host.slice(4) : host;
  } catch {
    return null;
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildDynamicRule(host, index) {
  const escaped = escapeRegex(host);
  return {
    id: DYNAMIC_RULE_ID_START + index,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: {
        regexSubstitution: 'https://archive.is/\\0',
      },
    },
    condition: {
      regexFilter: `^https?://([a-z0-9-]+\\.)?${escaped}/.*`,
      resourceTypes: ['main_frame', 'sub_frame'],
    },
  };
}

async function getStoredHosts() {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEY_PAYWALL_HOSTS);
    const hasStoredValue = Object.prototype.hasOwnProperty.call(result, STORAGE_KEY_PAYWALL_HOSTS);
    const stored = result?.[STORAGE_KEY_PAYWALL_HOSTS];

    if (Array.isArray(stored)) {
      return stored;
    }

    if (hasStoredValue) {
      return [];
    }

    await saveStoredHosts(DEFAULT_PAYWALL_SITES);
    return DEFAULT_PAYWALL_SITES;
  } catch (error) {
    setStatus(`Unable to read saved sites: ${error.message}`, 'error');
    return [];
  }
}

async function saveStoredHosts(hosts) {
  try {
    await chrome.storage.sync.set({ [STORAGE_KEY_PAYWALL_HOSTS]: hosts });
  } catch (error) {
    setStatus(`Could not save site: ${error.message}`, 'error');
  }
}

async function getExistingDynamicRuleIds() {
  try {
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    return rules
      .filter((rule) => rule.id >= DYNAMIC_RULE_ID_START)
      .map((rule) => rule.id);
  } catch (error) {
    setStatus(`Unable to load current redirects: ${error.message}`, 'error');
    return [];
  }
}

async function applyDynamicRules(hosts, enabled) {
  const dynamicRules = hosts.map((host, index) => buildDynamicRule(host, index));
  const existingIds = await getExistingDynamicRuleIds();
  const targetIds = dynamicRules.map((rule) => rule.id);
  const removeRuleIds = Array.from(new Set([...existingIds, ...targetIds]));
  const payload = enabled
    ? { removeRuleIds, addRules: dynamicRules }
    : { removeRuleIds };

  try {
    await chrome.declarativeNetRequest.updateDynamicRules(payload);
  } catch (error) {
    setStatus(`Could not update custom paywall redirects: ${error.message}`, 'error');
  }
}

async function syncDynamicRules(enabled) {
  const hosts = await getStoredHosts();
  await applyDynamicRules(hosts, enabled);
}

async function getEnabledRules() {
  try {
    const result = await chrome.declarativeNetRequest.getEnabledRulesets();
    if (Array.isArray(result)) {
      return new Set(result);
    }

    const ids = result?.rulesetIds ?? result?.enabledRulesets ?? [];
    return new Set(ids);
  } catch (error) {
    setStatus(`Unable to read current state: ${error.message}`, 'error');
    return new Set();
  }
}

async function syncToggles() {
  const enabled = await getEnabledRules();
  checkboxX.checked = enabled.has(RULESET_IDS.x);
  checkboxReddit.checked = enabled.has(RULESET_IDS.reddit);
  checkboxArchive.checked = enabled.has(RULESET_IDS.archive);
  await syncDynamicRules(checkboxArchive.checked);
}

async function updateRule(ruleId, enabled) {
  const payload = enabled
    ? { enableRulesetIds: [ruleId] }
    : { disableRulesetIds: [ruleId] };

  try {
    await chrome.declarativeNetRequest.updateEnabledRulesets(payload);
    setStatus('Updated redirect settings.', 'success');
    return true;
  } catch (error) {
    setStatus(`Could not update redirects: ${error.message}`, 'error');
    await syncToggles();
    return false;
  }
}

function renderPaywallSites(hosts = []) {
  const sortedHosts = [...hosts].sort((a, b) => a.localeCompare(b));

  paywallSitesList.innerHTML = '';

  sortedHosts.forEach((host) => {
    const li = document.createElement('li');
    const label = document.createElement('span');
    label.className = 'site-label';
    label.textContent = host;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-button';
    removeBtn.textContent = '×';

    removeBtn.setAttribute('aria-label', `Remove ${host} from paywall redirects`);
    removeBtn.addEventListener('click', () => removeHost(host));

    li.append(label, removeBtn);
    paywallSitesList.appendChild(li);
  });
}

async function removeHost(host) {
  const hosts = await getStoredHosts();
  const updatedHosts = hosts.filter((item) => item !== host);
  await saveStoredHosts(updatedHosts);
  renderPaywallSites(updatedHosts);
  setStatus(`Removed ${host} from paywall redirects.`, 'success');

  if (checkboxArchive.checked) {
    await syncDynamicRules(true);
  }
}

async function loadAndRenderStoredHosts() {
  const hosts = await getStoredHosts();
  renderPaywallSites(hosts);
  return { hosts };
}

checkboxX.addEventListener('change', (event) => {
  updateRule(RULESET_IDS.x, event.target.checked);
});

checkboxReddit.addEventListener('change', (event) => {
  updateRule(RULESET_IDS.reddit, event.target.checked);
});

checkboxArchive.addEventListener('change', async (event) => {
  const archiveEnabled = event.target.checked;
  const success = await updateRule(RULESET_IDS.archive, archiveEnabled);
  if (success) {
    await syncDynamicRules(archiveEnabled);
  }
});

paywallForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const host = normalizeHost(paywallInput.value);

  if (!host) {
    setStatus('Please enter a valid site (e.g., example.com).', 'error');
    paywallInput.focus();
    return;
  }

  const hosts = await getStoredHosts();

  if (hosts.includes(host)) {
    setStatus(`${host} is already redirected to archive.is.`, 'success');
    paywallInput.value = '';
    return;
  }

  const updatedHosts = [...hosts, host];
  await saveStoredHosts(updatedHosts);
  paywallInput.value = '';
  setStatus(`Added ${host} to paywall redirects.`, 'success');
  renderPaywallSites(updatedHosts);

  if (checkboxArchive.checked) {
    await syncDynamicRules(true);
  }
});

renderPaywallSites([]);
syncToggles()
  .then(() => loadAndRenderStoredHosts())
  .then(() => setStatus('Loaded current redirect settings.'));
