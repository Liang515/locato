// LatLngLocator - Modern client-side coordinate lookup & history tracker

document.addEventListener('DOMContentLoaded', () => {
  // --- State Variables ---
  let map;
  let marker;
  let activeLayer;
  let currentLat = 25.030000;
  let currentLng = 121.560000;
  let currentAddress = '';
  let activePrecision = 6;
  let historyData = [];
  let suggestions = [];
  let suggestionIndex = -1;

  // --- Constants ---
  const DEFAULT_LAT = 25.030000;
  const DEFAULT_LNG = 121.560000;
  
  // --- Leaflet Tile Layers ---
  const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  const satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  });

  // --- DOM Elements ---
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const toggleHistoryBtn = document.getElementById('toggle-history-btn');
  const closeHistoryBtn = document.getElementById('close-history-btn');
  const historyDrawer = document.getElementById('history-drawer');
  const historyList = document.getElementById('history-list');
  const historyEmptyState = document.getElementById('history-empty-state');
  const clearAllBtn = document.getElementById('clear-all-btn');
  const exportCsvBtn = document.getElementById('export-csv-btn');
  
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const suggestionsList = document.getElementById('suggestions-list');

  const latVal = document.getElementById('lat-val');
  const lngVal = document.getElementById('lng-val');
  const precisionSelect = document.getElementById('precision-select');
  const btnCopyLatlng = document.getElementById('btn-copy-latlng');
  const locateBtn = document.getElementById('locate-btn');
  const panelToggleBtn = document.getElementById('panel-toggle-btn');
  const addressText = document.getElementById('address-text');
  
  const layerOsmBtn = document.getElementById('layer-osm-btn');
  const layerSatBtn = document.getElementById('layer-sat-btn');
  
  const toastNotification = document.getElementById('toast-notification');
  const toastMessage = document.getElementById('toast-message');

  // --- Initialize App ---
  function init() {
    initIcons();
    initTheme();
    initPrecision();
    initMap();
    initHistory();
    setupEventListeners();
  }

  // Initialize Lucide Icons
  function initIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // --- Theme Management ---
  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.setAttribute('data-theme', 'dark');
      updateThemeIcon('dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      updateThemeIcon('light');
    }
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  }

  function updateThemeIcon(theme) {
    themeToggleBtn.innerHTML = theme === 'dark' 
      ? '<i data-lucide="sun"></i>' 
      : '<i data-lucide="moon"></i>';
    initIcons();
  }

  // --- Precision Management ---
  function initPrecision() {
    const savedPrecision = localStorage.getItem('precision');
    if (savedPrecision) {
      activePrecision = parseInt(savedPrecision, 10);
      precisionSelect.value = activePrecision;
    }
  }

  function handlePrecisionChange(e) {
    activePrecision = parseInt(e.target.value, 10);
    localStorage.setItem('precision', activePrecision);
    updateCoordDisplay();
  }

  // --- Map Management ---
  function initMap() {
    // Fix default Leaflet icon paths
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    // Create Leaflet map
    map = L.map('map', {
      zoomControl: true,
      zoomAnimation: true,
      fadeAnimation: true
    }).setView([DEFAULT_LAT, DEFAULT_LNG], 13);

    // Add default street layer
    osmLayer.addTo(map);
    activeLayer = osmLayer;

    // Create marker
    marker = L.marker([DEFAULT_LAT, DEFAULT_LNG], {
      draggable: true
    }).addTo(map);

    // Initial coordination display
    updateCoords(DEFAULT_LAT, DEFAULT_LNG, false);
    reverseGeocode(DEFAULT_LAT, DEFAULT_LNG);
  }

  function switchLayer(layerType) {
    if (layerType === 'osm' && activeLayer !== osmLayer) {
      map.removeLayer(satLayer);
      osmLayer.addTo(map);
      activeLayer = osmLayer;
      layerOsmBtn.classList.add('active');
      layerSatBtn.classList.remove('active');
      trackEvent('switch_layer', { layer: 'osm' });
    } else if (layerType === 'sat' && activeLayer !== satLayer) {
      map.removeLayer(osmLayer);
      satLayer.addTo(map);
      activeLayer = satLayer;
      layerSatBtn.classList.add('active');
      layerOsmBtn.classList.remove('active');
      trackEvent('switch_layer', { layer: 'satellite' });
    }
  }

  // Update State Coordinates and Marker
  function updateCoords(lat, lng, moveMarker = true, address = null) {
    currentLat = lat;
    currentLng = lng;
    
    if (moveMarker) {
      marker.setLatLng([lat, lng]);
    }
    
    updateCoordDisplay();

    if (address !== null) {
      updateAddressDisplay(address);
    }

    // Auto-expand mobile bottom coordinate panel on coordinate change
    const coordPanel = document.querySelector('.floating-coord-panel');
    if (coordPanel && coordPanel.classList.contains('collapsed')) {
      coordPanel.classList.remove('collapsed');
      const toggleIcon = document.querySelector('#panel-toggle-btn i');
      if (toggleIcon && window.lucide) {
        toggleIcon.setAttribute('data-lucide', 'chevron-down');
        window.lucide.createIcons();
      }
    }
  }

  function updateCoordDisplay() {
    latVal.querySelector('.val').textContent = currentLat.toFixed(activePrecision);
    lngVal.querySelector('.val').textContent = currentLng.toFixed(activePrecision);
  }

  function updateAddressDisplay(address) {
    currentAddress = address;
    if (address) {
      addressText.innerHTML = `<span>${address}</span>`;
    } else {
      addressText.innerHTML = `<span class="address-empty">點擊地圖或搜尋地址即可查看位置描述...</span>`;
    }
  }

  // Reverse Geocoding (Nominatim API)
  async function reverseGeocode(lat, lng) {
    try {
      addressText.innerHTML = `<span class="address-empty"><i class="loading-spinner"></i> 正在逆查地址...</span>`;
      
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=zh-TW,zh,en`);
      if (!response.ok) throw new Error('Network error');
      
      const data = await response.json();
      const address = data.display_name || `座標: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      updateAddressDisplay(address);
      return address;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      const fallbackAddress = `座標: ${lat.toFixed(activePrecision)}, ${lng.toFixed(activePrecision)} (地址查詢失敗)`;
      updateAddressDisplay(fallbackAddress);
      return fallbackAddress;
    }
  }

  // Geolocation features
  function handleLocateUser() {
    if (!navigator.geolocation) {
      showToast('定位失敗：瀏覽器不支援定位功能');
      return;
    }

    locateBtn.classList.add('loading');
    trackEvent('locate_user_start');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        map.setView([lat, lng], 16, { animate: true });
        updateCoords(lat, lng, true);
        
        // Await reverse geocoding to get address details before saving
        const address = await reverseGeocode(lat, lng);
        
        // Auto-save to history log directly
        addToHistory(lat, lng, address);
        
        showToast('已定位並自動儲存至歷史紀錄！');
        trackEvent('locate_user_success_saved');
        locateBtn.classList.remove('loading');
      },
      (err) => {
        let errMsg = '定位失敗，請稍後再試。';
        if (err.code === err.PERMISSION_DENIED) {
          errMsg = '定位失敗：請開啟瀏覽器定位權限。';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          errMsg = '定位失敗：無法偵測到位置，請確認 GPS 已開啟。';
        } else if (err.code === err.TIMEOUT) {
          errMsg = '定位失敗：連線逾時，請重新再試。';
        }
        
        showToast(errMsg);
        trackEvent('locate_user_error', { code: err.code });
        locateBtn.classList.remove('loading');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  // --- Copy Features & Feedback Toast ---
  function showToast(message) {
    toastMessage.textContent = message;
    toastNotification.classList.add('show');
    
    // Auto hide after 1.5 seconds
    setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 1500);
  }

  async function copyToClipboard(text, description) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`已複製 ${description} 到剪貼簿！`);
      addToHistory(currentLat, currentLng, currentAddress);
      trackEvent('copy_coordinates', { format: description, precision: activePrecision });
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        showToast(`已複製 ${description} 到剪貼簿！`);
        addToHistory(currentLat, currentLng, currentAddress);
        trackEvent('copy_coordinates_fallback', { format: description, precision: activePrecision });
      } catch (fallbackErr) {
        showToast('複製失敗，瀏覽器不支援');
      }
      document.body.removeChild(textArea);
    }
  }

  // --- Address Search Autocomplete (Nominatim Geocoding) ---
  const fetchSuggestions = debounce(async (query) => {
    if (!query || query.trim().length < 2) {
      clearSuggestions();
      return;
    }
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=zh-TW,zh,en`);
      if (!response.ok) throw new Error('Search request failed');
      
      suggestions = await response.json();
      renderSuggestions();
    } catch (error) {
      console.error('Search request error:', error);
    }
  }, 300);

  function renderSuggestions() {
    suggestionsList.innerHTML = '';
    suggestionIndex = -1;

    if (suggestions.length === 0) {
      suggestionsList.classList.remove('show');
      return;
    }

    suggestions.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'suggestion-item';
      li.dataset.index = index;

      const title = item.name || item.display_name.split(',')[0];
      const desc = item.display_name;

      li.innerHTML = `
        <span class="suggestion-title">${title}</span>
        <span class="suggestion-desc">${desc}</span>
      `;

      li.addEventListener('click', () => selectSuggestion(index));
      suggestionsList.appendChild(li);
    });

    suggestionsList.classList.add('show');
  }

  function clearSuggestions() {
    suggestions = [];
    suggestionsList.innerHTML = '';
    suggestionsList.classList.remove('show');
    suggestionIndex = -1;
  }

  function selectSuggestion(index) {
    const selected = suggestions[index];
    if (!selected) return;

    const lat = parseFloat(selected.lat);
    const lng = parseFloat(selected.lon);
    const address = selected.display_name;

    // Pan map and update marker
    map.setView([lat, lng], 16, { animate: true });
    updateCoords(lat, lng, true, address);
    
    // Sync search box
    searchInput.value = selected.display_name;
    
    clearSuggestions();
    
    // Track search suggestion event
    trackEvent('select_search_suggestion', { query: selected.display_name });
    
    // Focus map viewport for mobile/desktop
    document.getElementById('map').focus();
  }

  function handleSearchSubmit() {
    if (suggestions.length > 0 && suggestionIndex >= 0) {
      selectSuggestion(suggestionIndex);
    } else if (suggestions.length > 0) {
      selectSuggestion(0);
    } else {
      const query = searchInput.value.trim();
      if (query) {
        performDirectSearch(query);
      }
    }
  }

  async function performDirectSearch(query) {
    try {
      addressText.innerHTML = `<span class="address-empty"><i class="loading-spinner"></i> 正在搜尋地址...</span>`;
      
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=zh-TW,zh,en`);
      if (!response.ok) throw new Error('Search request failed');
      
      const results = await response.json();
      if (results.length > 0) {
        const item = results[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const address = item.display_name;
        
        map.setView([lat, lng], 16, { animate: true });
        updateCoords(lat, lng, true, address);
        searchInput.value = address;
        clearSuggestions();
        trackEvent('direct_search_success', { query: query });
      } else {
        updateAddressDisplay('找不到該地點，請輸入更精確的關鍵字。');
        trackEvent('direct_search_empty', { query: query });
      }
    } catch (error) {
      console.error('Direct search error:', error);
      updateAddressDisplay('搜尋失敗，請檢查網路連線。');
      trackEvent('direct_search_error', { query: query });
    }
  }

  // --- History Management (LocalStorage) ---
  function initHistory() {
    const savedHistory = localStorage.getItem('latlng_history');
    if (savedHistory) {
      try {
        historyData = JSON.parse(savedHistory);
      } catch (e) {
        historyData = [];
      }
    }
    renderHistory();
  }

  function saveHistoryToStorage() {
    localStorage.setItem('latlng_history', JSON.stringify(historyData));
  }

  function addToHistory(lat, lng, address) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' }) + ' ' + 
                    now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    // Check for duplicates within the last few records to avoid excessive duplicate records
    const latestItem = historyData[0];
    if (latestItem && latestItem.lat.toFixed(6) === lat.toFixed(6) && latestItem.lng.toFixed(6) === lng.toFixed(6)) {
      return; // Skip duplicate records
    }

    const titlePrefix = address ? address.split(',')[0].slice(0, 15) : '選定座標';
    const newItem = {
      id: Date.now().toString(),
      name: `${titlePrefix}`,
      lat: lat,
      lng: lng,
      address: address || '地圖定位點',
      time: dateStr
    };

    historyData.unshift(newItem);
    
    // Limit to 50 items
    if (historyData.length > 50) {
      historyData.pop();
    }

    saveHistoryToStorage();
    renderHistory();
  }

  function deleteHistoryItem(id) {
    historyData = historyData.filter(item => item.id !== id);
    saveHistoryToStorage();
    renderHistory();
  }

  function renameHistoryItem(id, newName) {
    const item = historyData.find(item => item.id === id);
    if (item) {
      item.name = newName.trim();
      saveHistoryToStorage();
    }
  }

  function clearAllHistory() {
    if (historyData.length === 0) return;
    
    if (confirm('確定要清除所有歷史紀錄嗎？這項動作無法復原。')) {
      historyData = [];
      saveHistoryToStorage();
      renderHistory();
      showToast('已清除所有歷史紀錄');
    }
  }

  function renderHistory() {
    if (historyData.length === 0) {
      historyEmptyState.style.display = 'flex';
      historyList.querySelectorAll('.history-item').forEach(item => item.remove());
      return;
    }

    historyEmptyState.style.display = 'none';
    
    // Select existing history item elements
    const existingItems = historyList.querySelectorAll('.history-item');
    const existingIds = Array.from(existingItems).map(item => item.dataset.id);
    const newIds = historyData.map(item => item.id);

    // Remove obsolete items
    existingItems.forEach(item => {
      if (!newIds.includes(item.dataset.id)) {
        item.remove();
      }
    });

    // Render or update items in order
    historyData.forEach((data, index) => {
      let itemEl = historyList.querySelector(`.history-item[data-id="${data.id}"]`);
      
      if (!itemEl) {
        itemEl = document.createElement('div');
        itemEl.className = 'history-item';
        itemEl.dataset.id = data.id;
        
        // We will insert it at the correct index position
        if (index === 0) {
          historyList.insertBefore(itemEl, historyList.firstChild);
        } else {
          const prevEl = historyList.querySelector(`.history-item:nth-child(${index})`);
          if (prevEl) {
            prevEl.after(itemEl);
          } else {
            historyList.appendChild(itemEl);
          }
        }
      }

      itemEl.innerHTML = `
        <div class="history-item-top">
          <div class="history-item-name" contenteditable="true" title="按兩下可編輯名稱" data-id="${data.id}">
            ${data.name}
          </div>
          <span class="history-item-date">${data.time}</span>
        </div>
        <div class="history-item-coords" data-lat="${data.lat}" data-lng="${data.lng}">
          <i data-lucide="map-pin" style="width: 12px; height: 12px;"></i>
          ${data.lat.toFixed(activePrecision)}, ${data.lng.toFixed(activePrecision)}
        </div>
        <div class="history-item-address">${data.address}</div>
        <div class="history-item-actions">
          <button type="button" class="history-item-btn copy-item-btn" data-lat="${data.lat}" data-lng="${data.lng}">
            <i data-lucide="copy" style="width: 12px; height: 12px;"></i> 複製
          </button>
          <button type="button" class="history-item-btn delete delete-item-btn" data-id="${data.id}">
            <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i> 刪除
          </button>
        </div>
      `;
    });

    // Re-bind actions for history list
    bindHistoryItemEvents();
    initIcons();
  }

  function bindHistoryItemEvents() {
    // Coordinate clicking (Jump to coordinate)
    historyList.querySelectorAll('.history-item-coords').forEach(el => {
      el.addEventListener('click', (e) => {
        const lat = parseFloat(el.dataset.lat);
        const lng = parseFloat(el.dataset.lng);
        const address = el.closest('.history-item').querySelector('.history-item-address').textContent;
        
        map.setView([lat, lng], 16, { animate: true });
        updateCoords(lat, lng, true, address);
        
        // On mobile, close history drawer when jumping to coord
        if (window.innerWidth <= 768) {
          closeHistory();
        }
      });
    });

    // Copy buttons
    historyList.querySelectorAll('.copy-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const lat = parseFloat(btn.dataset.lat);
        const lng = parseFloat(btn.dataset.lng);
        const textStr = `${lat.toFixed(activePrecision)}, ${lng.toFixed(activePrecision)}`;
        copyToClipboard(textStr, `[緯度, 經度]`);
      });
    });

    // Delete buttons
    historyList.querySelectorAll('.delete-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        deleteHistoryItem(id);
      });
    });

    // Content editable names (rename)
    historyList.querySelectorAll('.history-item-name').forEach(nameEl => {
      // Avoid adding duplicate listeners
      if (nameEl.dataset.listenerBound === 'true') return;
      nameEl.dataset.listenerBound = 'true';

      nameEl.addEventListener('blur', () => {
        const id = nameEl.dataset.id;
        const newName = nameEl.textContent;
        renameHistoryItem(id, newName);
      });

      nameEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          nameEl.blur();
        }
      });
    });
  }

  // Export history to CSV file
  function exportHistoryToCSV() {
    if (historyData.length === 0) {
      showToast('目前沒有歷史紀錄可供匯出');
      return;
    }

    let csvContent = "\ufeff"; // BOM for Excel encoding UTF-8
    csvContent += "名稱,緯度(Latitude),經度(Longitude),完整地址,建立時間\n";

    historyData.forEach(item => {
      // Escape commas and double quotes for CSV
      const name = `"${item.name.replace(/"/g, '""')}"`;
      const address = `"${item.address.replace(/"/g, '""')}"`;
      const time = `"${item.time}"`;
      csvContent += `${name},${item.lat},${item.lng},${address},${time}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `latlng_history_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- Drawer UI control ---
  function openHistory() {
    historyDrawer.classList.add('open');
    toggleHistoryBtn.classList.add('active');
  }

  function closeHistory() {
    historyDrawer.classList.remove('open');
    toggleHistoryBtn.classList.remove('active');
  }

  // --- Debounce Helper ---
  function debounce(func, delay) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // --- Google Analytics Event Tracker ---
  function trackEvent(name, params = {}) {
    if (typeof gtag === 'function') {
      gtag('event', name, params);
    }
  }

  // --- Set Event Listeners ---
  function setupEventListeners() {
    // Map Interaction Click
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      updateCoords(lat, lng, true);
      reverseGeocode(lat, lng);
    });

    // Marker Drag End
    marker.on('dragend', () => {
      const { lat, lng } = marker.getLatLng();
      updateCoords(lat, lng, false);
      reverseGeocode(lat, lng);
    });

    // Copy Latitude, Longitude (Format: 25.03, 121.56)
    btnCopyLatlng.addEventListener('click', () => {
      const text = `${currentLat.toFixed(activePrecision)}, ${currentLng.toFixed(activePrecision)}`;
      copyToClipboard(text, '緯度, 經度');
    });



    // Click direct coordinates to copy
    latVal.addEventListener('click', () => {
      copyToClipboard(currentLat.toFixed(activePrecision), '緯度');
    });

    lngVal.addEventListener('click', () => {
      copyToClipboard(currentLng.toFixed(activePrecision), '經度');
    });

    // Precision Dropdown Selector
    precisionSelect.addEventListener('change', handlePrecisionChange);

    // Geolocation button click
    if (locateBtn) {
      locateBtn.addEventListener('click', handleLocateUser);
    }

    // Map Layer Switchers
    layerOsmBtn.addEventListener('click', () => switchLayer('osm'));
    layerSatBtn.addEventListener('click', () => switchLayer('sat'));

    // Theme Switcher Button
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Sidebar Toggling Actions
    toggleHistoryBtn.addEventListener('click', () => {
      if (historyDrawer.classList.contains('open')) {
        closeHistory();
      } else {
        openHistory();
      }
    });

    closeHistoryBtn.addEventListener('click', closeHistory);

    // History Actions
    clearAllBtn.addEventListener('click', clearAllHistory);
    exportCsvBtn.addEventListener('click', exportHistoryToCSV);

    // Autocomplete Search input
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      if (!query) {
        clearSuggestions();
      } else {
        fetchSuggestions(query);
      }
    });

    searchInput.addEventListener('keydown', (e) => {
      const items = suggestionsList.querySelectorAll('.suggestion-item');
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (suggestions.length === 0) return;
        suggestionIndex = (suggestionIndex + 1) % suggestions.length;
        updateActiveSuggestion(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (suggestions.length === 0) return;
        suggestionIndex = (suggestionIndex - 1 + suggestions.length) % suggestions.length;
        updateActiveSuggestion(items);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSearchSubmit();
      } else if (e.key === 'Escape') {
        clearSuggestions();
      }
    });

    // Search action buttons
    searchBtn.addEventListener('click', handleSearchSubmit);
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSuggestions();
      searchInput.focus();
    });

    // Mobile bottom coordinate panel toggle
    if (panelToggleBtn) {
      panelToggleBtn.addEventListener('click', () => {
        const coordPanel = document.querySelector('.floating-coord-panel');
        if (coordPanel) {
          const isCollapsed = coordPanel.classList.toggle('collapsed');
          const toggleIcon = panelToggleBtn.querySelector('i');
          if (toggleIcon && window.lucide) {
            toggleIcon.setAttribute('data-lucide', isCollapsed ? 'chevron-up' : 'chevron-down');
            window.lucide.createIcons();
          }
          trackEvent('toggle_mobile_panel', { collapsed: isCollapsed });
        }
      });
    }

    // Click outside search suggestions or history sidebar to close them
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        clearSuggestions();
      }
      
      // Close drawer on click outside for small screen
      if (window.innerWidth <= 768 && 
          historyDrawer.classList.contains('open') && 
          !historyDrawer.contains(e.target) && 
          !toggleHistoryBtn.contains(e.target)) {
        closeHistory();
      }
    });
  }

  // Update active style in suggestions dropdown when navigating via keys
  function updateActiveSuggestion(items) {
    items.forEach((item, idx) => {
      if (idx === suggestionIndex) {
        item.classList.add('active');
        item.scrollIntoView({ block: 'nearest' });
        // Set search value temporarily
        searchInput.value = suggestions[idx].display_name;
      } else {
        item.classList.remove('active');
      }
    });
  }

  // Run initializations
  init();
});
