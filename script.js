const backendURL = "https://birds-near-me-backend-lknu.onrender.com";
const birdsDiv = document.getElementById("birds");

// Format API obsDt into readable date/time
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
    const card = document.createElement("div");
    card.className = "bird-card";

    const name = document.createElement("h2");
    name.textContent = bird.comName;

    const count = document.createElement("p");
    count.innerHTML = `<span>Quantity:</span> ${bird.howMany}`;

    const seenDate = document.createElement("p");
    seenDate.innerHTML = `<span>Seen:</span> ${formatDate(bird.obsDt)}`;

    const sciName = document.createElement("p");
    sciName.innerHTML = `<span>Scientific Name:</span> ${bird.sciName}`;
    sciName.style.fontStyle = "italic";

    card.appendChild(name);
    card.appendChild(count);
    card.appendChild(seenDate);
    card.appendChild(sciName);

    birdsDiv.appendChild(card);
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
