const backendURL = "https://birds-near-me-backend-lknu.onrender.com";
const birdsDiv = document.getElementById("birds");

console.log('script.js loaded');


const SEARCH_RADII_MILES = [3, 5, 10];



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
      birdsDiv.innerHTML = `<p>no birds found in ${last} miles</p>`;
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
}

function init() {
  console.log('init');
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      console.log('got location', latitude, longitude);
      fetchBirds(latitude, longitude);
    }, err => {
      console.error('geolocation error', err);
      birdsDiv.innerHTML = '<p>Unable to get your location.</p>';
    });
  } else {
    birdsDiv.innerHTML = '<p>Geolocation is not supported by your browser.</p>';
  }
}

window.addEventListener('load', init);
