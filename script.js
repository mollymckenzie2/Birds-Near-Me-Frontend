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
  statusEl.style.background = '#ffffffcc';
  statusEl.style.padding = '8px 12px';
  statusEl.style.border = '2px solid #28a745';
  statusEl.style.borderRadius = '8px';
  statusEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';

  const container = birdsDiv && birdsDiv.parentNode ? birdsDiv.parentNode : document.body;
  if (!inserted) container.insertBefore(statusEl, birdsDiv || container.firstChild);
  searchStatusEl = statusEl;
  console.log('ensureSearchStatusEl created', searchStatusEl);
  return searchStatusEl;
}

function showSearchStatus(statusText) {
  const statusEl = ensureSearchStatusEl();
  statusEl.innerHTML = '';
  const compass = document.createElement('div');
  compass.className = 'compass';
  compass.style.width = '64px';
  compass.style.height = '64px';
  compass.style.background = 'conic-gradient(#28a745 0 25%, #f1f1f1 25% 100%)';
  compass.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
  const textEl = document.createElement('div');
  textEl.className = 'loading-text';
  textEl.textContent = statusText;
  statusEl.appendChild(compass);
  statusEl.appendChild(textEl);
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
