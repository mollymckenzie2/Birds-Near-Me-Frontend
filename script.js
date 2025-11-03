const backendURL = "https://birds-near-me-backend-lknu.onrender.com";
const birdsDiv = document.getElementById("birds");

console.log('script.js loaded');


const SEARCH_RADII_MILES = [3, 5, 10];



// Filter state and UI globals
let userLat = null;
let userLng = null;
let filtersApplied = false;
const filterState = { lat: null, lng: null, distance: 10, days: 3 };
let filterMap = null;
let filterMarker = null;
let initialLoadComplete = false;

let searchStatusEl = null;
function ensureSearchStatusEl() {
  if (searchStatusEl) return searchStatusEl;
  const el = document.getElementById('search-status');
  if (el) { searchStatusEl = el; return searchStatusEl; }

  const statusEl = document.createElement('div');
  statusEl.id = 'search-status';
  statusEl.className = 'compass-container';

  const header = document.querySelector('.container h1');
  let inserted = false;
  if (header && header.parentNode) {
   
    header.parentNode.insertBefore(statusEl, header.nextSibling);
    statusEl.style.position = 'relative';
    statusEl.style.marginTop = '64px';
    inserted = true;
  } else {
    
  statusEl.style.position = 'fixed';
  statusEl.style.top = '120px';
    statusEl.style.left = '50%';
    statusEl.style.transform = 'translateX(-50%)';
  }
  statusEl.style.display = 'flex';
  statusEl.style.zIndex = '9999';
 

  const container = birdsDiv && birdsDiv.parentNode ? birdsDiv.parentNode : document.body;
  if (!inserted) container.insertBefore(statusEl, birdsDiv || container.firstChild);
  searchStatusEl = statusEl;
  console.log('ensureSearchStatusEl created', searchStatusEl);
  return searchStatusEl;
}

function showSearchStatus(statusText) {
  const statusEl = ensureSearchStatusEl();
  statusEl.innerHTML = '';
  
  const loaderDiv = document.createElement('div');
  loaderDiv.className = 'pixel-loader-container';
  loaderDiv.innerHTML = `
  <svg class="pl pixelated-compass" viewBox="0 0 160 160" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000"></stop>
          <stop offset="100%" stop-color="#fff"></stop>
        </linearGradient>
        <mask id="mask1">
          <rect x="0" y="0" width="160" height="160" fill="url(#grad)"></rect>
        </mask>
        <mask id="mask2">
          <rect x="28" y="28" width="104" height="104" fill="url(#grad)"></rect>
        </mask>
      </defs>
      <g>
        <g class="pl__ring-rotate">
          <circle class="pl__ring-stroke" cx="80" cy="80" r="72" fill="none" stroke="hsl(223,90%,55%)" stroke-width="16" stroke-dasharray="452.39 452.39" stroke-dashoffset="452" stroke-linecap="round" transform="rotate(-45,80,80)"></circle>
        </g>
      </g>
      <g mask="url(#mask1)">
        <g class="pl__ring-rotate">
          <circle class="pl__ring-stroke" cx="80" cy="80" r="72" fill="none" stroke="hsl(193,90%,55%)" stroke-width="16" stroke-dasharray="452.39 452.39" stroke-dashoffset="452" stroke-linecap="round" transform="rotate(-45,80,80)"></circle>
        </g>
      </g>
      <g>
        <g stroke-width="4" stroke-dasharray="12 12" stroke-dashoffset="12" stroke-linecap="round" transform="translate(80,80)">
          <polyline class="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(-135,0,0) translate(0,40)"></polyline>
          <polyline class="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(-90,0,0) translate(0,40)"></polyline>
          <polyline class="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(-45,0,0) translate(0,40)"></polyline>
          <polyline class="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(0,0,0) translate(0,40)"></polyline>
          <polyline class="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(45,0,0) translate(0,40)"></polyline>
          <polyline class="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(90,0,0) translate(0,40)"></polyline>
          <polyline class="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(135,0,0) translate(0,40)"></polyline>
          <polyline class="pl__tick" stroke="hsl(223,10%,90%)" points="0,2 0,14" transform="rotate(180,0,0) translate(0,40)"></polyline>
        </g>
      </g>
      <g mask="url(#mask1)">
        <g stroke-width="4" stroke-dasharray="12 12" stroke-dashoffset="12" stroke-linecap="round" transform="translate(80,80)">
          <polyline class="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(-135,0,0) translate(0,40)"></polyline>
          <polyline class="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(-90,0,0) translate(0,40)"></polyline>
          <polyline class="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(-45,0,0) translate(0,40)"></polyline>
          <polyline class="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(0,0,0) translate(0,40)"></polyline>
          <polyline class="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(45,0,0) translate(0,40)"></polyline>
          <polyline class="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(90,0,0) translate(0,40)"></polyline>
          <polyline class="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(135,0,0) translate(0,40)"></polyline>
          <polyline class="pl__tick" stroke="hsl(223,90%,80%)" points="0,2 0,14" transform="rotate(180,0,0) translate(0,40)"></polyline>
        </g>
      </g>
      <g>
        <g transform="translate(64,28)">
          <g class="pl__arrows" transform="rotate(45,16,52)">
            <path fill="hsl(3,90%,55%)" d="M17.998,1.506l13.892,43.594c.455,1.426-.56,2.899-1.998,2.899H2.108c-1.437,0-2.452-1.473-1.998-2.899L14.002,1.506c.64-2.008,3.356-2.008,3.996,0Z"></path>
            <path fill="hsl(223,10%,90%)" d="M14.009,102.499L.109,58.889c-.453-1.421,.559-2.889,1.991-2.889H29.899c1.433,0,2.444,1.468,1.991,2.889l-13.899,43.61c-.638,2.001-3.345,2.001-3.983,0Z"></path>
          </g>
        </g>
      </g>
      <g mask="url(#mask2)">
        <g transform="translate(64,28)">
          <g class="pl__arrows" transform="rotate(45,16,52)">
            <path fill="hsl(333,90%,55%)" d="M17.998,1.506l13.892,43.594c.455,1.426-.56,2.899-1.998,2.899H2.108c-1.437,0-2.452-1.473-1.998-2.899L14.002,1.506c.64-2.008,3.356-2.008,3.996,0Z"></path>
            <path fill="hsl(223,90%,80%)" d="M14.009,102.499L.109,58.889c-.453-1.421,.559-2.889,1.991-2.889H29.899c1.433,0,2.444,1.468,1.991,2.889l-13.899,43.61c-.638,2.001-3.345,2.001-3.983,0Z"></path>
          </g>
        </g>
      </g>
    </svg>
  `;
  statusEl.appendChild(loaderDiv);
  if (statusText) {
    const textEl = document.createElement('div');
    textEl.className = 'loading-text';
    textEl.textContent = statusText;
    statusEl.appendChild(textEl);
  }
  statusEl.style.display = 'flex';
  console.log('showSearchStatus:', statusText);
}

function hideSearchStatus() {
  if (!searchStatusEl) return;
  searchStatusEl.innerHTML = '';
  searchStatusEl.style.display = 'none';
  console.log('hideSearchStatus');
}


function formatDate(obsDt) {
  const date = new Date(obsDt);
  const options = { month: "long", day: "numeric", hour: "numeric", minute: "numeric" };
  return date.toLocaleString(undefined, options);
}


function obsWithinDays(obsDt, days) {
  if (!obsDt) return false;
  let d = new Date(obsDt);
  if (isNaN(d.getTime())) {
    d = new Date(obsDt.replace(' ', 'T'));
  }
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const diffDays = (now - d) / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}

function fetchWithRadiusRetries(lat, lng, radiiMiles = SEARCH_RADII_MILES, maxResults = 30, recentDays = 3) {
  let attempt = 0;

  
  ensureSearchStatusEl();

  function tryNext() {
    if (attempt >= radiiMiles.length) {
      const last = radiiMiles[radiiMiles.length - 1];
      console.log('fetchWithRadiusRetries: no birds found after all radii');
      hideSearchStatus();
      // consider initial load as complete (no results)
      initialLoadComplete = true;
      updateFilterApplyVisibility();
      if (filtersApplied) {
        birdsDiv.innerHTML = '<p class="no-birds-message">No Birds Found - Adjust Filters</p>';
      } else {
        birdsDiv.innerHTML = `<p>no birds found in ${last} miles</p>`;
      }
      return;
    }

  const distMiles = radiiMiles[attempt];
    const distKm = Math.round(distMiles * 1.60934 * 100) / 100;
    const url = `${backendURL}/api/birds?lat=${lat}&lng=${lng}&dist=${distKm}&maxResults=${maxResults}`;
  console.log(`trying radius attempt #${attempt + 1}: ${distMiles} mi (${distKm} km)`);
  
  if (attempt === 0) {
    showSearchStatus('Loading birds');
  } else {
    showSearchStatus(`Searching within ${distMiles} mi`);
  }

    fetch(url)
      .then(res => {
        console.log('fetch response status', res.status);
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        console.log('received', Array.isArray(data) ? `${data.length} items` : data);
        if (!Array.isArray(data) || data.length === 0) {
          attempt++;
          setTimeout(tryNext, 400);
          return;
        }

        const recent = data.filter(b => obsWithinDays(b.obsDt, recentDays));
        console.log('recent filtered count:', recent.length);
        if (recent.length > 0) {
          hideSearchStatus();
          displayBirds(recent, lat, lng);
        } else {
          attempt++;
          setTimeout(tryNext, 400);
        }
      })
      .catch(err => {
        console.error('fetch error', err);
        hideSearchStatus();
        birdsDiv.innerHTML = '<p>Error fetching bird data.</p>';
        
        initialLoadComplete = true;
        updateFilterApplyVisibility();
      });
  }

  tryNext();
}

function fetchBirds(lat, lng) {
  fetchWithRadiusRetries(lat, lng, [3, 5, 10], 30, 3);
}

function haversineDistanceMiles(lat1, lon1, lat2, lon2) {
  function toRad(x) { return x * Math.PI / 180; }
  const R = 3959;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function displayBirds(birds, userLat, userLng) {
  birdsDiv.innerHTML = '';
  console.log('displayBirds', birds.length);
  if (!birds || birds.length === 0) {
    birdsDiv.innerHTML = '<p>No birds found nearby.</p>';
    // initial rendering completed (no birds)
    initialLoadComplete = true;
    updateFilterApplyVisibility();
    return;
  }

  birds.forEach(bird => {
    const card = document.createElement('div');
    card.className = 'bird-card';

    // image: speciesCode maps to a PNG file in the images folder (if present)
    const imgEl = document.createElement('img');
    imgEl.className = 'bird-thumb';
    const speciesCode = bird.speciesCode || bird.speciescode || bird.species;
    imgEl.alt = bird.comName || 'bird image';

    if (!speciesCode) {
      imgEl.style.display = 'none';
    } else {
      
      const candidates = [
        `images/output/${speciesCode}.png`,
        `images/${String(speciesCode).toLowerCase()}.png`,
        `images/output/${String(speciesCode).toLowerCase()}.png`
      ];
      let attempt = 0;
      console.log('trying images for', speciesCode, 'candidates:', candidates);
      imgEl.onerror = () => {
        attempt += 1;
        if (attempt < candidates.length) {
          imgEl.src = candidates[attempt];
        } else {
          imgEl.style.display = 'none';
          console.log('no image found for', speciesCode, 'after trying', candidates);
        }
      };
      imgEl.onload = () => { console.log('loaded image for', speciesCode, imgEl.src); };
      // start with first candidate
      imgEl.src = candidates[0];
    }

    const name = document.createElement('h2');
    name.textContent = bird.comName;

    const count = document.createElement('p');
    count.className = 'quantity';
    count.innerHTML = `<span>Quantity:</span> ${bird.howMany}`;

    const distanceP = document.createElement('p');
    distanceP.className = 'distance';
    if (bird.lat && bird.lng && userLat && userLng) {
      const dist = haversineDistanceMiles(userLat, userLng, bird.lat, bird.lng);
      distanceP.innerHTML = `<span>Distance Away:</span> ${Number(dist).toPrecision(2)} mi`;
    } else {
      distanceP.innerHTML = `<span>Distance Away:</span> Unknown`;
    }

    const seen = document.createElement('p');
    seen.className = 'seen';
    seen.innerHTML = `<span>Seen:</span> ${formatDate(bird.obsDt)}`;

    const sci = document.createElement('p');
    sci.className = 'scientific';
    sci.innerHTML = `<span>Scientific Name:</span> ${bird.sciName}`;

  card.appendChild(imgEl);
  card.appendChild(name);
    card.appendChild(count);
    card.appendChild(distanceP);
    card.appendChild(seen);
    card.appendChild(sci);

    birdsDiv.appendChild(card);
  });

  
  setTimeout(() => {
    const imgs = birdsDiv.querySelectorAll('.bird-thumb');
    imgs.forEach(img => {
      
      if (img.style.display === 'none') return;
      img.classList.add('bounce');
      
      img.addEventListener('animationend', () => img.classList.remove('bounce'), { once: true });

      
      img.addEventListener('click', () => {
        img.classList.remove('bounce');
     
        void img.offsetWidth;
        img.classList.add('bounce');
      });
    });
  }, 80);

  // initial rendering completed successfully
  initialLoadComplete = true;
  updateFilterApplyVisibility();
}

function updateFilterApplyVisibility() {
  const applyBtn = document.getElementById('apply-filters');
  const resetBtn = document.getElementById('reset-filters');
  const filtersBtn = document.getElementById('filters-btn');
  if (!applyBtn || !resetBtn) return;
  if (initialLoadComplete) {
    applyBtn.classList.remove('hidden');
    resetBtn.classList.remove('hidden');
    filtersBtn && filtersBtn.classList.remove('hidden');
  } else {
    applyBtn.classList.add('hidden');
    resetBtn.classList.add('hidden');
    filtersBtn && filtersBtn.classList.add('hidden');
  }
}


function ensureLocationEl() {
  let el = document.getElementById('location-display');
  if (el) return el;
  const header = document.querySelector('.container h1');
  el = document.createElement('div');
  el.id = 'location-display';
  el.className = 'location-display';
  if (header && header.parentNode) {
    header.parentNode.insertBefore(el, header.nextSibling);
  } else {
    document.body.insertBefore(el, document.body.firstChild);
  }
  return el;
}


function showLocationName(lat, lng) {
  const el = ensureLocationEl();
  el.textContent = 'Location: locating...';
 
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error('geo response not ok');
      return res.json();
    })
    .then(data => {
      let place = '';
      if (data && data.address) {
        const a = data.address;
        place = a.city || a.town || a.village || a.hamlet || a.county || a.state || '';
      }
      if (place) {
        el.textContent = `Location: ${place}`;
      } else {
        el.textContent = `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    })
    .catch(err => {
      console.warn('reverse geocode failed', err);
      el.textContent = `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    });
}

function init() {
  console.log('init');
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      console.log('got location', latitude, longitude);
      // store for filters default
      userLat = latitude;
      userLng = longitude;
      filterState.lat = latitude;
      filterState.lng = longitude;
      
      showLocationName(latitude, longitude);
      fetchBirds(latitude, longitude);
      
      initFiltersUI();
    }, err => {
      console.error('geolocation error', err);
      birdsDiv.innerHTML = '<p>Unable to get your location.</p>';
      // still try to wire filters UI (map will use default coords)
      initFiltersUI();
    });
  } else {
    birdsDiv.innerHTML = '<p>Geolocation is not supported by your browser.</p>';
    initFiltersUI();
  }
}

// ------------------ Filters UI logic ------------------
function initFiltersUI() {
  const btn = document.getElementById('filters-btn');
  const panel = document.getElementById('filter-panel');
  const backdrop = document.getElementById('filter-backdrop');
  const closeBtn = document.getElementById('close-filters');
  const applyBtn = document.getElementById('apply-filters');
  const timeGroup = document.getElementById('filter-time');

  if (!btn || !panel) return;

  // hide the Filters button until initial load completes
  btn.classList.add('hidden');
  btn.addEventListener('click', openFilterPanel);
  backdrop.addEventListener('click', closeFilterPanel);
  closeBtn && closeBtn.addEventListener('click', closeFilterPanel);
  applyBtn && applyBtn.addEventListener('click', applyFilters);
  const resetBtn = document.getElementById('reset-filters');
  resetBtn && resetBtn.addEventListener('click', resetFilters);

  // hide apply/reset until initial load completes
  applyBtn && applyBtn.classList.add('hidden');
  resetBtn && resetBtn.classList.add('hidden');

  // time buttons
  if (timeGroup) {
    timeGroup.addEventListener('click', (ev) => {
      const t = ev.target;
      if (!t || !t.dataset) return;
      const days = parseFloat(t.dataset.days);
      if (isNaN(days)) return;
      // set selection
      timeGroup.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
      t.classList.add('selected');
      filterState.days = days;
    });
  }
}

function resetFilters() {
  // clear applied filters and reset UI to defaults
  filtersApplied = false;
  filterState.distance = 10;
  filterState.days = 3;
  filterState.lat = userLat || null;
  filterState.lng = userLng || null;

  // update UI elements
  const distEl = document.getElementById('filter-distance');
  if (distEl) distEl.value = filterState.distance;
  const timeGroup = document.getElementById('filter-time');
  if (timeGroup) {
    timeGroup.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
  }

  // reset marker/map to user location or filterState
  if (filterMap) {
    const lat = filterState.lat || 39.5;
    const lng = filterState.lng || -98.35;
    filterMap.setView([lat, lng], 8);
    if (filterMarker) {
      filterMarker.setLatLng([lat, lng]);
    } else {
      filterMarker = L.marker([lat, lng], { draggable: true }).addTo(filterMap);
    }
    updateFilterCoordsText(lat, lng);
  }

  // close panel and re-run default fetch
  closeFilterPanel();
  hideSearchStatus();
  const lat = userLat || filterState.lat;
  const lng = userLng || filterState.lng;
  if (lat && lng) {
    // restore default search radii and recentDays
    fetchWithRadiusRetries(lat, lng, [3, 5, 10], 30, 3);
  }
}

function openFilterPanel() {
  const panel = document.getElementById('filter-panel');
  const backdrop = document.getElementById('filter-backdrop');
  if (!panel) return;
  panel.classList.add('open');
  backdrop && backdrop.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  backdrop && backdrop.setAttribute('aria-hidden', 'false');
  // initialize map if needed
  setTimeout(() => initFilterMap(), 120);
}

function closeFilterPanel() {
  const panel = document.getElementById('filter-panel');
  const backdrop = document.getElementById('filter-backdrop');
  if (!panel) return;
  panel.classList.remove('open');
  backdrop && backdrop.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  backdrop && backdrop.setAttribute('aria-hidden', 'true');
}

function initFilterMap() {
  // requires Leaflet loaded
  const mapEl = document.getElementById('filter-map');
  if (!mapEl || typeof L === 'undefined') return;
  if (filterMap) {
    filterMap.invalidateSize && filterMap.invalidateSize();
    return;
  }
  const lat = filterState.lat || userLat || 39.5;
  const lng = filterState.lng || userLng || -98.35;
  filterMap = L.map(mapEl, { center: [lat, lng], zoom: 8, scrollWheelZoom: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(filterMap);

  filterMarker = L.marker([lat, lng], { draggable: true }).addTo(filterMap);
  updateFilterCoordsText(lat, lng);

  filterMap.on('click', (ev) => {
    const { lat: clickLat, lng: clickLng } = ev.latlng;
    if (filterMarker) filterMarker.setLatLng([clickLat, clickLng]);
    else filterMarker = L.marker([clickLat, clickLng], { draggable: true }).addTo(filterMap);
    filterState.lat = clickLat;
    filterState.lng = clickLng;
    updateFilterCoordsText(clickLat, clickLng);
  });

  if (filterMarker) {
    filterMarker.on('dragend', () => {
      const p = filterMarker.getLatLng();
      filterState.lat = p.lat; filterState.lng = p.lng;
      updateFilterCoordsText(p.lat, p.lng);
    });
  }
}

function updateFilterCoordsText(lat, lng) {
  const el = document.getElementById('filter-coords');
  if (!el) return;
  el.textContent = `Lat: ${Number(lat).toFixed(4)}, Lon: ${Number(lng).toFixed(4)}`;
}

function applyFilters() {
  const distEl = document.getElementById('filter-distance');
  const panel = document.getElementById('filter-panel');
  let dist = 10;
  if (distEl) dist = Number(distEl.value) || 10;
  if (dist > 100) dist = 100;
  filterState.distance = dist;

  // choose location (filterState or user's location fallback)
  const lat = filterState.lat || userLat;
  const lng = filterState.lng || userLng;
  if (!lat || !lng) {
    alert('No location selected or available for filters.');
    return;
  }

  filtersApplied = true;
  showSearchStatus('Applying filters');
  // close UI
  closeFilterPanel();
  // call the fetcher with a single radius: the distance typed by the user
  fetchWithRadiusRetries(lat, lng, [filterState.distance], 100, filterState.days);
}

// ------------------------------------------------------

window.addEventListener('load', init);
