const RULESET_IDS = {
  x: 'xRedirects',
  reddit: 'redditRedirects',
};

const checkboxX = document.getElementById('toggle-x');
const checkboxReddit = document.getElementById('toggle-reddit');
const statusEl = document.getElementById('status');

function setStatus(message, type = '') {
  statusEl.textContent = message;
  statusEl.className = type ? type : '';
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
}

async function updateRule(ruleId, enabled) {
  const payload = enabled
    ? { enableRulesetIds: [ruleId] }
    : { disableRulesetIds: [ruleId] };

  try {
    await chrome.declarativeNetRequest.updateEnabledRulesets(payload);
    setStatus('Updated redirect settings.', 'success');
  } catch (error) {
    setStatus(`Could not update redirects: ${error.message}`, 'error');
    await syncToggles();
  }
}

checkboxX.addEventListener('change', (event) => {
  updateRule(RULESET_IDS.x, event.target.checked);
});

checkboxReddit.addEventListener('change', (event) => {
  updateRule(RULESET_IDS.reddit, event.target.checked);
});

syncToggles().then(() => setStatus('Loaded current redirect settings.'));
