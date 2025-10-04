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
    .then(data => displayBirds(data))
    .catch(err => {
      console.error("Error fetching bird data:", err);
      birdsDiv.innerHTML = "<p>Error fetching bird data.</p>";
    });
}


function displayBirds(birds) {
  birdsDiv.innerHTML = ""; 

  if (!birds || birds.length === 0) {
    birdsDiv.innerHTML = "<p>No birds found nearby.</p>";
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

    card.appendChild(name);
    card.appendChild(count);
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
