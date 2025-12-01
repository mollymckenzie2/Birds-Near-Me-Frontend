const backendURL = "https://birds-near-me-backend-lknu.onrender.com";
const birdsDiv = document.getElementById("birds");

console.log('script.js loaded');


const SEARCH_RADII_MILES = [3, 5, 10];




let userLat = null;
let userLng = null;
let filtersApplied = false;
const filterState = { lat: null, lng: null, distance: 10, days: 3 };
let filterMap = null;
let filterMarker = null;
let initialLoadComplete = false;

// Select-Bird UI state
let speciesCache = [];
let speciesDebounce = null;
let selectedSpecies = null;
let selectedSpeciesList = []; // array of strings the user added
let localSpeciesLoaded = false;
let localSpeciesList = []; // {comName, speciesCode}

// helper: normalize strings for comparison
function normalizeForMatch(s) {
  if (!s) return '';
  // remove parentheses content, non-word chars, collapse spaces
  let out = String(s).replace(/\(.*?\)/g, '');
  out = out.replace(/[^\w\s-]/g, ' ');
  out = out.replace(/[_\-]+/g, ' ');
  out = out.replace(/\s+/g, ' ').trim().toLowerCase();
  return out;
}

function loadLocalSpeciesCSV() {
  if (localSpeciesLoaded) return Promise.resolve(localSpeciesList);
  const path = 'GetSpeciesCodes/bird_species_codes.csv';
  return fetch(path).then(r => {
    if (!r.ok) throw new Error('local CSV not found');
    return r.text();
  }).then(txt => {
    const lines = txt.split(/\r?\n/);
    localSpeciesList = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      // simple CSV split on first comma
      const idx = line.indexOf(',');
      if (idx === -1) continue;
      const name = line.slice(0, idx).trim();
      const code = line.slice(idx + 1).trim();
      if (name) localSpeciesList.push({ comName: name, speciesCode: code });
    }
    localSpeciesLoaded = true;
    return localSpeciesList;
  }).catch(err => {
    console.warn('failed to load local species CSV', err);
    localSpeciesLoaded = true; // avoid retrying repeatedly
    localSpeciesList = [];
    return localSpeciesList;
  });
}

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

function fetchWithRadiusRetries(lat, lng, radiiMiles = SEARCH_RADII_MILES, maxResults = 30, recentDays = 3, species = null) {
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
    let url = `${backendURL}/api/birds?lat=${lat}&lng=${lng}&dist=${distKm}&maxResults=${maxResults}`;
    if (species) {
      // prefer passing a species param to the backend if supported
      url += `&species=${encodeURIComponent(species)}`;
    }
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

        // If a species filter was provided but the backend doesn't support it,
        // also apply a client-side filter as a fallback. Match common name or species code (case-insensitive).
        let filteredData = data;
        if (species) {
          const s = String(species).toLowerCase();
          filteredData = data.filter(b => {
            const com = (b.comName || '').toLowerCase();
            const code = String(b.speciesCode || b.species || '').toLowerCase();
            return com === s || code === s || com.includes(s);
          });
        }

        const recent = filteredData.filter(b => obsWithinDays(b.obsDt, recentDays));
        console.log('recent filtered count:', recent.length);
        if (recent.length > 0) {
          showFetchDiagnostics(Array.isArray(data) ? data.length : 0, recent.length);
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
  const selectBtn = document.getElementById('select-btn');
  if (!applyBtn || !resetBtn) return;
  if (initialLoadComplete) {
    applyBtn.classList.remove('hidden');
    resetBtn.classList.remove('hidden');
    filtersBtn && filtersBtn.classList.remove('hidden');
    selectBtn && selectBtn.classList.remove('hidden');
  } else {
    applyBtn.classList.add('hidden');
    resetBtn.classList.add('hidden');
    filtersBtn && filtersBtn.classList.add('hidden');
    selectBtn && selectBtn.classList.add('hidden');
  }
}

// ------------------ Select-Bird UI logic ------------------
function initSelectUI() {
  const btn = document.getElementById('select-btn');
  const panel = document.getElementById('select-panel');
  const backdrop = document.getElementById('select-backdrop');
  const closeBtn = document.getElementById('close-select');
  const searchBtn = document.getElementById('search-bird');
  const resetBtn = document.getElementById('reset-select');
  const input = document.getElementById('select-input');

  if (!btn || !panel) return;

  btn.classList.add('hidden');
  btn.addEventListener('click', openSelectPanel);
  backdrop && backdrop.addEventListener('click', closeSelectPanel);
  closeBtn && closeBtn.addEventListener('click', closeSelectPanel);
  searchBtn && searchBtn.addEventListener('click', applySelectSearch);
  resetBtn && resetBtn.addEventListener('click', resetSelect);
  const addBtn = document.getElementById('add-species');
  const selectedContainer = document.getElementById('selected-species');

  // suggestions
  if (input) {
    input.addEventListener('input', (ev) => {
      const q = ev.target.value || '';
      selectedSpecies = q;
      if (speciesDebounce) clearTimeout(speciesDebounce);
      speciesDebounce = setTimeout(() => fetchSpeciesSuggestions(q), 250);
    });
    // allow Enter to add the current input to selection
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        addSpeciesFromInput();
      }
    });
  }

  if (addBtn) addBtn.addEventListener('click', addSpeciesFromInput);

  function renderSelectedSpecies() {
    if (!selectedContainer) return;
    selectedContainer.innerHTML = '';
    selectedSpeciesList.forEach((s, idx) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'reset-filters';
      chip.style.display = 'inline-block';
      chip.style.marginRight = '8px';
      chip.style.marginBottom = '8px';
      chip.textContent = s;
      chip.title = 'Remove';
      chip.addEventListener('click', () => {
        selectedSpeciesList.splice(idx, 1);
        renderSelectedSpecies();
      });
      selectedContainer.appendChild(chip);
    });
  }

  function addSpeciesFromInput() {
    const inputEl = document.getElementById('select-input');
    if (!inputEl) return;
    const v = inputEl.value && inputEl.value.trim();
    if (!v) return;
    if (!selectedSpeciesList.includes(v)) selectedSpeciesList.push(v);
    inputEl.value = '';
    renderSelectedSpecies();
  }
}

function openSelectPanel() {
  const panel = document.getElementById('select-panel');
  const backdrop = document.getElementById('select-backdrop');
  if (!panel) return;
  panel.classList.add('open');
  backdrop && backdrop.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  backdrop && backdrop.setAttribute('aria-hidden', 'false');
}

function closeSelectPanel() {
  const panel = document.getElementById('select-panel');
  const backdrop = document.getElementById('select-backdrop');
  if (!panel) return;
  panel.classList.remove('open');
  backdrop && backdrop.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  backdrop && backdrop.setAttribute('aria-hidden', 'true');
}

function resetSelect() {
  const input = document.getElementById('select-input');
  const dist = document.getElementById('select-distance');
  if (input) input.value = '';
  if (dist) dist.value = 10;
  selectedSpecies = null;
  selectedSpeciesList = [];
  const selectedContainer = document.getElementById('selected-species');
  if (selectedContainer) selectedContainer.innerHTML = '';
}

function fetchSpeciesSuggestions(q) {
  const datalist = document.getElementById('species-datalist');
  if (!datalist) return;
  // do not query empty strings aggressively
  if (!q || q.trim().length < 1) {
    datalist.innerHTML = '';
    return;
  }

  // prefer local CSV list if available
  loadLocalSpeciesCSV().then(list => {
    if (list && list.length > 0) {
      const ql = q.toLowerCase();
      const matches = list.filter(s => (s.comName && s.comName.toLowerCase().includes(ql)) || (s.speciesCode && s.speciesCode.toLowerCase().includes(ql)));
      // limit to top 50 suggestions
      const out = matches.slice(0, 50).map(s => `${s.comName} (${s.speciesCode})`);
      datalist.innerHTML = out.map(v => `<option value="${v}"></option>`).join('');
      return;
    }

    // if local CSV not available, try backend species endpoint
    const url = `${backendURL}/api/species?query=${encodeURIComponent(q)}`;
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('no species endpoint');
        return r.json();
      })
      .then(list2 => {
        speciesCache = Array.isArray(list2) ? list2 : [];
        datalist.innerHTML = speciesCache.map(s => {
          const v = (typeof s === 'string') ? s : (s.comName || s.name || s.species || '');
          return `<option value="${v}"></option>`;
        }).join('');
      })
      .catch(() => {
        // fallback: fetch birds around user's location with big radius and build unique names
        const lat = userLat || 39.5;
        const lng = userLng || -98.35;
        const fallbackUrl = `${backendURL}/api/birds?lat=${lat}&lng=${lng}&dist=500&maxResults=500`;
        fetch(fallbackUrl).then(r => r.ok ? r.json() : []).then(data => {
          const names = [];
          (Array.isArray(data) ? data : []).forEach(b => {
            if (b && b.comName) names.push(b.comName);
          });
          const uniq = Array.from(new Set(names)).filter(n => n.toLowerCase().includes(q.toLowerCase()));
          datalist.innerHTML = uniq.map(v => `<option value="${v}"></option>`).join('');
        }).catch(() => { datalist.innerHTML = ''; });
      });
  });
}

function applySelectSearch() {
  const input = document.getElementById('select-input');
  const distEl = document.getElementById('select-distance');
  // ensure any typed value gets added if user didn't click Add
  if (input && input.value && input.value.trim()) {
    const v = input.value.trim();
    if (!selectedSpeciesList.includes(v)) selectedSpeciesList.push(v);
  }

  const speciesList = selectedSpeciesList.slice();
  let dist = distEl ? Number(distEl.value) || 10 : 10;
  if (dist > 100) dist = 100;
  if (!speciesList || speciesList.length === 0) {
    alert('Please add at least one bird to search for.');
    return;
  }
  // close UI and run search
  closeSelectPanel();
  filtersApplied = true;
  showSearchStatus(`Searching for ${speciesList.join(', ')}`);
  const lat = filterState.lat || userLat;
  const lng = filterState.lng || userLng;
  if (!lat || !lng) {
    alert('No location available to search from.');
    hideSearchStatus();
    return;
  }
  // For multi-species search, fetch a large result set from backend within the distance
  // and then filter client-side to include all sightings that match any selected species
  const maxResults = 500;
  // Try to map added species to species codes (from parentheses or local CSV). If we have codes
  // prefer to query backend by code(s) (more reliable). Otherwise fall back to full-area fetch + name-matching.
  loadLocalSpeciesCSV().then(() => {
    const matchers = speciesList.map(s => {
      const raw = String(s).trim();
      let code = null;
      const m = raw.match(/\(([^)]+)\)\s*$/);
      if (m && m[1]) code = m[1].trim().toLowerCase();
      if (!code && localSpeciesLoaded && localSpeciesList.length > 0) {
        const found = localSpeciesList.find(x => x.comName && x.comName.toLowerCase() === raw.toLowerCase());
        if (found && found.speciesCode) code = String(found.speciesCode).toLowerCase();
      }
      return { raw, norm: normalizeForMatch(raw), code };
    });
    // remove any empty matchers (avoid matching everything if user input was blank)
    const filteredMatchers = matchers.filter(m => (m.code && m.code.length > 0) || (m.norm && m.norm.length > 0));
    console.log('Search matchers:', filteredMatchers);

    const codes = filteredMatchers.map(m => m.code).filter(Boolean);
    if (codes.length > 0) {
      // prefer code-based queries
      fetchBirdsBySpeciesCodes(lat, lng, dist, codes, 300)
        .then(list => {
          const all = Array.isArray(list) ? list : [];
          // if the backend returned nothing for the code-query, fall back to broad fetch+name matching
          if (!all || all.length === 0) {
            console.log('Code-based query returned 0 items — falling back to name-based fetch');
            fetchBirdsWithinDistance(lat, lng, dist, maxResults)
              .then(list2 => {
                const all2 = Array.isArray(list2) ? list2 : [];
                    const matchers2 = filteredMatchers; // reuse computed matchers
                      const matched2 = all2.filter(b => speciesMatches(b, matchers2)).filter(b => obsWithinDays(b.obsDt, filterState.days || 3));

                showFetchDiagnostics(all2.length, matched2.length);
                hideSearchStatus();
                if (!matched2 || matched2.length === 0) {
                  console.log('Fallback name-based fetch returned 0 matches. Fetched', all2.length);
                  if (all2.length > 0) {
                    const uniq = Array.from(new Set(all2.map(x => x.comName).filter(Boolean))).slice(0, 20);
                    birdsDiv.innerHTML = `<p class="no-birds-message">No matching sightings found for selected birds.</p><div style="text-align:center;margin-top:12px;font-size:0.9rem;color:#444">Sample nearby species: ${uniq.join(', ')}</div>`;
                  } else {
                    birdsDiv.innerHTML = '<p class="no-birds-message">No Birds Found - Adjust Filters</p>';
                  }
                } else {
                  displayBirds(matched2, lat, lng);
                }
              })
              .catch(err => {
                console.error('fallback fetch error', err);
                hideSearchStatus();
                birdsDiv.innerHTML = '<p>Error fetching bird data.</p>';
              });
            return;
          }

          // ensure we still filter by species client-side (backend may ignore species param)
          const matchedBySpecies = all.filter(b => speciesMatches(b, filteredMatchers));
          const matched = matchedBySpecies.filter(b => obsWithinDays(b.obsDt, filterState.days || 3));
          showFetchDiagnostics(all.length, matched.length);
          hideSearchStatus();
          if (!matched || matched.length === 0) {
            console.log('Code-based species search returned 0 after date filter. Fetched', all.length, 'items. Codes:', codes);
            birdsDiv.innerHTML = '<p class="no-birds-message">No matching sightings found for selected birds.</p>';
          } else {
            displayBirds(matched, lat, lng);
          }
        })
        .catch(err => {
          console.error('code-based species search error', err);
          hideSearchStatus();
          birdsDiv.innerHTML = '<p>Error fetching bird data.</p>';
        });
    } else {
      // fallback: broad fetch then name/code match
      fetchBirdsWithinDistance(lat, lng, dist, maxResults)
        .then(list => {
          const all = Array.isArray(list) ? list : [];
          const matched = all.filter(b => speciesMatches(b, filteredMatchers)).filter(b => obsWithinDays(b.obsDt, filterState.days || 3));
          showFetchDiagnostics(all.length, matched.length);
          hideSearchStatus();
          if (!matched || matched.length === 0) {
            console.log('Name-based fallback search found 0 matches. Fetched', all.length, 'items. Matchers:', matchers);
            if (all.length > 0) {
              const uniq = Array.from(new Set(all.map(x => x.comName).filter(Boolean))).slice(0, 20);
              birdsDiv.innerHTML = `<p class="no-birds-message">No matching sightings found for selected birds.</p><div style="text-align:center;margin-top:12px;font-size:0.9rem;color:#444">Sample nearby species: ${uniq.join(', ')}</div>`;
            } else {
              birdsDiv.innerHTML = '<p class="no-birds-message">No Birds Found - Adjust Filters</p>';
            }
          } else {
            displayBirds(matched, lat, lng);
          }
        })
        .catch(err => {
          console.error('species search error', err);
          hideSearchStatus();
          birdsDiv.innerHTML = '<p>Error fetching bird data.</p>';
        });
    }
  });
}

// Try fetching by species codes (preferred). If backend doesn't support multiple codes
// in one request, perform parallel requests per code and aggregate.
function fetchBirdsBySpeciesCodes(lat, lng, distMiles, codes = [], maxResultsPerCode = 200) {
  if (!codes || codes.length === 0) return Promise.resolve([]);
  const distKm = Math.round(distMiles * 1.60934 * 100) / 100;
  // Prefer per-code parallel requests (more reliable across backends).
  const promises = codes.map(code => {
    const url = `${backendURL}/api/birds?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&dist=${distKm}&maxResults=${maxResultsPerCode}&species=${encodeURIComponent(code)}`;
    return fetch(url).then(r => r.ok ? r.json() : []).catch(() => []);
  });
  return Promise.all(promises).then(results => {
    const flat = [].concat(...results.map(r => Array.isArray(r) ? r : []));
    // if we got nothing, try a comma-separated query as a last resort
    if (!flat || flat.length === 0) {
      const tryComma = `${backendURL}/api/birds?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&dist=${distKm}&maxResults=${maxResultsPerCode}&species=${encodeURIComponent(codes.join(','))}`;
      return fetch(tryComma)
        .then(r => r.ok ? r.json() : [])
        .then(data => Array.isArray(data) ? data : [])
        .catch(() => []);
    }
    const seen = new Set();
    const dedup = [];
    flat.forEach(item => {
      const k = item.obsId || `${item.speciesCode || item.species}-${item.obsDt}-${item.lat}-${item.lng}`;
      if (!seen.has(k)) { seen.add(k); dedup.push(item); }
    });
    return dedup;
  });
}

// small UI helper to show fetched vs displayed counts for debugging
function showFetchDiagnostics(fetchedCount, displayedCount) {
  // remove any leftover on-page diagnostic element if present
  try {
    const existing = document.getElementById('fetch-diagnostics');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
  } catch (e) {}
  // diagnostic only in console
  console.log(`Fetched ${fetchedCount} sightings — showing ${displayedCount}`);
}

// return true if a backend item matches any of the provided matchers
function speciesMatches(item, matchers) {
  if (!item || !matchers || matchers.length === 0) return false;
  const comNorm = normalizeForMatch(item.comName || '');
  const codeNorm = normalizeForMatch(String(item.speciesCode || item.species || ''));
  return matchers.some(m => {
    const mCode = m.code ? normalizeForMatch(m.code) : null;
    const mNorm = m.norm ? normalizeForMatch(m.norm) : null;
    if (mCode) {
      if (codeNorm === mCode || codeNorm.includes(mCode)) return true;
    }
    if (mNorm) {
      if (comNorm === mNorm) return true;
      if (comNorm.includes(mNorm) || mNorm.includes(comNorm)) return true;
      if (codeNorm.includes(mNorm) || mNorm.includes(codeNorm)) return true;
    }
    return false;
  });
}

function fetchBirdsWithinDistance(lat, lng, distMiles = 10, maxResults = 200) {
  return new Promise((resolve, reject) => {
    const distKm = Math.round(distMiles * 1.60934 * 100) / 100;
    const url = `${backendURL}/api/birds?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&dist=${distKm}&maxResults=${maxResults}`;
    fetch(url)
      .then(r => { if (!r.ok) throw new Error('Network response not ok'); return r.json(); })
      .then(data => resolve(Array.isArray(data) ? data : []))
      .catch(reject);
  });
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
  // remove any leftover on-page diagnostics from earlier versions
  try { const old = document.getElementById('fetch-diagnostics'); if (old && old.parentNode) old.parentNode.removeChild(old); } catch (e) {}
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
          initSelectUI();
    }, err => {
      console.error('geolocation error', err);
      birdsDiv.innerHTML = '<p>Unable to get your location.</p>';
      // still try to wire filters UI (map will use default coords)
      initFiltersUI();
      initSelectUI();
    });
  } else {
    birdsDiv.innerHTML = '<p>Geolocation is not supported by your browser.</p>';
    initFiltersUI();
    initSelectUI();
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
    // update main Location display when resetting filters
    if (filterState.lat && filterState.lng) showLocationName(filterState.lat, filterState.lng);
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
    // update the main Location display immediately when a new pin is selected
    showLocationName(clickLat, clickLng);
  });

  if (filterMarker) {
    filterMarker.on('dragend', () => {
      const p = filterMarker.getLatLng();
      filterState.lat = p.lat; filterState.lng = p.lng;
      updateFilterCoordsText(p.lat, p.lng);
      // update the main Location display when marker is dragged
      showLocationName(p.lat, p.lng);
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
