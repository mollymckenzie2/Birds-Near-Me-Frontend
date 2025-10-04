
const backendURL = "https://birds-near-me-backend-lknu.onrender.com";


const birdsDiv = document.getElementById("birds");


function fetchBirds(lat, lng) {
  const url = `${backendURL}/api/birds?lat=${lat}&lng=${lng}&dist=10&maxResults=10`;

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then(data => displayBirds(data))
    .catch(err => {
      console.error("Error fetching bird data:", err);
      birdsDiv.textContent = "Error fetching bird data.";
    });
}


function displayBirds(birds) {
  birdsDiv.innerHTML = ""; 

  if (!birds || birds.length === 0) {
    birdsDiv.textContent = "No birds found nearby.";
    return;
  }

  birds.forEach(bird => {
    const p = document.createElement("p");
    p.textContent = `${bird.comName} (${bird.howMany})`;
    birdsDiv.appendChild(p);
  });
}


function init() {
  if ("geolocation" in navigator) {
    birdsDiv.textContent = "Loading birds near you...";
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        fetchBirds(latitude, longitude);
      },
      error => {
        console.error("Geolocation error:", error);
        birdsDiv.textContent = "Unable to get your location.";
      }
    );
  } else {
    birdsDiv.textContent = "Geolocation is not supported by your browser.";
  }
}


window.addEventListener("load", init);
