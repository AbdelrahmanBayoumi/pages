/* MetLife Physiotherapy Centers Egypt - Application Logic */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    centers: typeof METLIFE_CENTERS !== 'undefined' ? METLIFE_CENTERS : [],
    filteredCenters: [],
    viewMode: 'grid', // 'grid' | 'split' | 'map'
    selectedGov: '',
    selectedCity: '',
    selectedNetwork: '',
    searchQuery: '',
    favOnly: false,
    favorites: new Set(JSON.parse(localStorage.getItem('metlife_favs') || '[]')),
    mapInstance: null,
    markersGroup: null
  };

  // DOM Elements
  const statsTotalCenters = document.getElementById('stat-total-centers');
  const statsTotalGovs = document.getElementById('stat-total-govs');
  const statsTotalCities = document.getElementById('stat-total-cities');
  const statsTotalFavs = document.getElementById('stat-total-favs');
  
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const govSelect = document.getElementById('gov-select');
  const citySelect = document.getElementById('city-select');
  const networkSelect = document.getElementById('network-select');
  const resetBtn = document.getElementById('reset-btn');
  const favToggleBtn = document.getElementById('fav-toggle-btn');
  
  const viewBtns = document.querySelectorAll('.view-btn');
  const contentArea = document.getElementById('content-area');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalBody = document.getElementById('modal-body');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  // Initializing App
  init();

  function init() {
    state.filteredCenters = [...state.centers];
    populateFilters();
    updateStats();
    setupEventListeners();
    renderView();
  }

  // Populate Dropdown Filters
  function populateFilters() {
    // Populate Governorates
    const govCounts = {};
    state.centers.forEach(c => {
      if (c.governorate_ar) {
        govCounts[c.governorate_ar] = (govCounts[c.governorate_ar] || 0) + 1;
      }
    });

    govSelect.innerHTML = '<option value="">كل المحافظات (All Governorates)</option>';
    Object.keys(govCounts).sort().forEach(gov => {
      const option = document.createElement('option');
      option.value = gov;
      option.textContent = `${gov} (${govCounts[gov]} مركز)`;
      govSelect.appendChild(option);
    });

    // Populate Networks
    const networks = [...new Set(state.centers.map(c => c.network).filter(Boolean))];
    networkSelect.innerHTML = '<option value="">كل الفئات / الشبكات</option>';
    networks.forEach(net => {
      const option = document.createElement('option');
      option.value = net;
      option.textContent = `شبكة ${net}`;
      networkSelect.appendChild(option);
    });

    updateCityFilter();
  }

  function updateCityFilter() {
    const selectedGov = govSelect.value;
    const cities = new Set();
    
    state.centers.forEach(c => {
      if (!selectedGov || c.governorate_ar === selectedGov) {
        if (c.city_ar) cities.add(c.city_ar);
      }
    });

    citySelect.innerHTML = '<option value="">كل المناطق / المدن</option>';
    [...cities].sort().forEach(city => {
      const option = document.createElement('option');
      option.value = city;
      option.textContent = city;
      citySelect.appendChild(option);
    });
  }

  // Update Stats Counters
  function updateStats() {
    const totalCenters = state.centers.length;
    const totalGovs = new Set(state.centers.map(c => c.governorate_ar)).size;
    const totalCities = new Set(state.centers.map(c => c.city_ar)).size;
    
    if (statsTotalCenters) statsTotalCenters.textContent = totalCenters;
    if (statsTotalGovs) statsTotalGovs.textContent = totalGovs;
    if (statsTotalCities) statsTotalCities.textContent = totalCities;
    if (statsTotalFavs) statsTotalFavs.textContent = state.favorites.size;
  }

  // Filtering Engine
  function applyFilters() {
    state.selectedGov = govSelect.value;
    state.selectedCity = citySelect.value;
    state.selectedNetwork = networkSelect.value;
    state.searchQuery = searchInput.value.trim().toLowerCase();

    state.filteredCenters = state.centers.filter(c => {
      // Gov Filter
      if (state.selectedGov && c.governorate_ar !== state.selectedGov) return false;
      // City Filter
      if (state.selectedCity && c.city_ar !== state.selectedCity) return false;
      // Network Filter
      if (state.selectedNetwork && c.network !== state.selectedNetwork) return false;
      // Favorites Filter
      if (state.favOnly && !state.favorites.has(c.id)) return false;
      
      // Search Filter
      if (state.searchQuery) {
        const query = state.searchQuery;
        const matchNameAr = (c.name_ar || '').toLowerCase().includes(query);
        const matchNameEn = (c.name_en || '').toLowerCase().includes(query);
        const matchAddrAr = (c.address_ar || '').toLowerCase().includes(query);
        const matchAddrEn = (c.address_en || '').toLowerCase().includes(query);
        const matchGov = (c.governorate_ar || '').toLowerCase().includes(query);
        const matchCity = (c.city_ar || '').toLowerCase().includes(query);
        const matchPhone = (c.phone1 || '').includes(query) || (c.phone2 || '').includes(query);

        if (!matchNameAr && !matchNameEn && !matchAddrAr && !matchAddrEn && !matchGov && !matchCity && !matchPhone) {
          return false;
        }
      }

      return true;
    });

    renderView();
  }

  // Setup Event Listeners
  function setupEventListeners() {
    // Search input
    searchInput.addEventListener('input', () => {
      clearSearchBtn.classList.toggle('visible', searchInput.value.length > 0);
      applyFilters();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.classList.remove('visible');
      applyFilters();
    });

    // Dropdowns
    govSelect.addEventListener('change', () => {
      updateCityFilter();
      applyFilters();
    });
    citySelect.addEventListener('change', applyFilters);
    networkSelect.addEventListener('change', applyFilters);

    // Reset button
    resetBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.classList.remove('visible');
      govSelect.value = '';
      networkSelect.value = '';
      state.favOnly = false;
      favToggleBtn.classList.remove('active');
      updateCityFilter();
      applyFilters();
    });

    // Favorites toggle button
    favToggleBtn.addEventListener('click', () => {
      state.favOnly = !state.favOnly;
      favToggleBtn.classList.toggle('active', state.favOnly);
      applyFilters();
    });

    // View Switcher Buttons
    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.viewMode = btn.dataset.view;
        renderView();
      });
    });

    // Modal close
    modalCloseBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // Main Render Switcher
  function renderView() {
    // Clean map instance if existing
    if (state.mapInstance) {
      state.mapInstance.remove();
      state.mapInstance = null;
    }

    contentArea.innerHTML = '';

    if (state.filteredCenters.length === 0) {
      renderEmptyState();
      return;
    }

    if (state.viewMode === 'grid') {
      renderGridView();
    } else if (state.viewMode === 'split') {
      renderSplitView();
    } else if (state.viewMode === 'map') {
      renderMapView();
    }
  }

  // Render Grid View
  function renderGridView() {
    const gridEl = document.createElement('div');
    gridEl.className = 'grid-view';

    state.filteredCenters.forEach(center => {
      gridEl.appendChild(createCenterCard(center));
    });

    contentArea.appendChild(gridEl);
  }

  // Render Split View
  function renderSplitView() {
    const splitEl = document.createElement('div');
    splitEl.className = 'split-view';

    const mapContainer = document.createElement('div');
    mapContainer.id = 'map';
    mapContainer.className = 'split-map-container';

    const listContainer = document.createElement('div');
    listContainer.className = 'split-list-container';

    state.filteredCenters.forEach(center => {
      listContainer.appendChild(createCenterCard(center));
    });

    splitEl.appendChild(mapContainer);
    splitEl.appendChild(listContainer);
    contentArea.appendChild(splitEl);

    setTimeout(() => {
      initLeafletMap('map', state.filteredCenters);
    }, 50);
  }

  // Render Full Map View
  function renderMapView() {
    const mapEl = document.createElement('div');
    mapEl.className = 'full-map-view';

    const mapDiv = document.createElement('div');
    mapDiv.id = 'map';
    mapEl.appendChild(mapDiv);

    contentArea.appendChild(mapEl);

    setTimeout(() => {
      initLeafletMap('map', state.filteredCenters);
    }, 50);
  }

  // Render Empty State
  function renderEmptyState() {
    contentArea.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-notes-medical"></i>
        <h3>لا توجد مراكز علاج طبيعي تلمس هذه الفلاتر</h3>
        <p>جرب إعادة ضبط البحث أو اختر محافظة أخرى من القائمة فوق.</p>
      </div>
    `;
  }

  // Create Center Card Element
  function createCenterCard(center) {
    const card = document.createElement('div');
    card.className = 'center-card';
    card.dataset.id = center.id;

    const isFav = state.favorites.has(center.id);
    const hasLocation = center.lat && center.lng;

    card.innerHTML = `
      <div class="card-header">
        <div class="card-badges">
          <span class="badge badge-network"><i class="fa-solid fa-shield-halved"></i> شبكة ${center.network || 'Orange'}</span>
          <span class="badge badge-gov"><i class="fa-solid fa-location-dot"></i> ${center.governorate_ar}</span>
          ${center.city_ar ? `<span class="badge badge-city">${center.city_ar}</span>` : ''}
        </div>
        <button class="fav-btn ${isFav ? 'active' : ''}" title="إضافة للمفضلة" data-id="${center.id}">
          <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
        </button>
      </div>

      <div class="card-body">
        <h3>${center.name_ar}</h3>
        ${center.name_en ? `<div class="name-en">${center.name_en}</div>` : ''}
        
        <div class="address-box">
          <i class="fa-solid fa-map-pin"></i>
          <p>${center.address_ar}</p>
          <button class="copy-addr-btn" title="نسخ العنوان" data-addr="${center.address_ar}">
            <i class="fa-regular fa-copy"></i>
          </button>
        </div>

        <div class="phones-row">
          ${center.phone1 ? `
            <a href="tel:${center.phone1.replace(/\s+/g, '')}" class="phone-link">
              <i class="fa-solid fa-phone"></i> ${center.phone1}
            </a>
          ` : ''}
          ${center.phone2 ? `
            <a href="tel:${center.phone2.replace(/\s+/g, '')}" class="phone-link">
              <i class="fa-solid fa-phone"></i> ${center.phone2}
            </a>
          ` : ''}
        </div>
      </div>

      <div class="card-footer">
        <a href="${center.gmaps || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.name_ar + ' ' + center.governorate_ar)}`}" target="_blank" class="card-btn btn-gmaps">
          <i class="fa-solid fa-diamond-turn-right"></i> خرائط جوجل
        </a>
        <button class="card-btn btn-details" data-id="${center.id}">
          <i class="fa-solid fa-circle-info"></i> التفاصيل
        </button>
      </div>
    `;

    // Card Event Listeners
    const favBtn = card.querySelector('.fav-btn');
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(center.id, favBtn);
    });

    const copyBtn = card.querySelector('.copy-addr-btn');
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(center.address_ar).then(() => {
        alert('تم نسخ العنوان بنجاح! 📋');
      });
    });

    const detailsBtn = card.querySelector('.btn-details');
    detailsBtn.addEventListener('click', () => {
      openModal(center);
    });

    return card;
  }

  // Toggle Favorite
  function toggleFavorite(id, btnEl) {
    if (state.favorites.has(id)) {
      state.favorites.delete(id);
    } else {
      state.favorites.add(id);
    }

    localStorage.setItem('metlife_favs', JSON.stringify([...state.favorites]));
    updateStats();

    if (state.favOnly) {
      applyFilters();
    } else if (btnEl) {
      const isFav = state.favorites.has(id);
      btnEl.classList.toggle('active', isFav);
      btnEl.querySelector('i').className = `fa-${isFav ? 'solid' : 'regular'} fa-heart`;
    }
  }

  // Open Modal Details
  function openModal(center) {
    modalBody.innerHTML = `
      <div style="margin-bottom:1.25rem;">
        <span class="badge badge-network" style="margin-bottom:0.5rem; display:inline-flex;">
          <i class="fa-solid fa-shield-halved"></i> شبكة تأمين MetLife (${center.network})
        </span>
        <h2 style="font-size:1.35rem; font-weight:800; color:var(--text-main); margin-bottom:0.25rem;">${center.name_ar}</h2>
        ${center.name_en ? `<p style="color:var(--text-muted); font-size:0.9rem;">${center.name_en}</p>` : ''}
      </div>

      <div style="background:rgba(7,10,19,0.5); padding:1rem; border-radius:12px; border:1px solid var(--border-color); margin-bottom:1.25rem; display:flex; flex-direction:column; gap:0.75rem;">
        <div>
          <strong style="color:var(--accent-teal); font-size:0.85rem; display:block; margin-bottom:0.25rem;">المحافظة والمنطقة:</strong>
          <span style="color:var(--text-main); font-weight:600;">${center.governorate_ar} - ${center.city_ar}</span>
        </div>

        <div>
          <strong style="color:var(--accent-teal); font-size:0.85rem; display:block; margin-bottom:0.25rem;">العنوان التفصيلي:</strong>
          <p style="color:var(--text-main); line-height:1.4;">${center.address_ar}</p>
        </div>

        ${center.phone1 || center.phone2 ? `
          <div>
            <strong style="color:var(--accent-teal); font-size:0.85rem; display:block; margin-bottom:0.4rem;">أرقام الهواتف والتواصل:</strong>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
              ${center.phone1 ? `<a href="tel:${center.phone1}" class="phone-link"><i class="fa-solid fa-phone"></i> ${center.phone1}</a>` : ''}
              ${center.phone2 ? `<a href="tel:${center.phone2}" class="phone-link"><i class="fa-solid fa-phone"></i> ${center.phone2}</a>` : ''}
            </div>
          </div>
        ` : ''}
      </div>

      <div style="display:flex; gap:0.75rem;">
        <a href="${center.gmaps}" target="_blank" class="card-btn btn-gmaps" style="padding:0.75rem;">
          <i class="fa-solid fa-location-arrow"></i> فتح الموقع في خرائط Google
        </a>
      </div>
    `;

    modalOverlay.classList.add('active');
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
  }

  // Initialize Leaflet Map
  function initLeafletMap(elementId, centers) {
    const mapElement = document.getElementById(elementId);
    if (!mapElement) return;

    // Filter centers with valid coords
    const validCenters = centers.filter(c => c.lat && c.lng);

    // Default center: Cairo / Egypt center
    const defaultLat = 30.0444;
    const defaultLng = 31.2357;

    state.mapInstance = L.map(elementId, {
      zoomControl: true,
      attributionControl: false
    }).setView([defaultLat, defaultLng], 7);

    // Dark Map Tile Layer (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(state.mapInstance);

    const bounds = [];

    validCenters.forEach(c => {
      bounds.push([c.lat, c.lng]);

      const marker = L.circleMarker([c.lat, c.lng], {
        radius: 8,
        fillColor: '#00f5d4',
        color: '#ffffff',
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.8
      }).addTo(state.mapInstance);

      const popupContent = `
        <div class="map-popup-card">
          <h4>${c.name_ar}</h4>
          <p><i class="fa-solid fa-location-dot"></i> ${c.governorate_ar} - ${c.city_ar}</p>
          <p style="font-size:0.75rem; color:#94a3b8;">${c.address_ar}</p>
          ${c.phone1 ? `<a href="tel:${c.phone1}" class="phone-link" style="margin-top:0.4rem; display:inline-flex;"><i class="fa-solid fa-phone"></i> ${c.phone1}</a>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
    });

    if (bounds.length > 0) {
      state.mapInstance.fitBounds(bounds, { padding: [40, 40] });
    }
  }
});
