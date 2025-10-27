// Options Page Script
// Firefox compatible version

// Browser API compatibility
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

const DEFAULT_CONFIGS = {
  time: [
    { value: 60, label: '1 min', unit: 's' },
    { value: 120, label: '2 min', unit: 's' },
    { value: 300, label: '5 min', unit: 's' },
    { value: 600, label: '10 min', unit: 's' },
    { value: 900, label: '15 min', unit: 's' },
    { value: 1200, label: '20 min', unit: 's' },
    { value: 1800, label: '30 min', unit: 's' },
    { value: 3600, label: '60 min', unit: 's' }
  ],
  ascent: [
    { value: 100, label: '100 m', unit: 'm' },
    { value: 250, label: '250 m', unit: 'm' },
    { value: 500, label: '500 m', unit: 'm' },
    { value: 1000, label: '1000 m', unit: 'm' },
    { value: 1500, label: '1500 m', unit: 'm' }
  ],
  distance: [
    { value: 1000, label: '1 km', unit: 'm' },
    { value: 2000, label: '2 km', unit: 'm' },
    { value: 5000, label: '5 km', unit: 'm' },
    { value: 10000, label: '10 km', unit: 'm' }
  ]
};

let currentSettings = {
  trackingModes: ['time', 'ascent', 'distance'],
  customConfigs: DEFAULT_CONFIGS
};

// Load settings from storage
function loadSettings() {
  browserAPI.storage.local.get(['vamSettings'], (result) => {
    if (result.vamSettings) {
      currentSettings = result.vamSettings;
    }
    renderSettings();
  });
}

// Render all settings
function renderSettings() {
  // Set tracking modes
  document.getElementById('mode-time').checked = currentSettings.trackingModes.includes('time');
  document.getElementById('mode-ascent').checked = currentSettings.trackingModes.includes('ascent');
  document.getElementById('mode-distance').checked = currentSettings.trackingModes.includes('distance');

  // Render config lists
  renderConfigList('time', currentSettings.customConfigs.time);
  renderConfigList('ascent', currentSettings.customConfigs.ascent);
  renderConfigList('distance', currentSettings.customConfigs.distance);
}

// Render a config list
function renderConfigList(type, configs) {
  const container = document.getElementById(`${type}-list`);
  container.innerHTML = '';

  configs.forEach((config, index) => {
    const item = document.createElement('div');
    item.className = 'config-item';
    // eslint-disable-next-line no-unsanitized/property
    item.innerHTML = `
            <input type="number" class="config-value" value="${config.value}" data-type="${type}" data-index="${index}">
            <input type="text" class="config-label" value="${config.label}" data-type="${type}" data-index="${index}">
            <button class="remove-config" data-type="${type}" data-index="${index}">Remove</button>
        `;
    container.appendChild(item);
  });
}

// Add new config item
function addConfigItem(type) {
  const defaultValues = {
    time: { value: 600, label: '10 min', unit: 's' },
    ascent: { value: 500, label: '500 m', unit: 'm' },
    distance: { value: 5000, label: '5 km', unit: 'm' }
  };

  currentSettings.customConfigs[type].push(defaultValues[type]);
  renderConfigList(type, currentSettings.customConfigs[type]);
}

// Remove config item
function removeConfigItem(type, index) {
  currentSettings.customConfigs[type].splice(index, 1);
  renderConfigList(type, currentSettings.customConfigs[type]);
}

// Update config value
function updateConfigValue(type, index, field, value) {
  if (field === 'value') {
    currentSettings.customConfigs[type][index].value = parseInt(value);
  } else if (field === 'label') {
    currentSettings.customConfigs[type][index].label = value;
  }
}

// Save settings
function saveSettings() {
  // Get tracking modes
  const modes = [];
  if (document.getElementById('mode-time').checked) {modes.push('time');}
  if (document.getElementById('mode-ascent').checked) {modes.push('ascent');}
  if (document.getElementById('mode-distance').checked) {modes.push('distance');}

  currentSettings.trackingModes = modes;

  // Sort configs by value
  Object.keys(currentSettings.customConfigs).forEach(type => {
    currentSettings.customConfigs[type].sort((a, b) => a.value - b.value);
  });

  // Save to storage
  browserAPI.storage.local.set({ vamSettings: currentSettings }, () => {
    showStatus('Settings saved successfully!', 'success');
  });
}

// Reset to defaults
function resetDefaults() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    currentSettings = {
      trackingModes: ['time', 'ascent', 'distance'],
      customConfigs: JSON.parse(JSON.stringify(DEFAULT_CONFIGS))
    };
    renderSettings();
    showStatus('Settings reset to defaults', 'success');
  }
}

// Show status message
function showStatus(message, type) {
  const statusEl = document.getElementById('status-message');
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;
  statusEl.style.display = 'block';

  setTimeout(() => {
    statusEl.style.display = 'none';
  }, 3000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();

  // Add buttons
  document.getElementById('add-time').addEventListener('click', () => addConfigItem('time'));
  document.getElementById('add-ascent').addEventListener('click', () => addConfigItem('ascent'));
  document.getElementById('add-distance').addEventListener('click', () => addConfigItem('distance'));

  // Save and reset buttons
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  document.getElementById('reset-defaults').addEventListener('click', resetDefaults);

  // Event delegation for dynamic elements
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-config')) {
      const type = e.target.dataset.type;
      const index = parseInt(e.target.dataset.index);
      removeConfigItem(type, index);
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.classList.contains('config-value')) {
      const type = e.target.dataset.type;
      const index = parseInt(e.target.dataset.index);
      updateConfigValue(type, index, 'value', e.target.value);
    } else if (e.target.classList.contains('config-label')) {
      const type = e.target.dataset.type;
      const index = parseInt(e.target.dataset.index);
      updateConfigValue(type, index, 'label', e.target.value);
    }
  });
});
