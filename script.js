const birdsDiv = document.getElementById("birds");


const BACKEND_URL = "https://birds-near-me-backend.onrender.com";

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(success, error);
} else {
  birdsDiv.textContent = "Geolocation is not supported by your browser.";
}

function success(position) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  fetchBirds(lat, lng);
}

function error() {
  birdsDiv.textContent = "Could not get your location. Please allow location access.";
}

function fetchBirds(lat, lng) {
  const url = `${BACKEND_URL}?lat=${lat}&lng=${lng}&dist=10&maxResults=10`;

  fetch(url)
    .then(res => res.json())
    .then(data => displayBirds(data))
    .catch(err => {
      console.error(err);
      birdsDiv.textContent = "Error fetching bird data.";
    });
}

function displayBirds(data) {
  birdsDiv.innerHTML = "";
  if (!data || data.length === 0) {
    birdsDiv.textContent = "No recent sightings nearby.";
    return;
  }

  data.forEach(obs => {
    const div = document.createElement("div");
    div.className = "bird";
    div.textContent = `${obs.comName} (${obs.howMany || 1}) — seen on ${obs.obsDt}`;
    birdsDiv.appendChild(div);
  });
}
