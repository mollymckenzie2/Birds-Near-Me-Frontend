const backendURL = "https://birds-near-me-backend-lknu.onrender.com";
const birdsDiv = document.getElementById("birds");


function formatDate(obsDt) {
  const date = new Date(obsDt);
  const options = { month: "long", day: "numeric", hour: "numeric", minute: "numeric" };
  return date.toLocaleString(undefined, options);
}


function fetchBirds(lat, lng) {
  const url = `${backendURL}/api/birds?lat=${lat}&lng=${lng}&dist=10&maxResults=15`;

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then(data => displayBirds(data, lat, lng))
    .catch(err => {
      console.error("Error fetching bird data:", err);
      birdsDiv.innerHTML = "<p>Error fetching bird data.</p>";
    });
}


function haversineDistanceMiles(lat1, lon1, lat2, lon2) {
  function toRad(x) { return x * Math.PI / 180; }
  const R = 3959; // miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function displayBirds(birds, userLat, userLng) {
  birdsDiv.innerHTML = "";

  if (!birds || birds.length === 0) {
    birdsDiv.innerHTML = "<p>No birds found nearby.</p>";
    return;
  }

  birds.forEach(bird => {
    console.log('bird data:', bird, 'userLat:', userLat, 'userLng:', userLng);
    const card = document.createElement("div");
    card.className = "bird-card";

    const name = document.createElement("h2");
    name.textContent = bird.comName;

    const count = document.createElement("p");
    count.innerHTML = `<span>Quantity:</span> ${bird.howMany}`;


    let distanceText = "";
    if (bird.lat && bird.lng && userLat && userLng) {
      const dist = haversineDistanceMiles(userLat, userLng, bird.lat, bird.lng);
      
      const distStr = Number(dist).toPrecision(2);
      distanceText = `<span>Distance:</span> ${distStr} mi`;
    } else {
      distanceText = `<span>Distance:</span> Unknown`;
    }
    const distance = document.createElement("p");
    distance.innerHTML = distanceText;

    const seenDate = document.createElement("p");
    seenDate.innerHTML = `<span>Seen:</span> ${formatDate(bird.obsDt)}`;

    const sciName = document.createElement("p");
    sciName.innerHTML = `<span>Scientific Name:</span> ${bird.sciName}`;

    card.appendChild(name);
    card.appendChild(count);
    card.appendChild(distance); 
    card.appendChild(seenDate);
    card.appendChild(sciName);

    birdsDiv.appendChild(card);
  });
}


function init() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        fetchBirds(latitude, longitude);
      },
      error => {
        console.error("Geolocation error:", error);
        birdsDiv.innerHTML = "<p>Unable to get your location.</p>";
      }
    );
  } else {
    birdsDiv.innerHTML = "<p>Geolocation is not supported by your browser.</p>";
  }
}

window.addEventListener("load", init);
