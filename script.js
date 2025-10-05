const backendURL = "https://birds-near-me-backend-lknu.onrender.com";
const birdsDiv = document.getElementById("birds");

console.log('script.js loaded');

// explicit radii order used by fetchWithRadiusRetries (miles)
const SEARCH_RADII_MILES = [3, 5, 10];


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
    birdsDiv.innerHTML = `<p>Searching within ${distMiles} mi...</p>`;

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
          displayBirds(recent, lat, lng);
        } else {
          attempt++;
          setTimeout(tryNext, 400);
        }
      })
      .catch(err => {
        console.error('fetch error', err);
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
