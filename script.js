
// Selecting HTML elements

const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchButton = document.getElementById("searchButton");
const refreshButton = document.getElementById("refreshButton");

const statusBox = document.getElementById("status");
const weatherContent = document.getElementById("weatherContent");

let lastCoordinates = null;


// Weather code ko readable condition aur icon mein convert karna

function getWeatherInfo(code, isDay) {

  if (code === 0) {
    return {
      text: "Clear sky",
      icon: isDay ? "☀️" : "🌙"
    };
  }

  if ([1, 2].includes(code)) {
    return {
      text: "Mainly clear",
      icon: isDay ? "🌤️" : "☁️"
    };
  }

  if (code === 3) {
    return {
      text: "Overcast",
      icon: "☁️"
    };
  }

  if ([45, 48].includes(code)) {
    return {
      text: "Fog",
      icon: "🌫️"
    };
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return {
      text: "Drizzle",
      icon: "🌦️"
    };
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return {
      text: "Rain",
      icon: "🌧️"
    };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return {
      text: "Snow",
      icon: "❄️"
    };
  }

  if ([95, 96, 99].includes(code)) {
    return {
      text: "Thunderstorm",
      icon: "⛈️"
    };
  }

  return {
    text: "Variable conditions",
    icon: "🌥️"
  };
}


// Displaying loading and error messages

function showStatus(title, message, isError = false) {

  statusBox.classList.remove("hidden", "error");

  if (isError) {
    statusBox.classList.add("error");
  }

  statusBox.innerHTML = `
    <span class="status-icon">
      ${isError ? "⚠️" : "☁️"}
    </span>

    <div>
      <strong>${title}</strong>
      <p>${message}</p>
    </div>
  `;

  weatherContent.classList.add("hidden");
}


// Loading button

function setLoading(isLoading) {

  searchButton.disabled = isLoading;

  searchButton.innerHTML = isLoading
    ? "Loading..."
    : 'Search <span aria-hidden="true">→</span>';
}


// STEP 1: Get city coordinates

async function getCityCoordinates(city) {

  const url =
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      "We could not contact the location service. Please try again."
    );
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {

    throw new Error(
      `No city named "${city}" was found. Check the spelling and try again.`
    );

  }

  const place = data.results[0];

  return {
    name: place.name,
    country: place.country || "",
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone || "auto"
  };

}


// STEP 2: Fetch weather data

async function getWeather(coordinates) {

  const params = new URLSearchParams({

    latitude: coordinates.latitude,
    longitude: coordinates.longitude,

    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",

    timezone: coordinates.timezone

  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`
  );

  if (!response.ok) {

    throw new Error(
      "Weather data is temporarily unavailable. Please try again later."
    );

  }

  const data = await response.json();

  // Checking JSON data

  if (
    !data.current ||
    typeof data.current.temperature_2m !== "number"
  ) {

    throw new Error(
      "The weather service returned incomplete data. Please search again."
    );

  }

  return data;

}


// STEP 3: Display weather data

function displayWeather(place, data) {

  const current = data.current;

  const info = getWeatherInfo(
    current.weather_code,
    current.is_day === 1
  );


  // City information

  document.getElementById("cityName").textContent =
    `${place.name}${place.country ? ", " + place.country : ""}`;


  document.getElementById("localDate").textContent =
    `Updated: ${new Date(current.time).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short"
    })}`;


  // Weather information

  document.getElementById("weatherSymbol").textContent =
    info.icon;

  document.getElementById("temperature").textContent =
    Math.round(current.temperature_2m);

  document.getElementById("condition").textContent =
    info.text;

  document.getElementById("feelsLike").textContent =
    Math.round(current.apparent_temperature);


  // Weather metrics

  document.getElementById("humidity").textContent =
    current.relative_humidity_2m;

  document.getElementById("windSpeed").textContent =
    current.wind_speed_10m;

  document.getElementById("precipitation").textContent =
    current.precipitation;


  // Day and night information

  document.getElementById("dayNight").textContent =
    current.is_day === 1
      ? "☀️ Day time"
      : "🌙 Night time";


  // Coordinates

  document.getElementById("coordinates").textContent =
    `${place.latitude.toFixed(2)}°, ${place.longitude.toFixed(2)}°`;


  // Show weather results

  statusBox.classList.add("hidden");

  weatherContent.classList.remove("hidden");

  refreshButton.disabled = false;

}


// STEP 4: Main search function

async function searchWeather(city) {

  if (!city.trim()) {

    showStatus(
      "Enter a city name",
      "Please type a city before searching.",
      true
    );

    return;
  }

  setLoading(true);

  showStatus(
    "Getting weather data...",
    "Connecting to the weather service."
  );


  try {

    // First get city coordinates

    const place = await getCityCoordinates(city.trim());

    // Then fetch weather information

    const weatherData = await getWeather(place);

    lastCoordinates = place;

    // Display the weather

    displayWeather(place, weatherData);

  }

  catch (error) {

    console.error("Weather dashboard error:", error);

    showStatus(
      "Unable to load weather",
      error.message || "Something went wrong. Please try again.",
      true
    );

  }

  finally {

    setLoading(false);

  }

}


// STEP 5: Search form event

searchForm.addEventListener("submit", (event) => {

  event.preventDefault();

  searchWeather(cityInput.value);

});


// STEP 6: Refresh button

refreshButton.addEventListener("click", () => {

  if (lastCoordinates) {

    searchWeather(lastCoordinates.name);

  }

});
