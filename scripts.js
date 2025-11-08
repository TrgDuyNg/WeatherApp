let currentUnit = "C";
let currentLon = null;
let currentLat = null;
let hourlyDataGlobal = null;
let currentTimeGlobal = null;
const ddlUnits = document.getElementById("ddlUnits");
const dvCityCountry = document.getElementById("dvCityCountry");
const dvCurrDate = document.getElementById("dvCurrDate");
const dvCurrTemp = document.getElementById("dvCurrTemp");
const dvCurrWeatherIcon = document.getElementById("dvCurrWeatherIcon");
const dvFeelLike = document.getElementById("dvFeelLike");
const dvHumidity = document.getElementById("dvHumidity");
const dvWind = document.getElementById("dvWind");
const dvPrecipitation = document.getElementById("dvPrecipitation");

const weatherCodeMap = {
    sunny: [0],
    partly_cloudy: [1, 2],
    overcast: [3],
    fog: [45, 48],
    drizzle: [51, 53, 55, 56, 57],
    rain: [61, 63, 65, 80],
    snow: [71, 73, 75, 77, 85, 86],
    storm: [96, 99, 95]
};

let locationcity, locationcountry;

async function getGeoData(search) {
    search = search || "hochiminh";

    const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;

    if (!apiKey) {
        console.error("API key not found. Please add VITE_GEOAPIFY_API_KEY to .env file");
        return;
    }

    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(search)}&apiKey=${apiKey}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const result = await response.json();
        console.log(result);
        if (result.features && result.features.length > 0) {
            const { lat, lon } = result.features[0].properties;

            LoadLocationData(result.features[0].properties);
            getWeatherData(lat, lon);
        }
    } catch (error) {
        console.error(error.message);
    }
}

async function getWeatherData(lat, lon) {

    currentLat = lat;
    currentLon = lon;

    let temperature_unit = "celsius";
    let wind_speed_unit = "kmh";
    let precipitation_unit = "mm";

    if (ddlUnits.value === "F") {
        temperature_unit = "fahrenheit";
        wind_speed_unit = "ms";
        precipitation_unit = "inch";
    }


    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&current=temperature_2m,weather_code,relative_humidity_2m,precipitation,wind_speed_10m,apparent_temperature&temperature_unit=${temperature_unit}&windspeed_unit=${wind_speed_unit}&precipitation_unit=${precipitation_unit}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const result = await response.json();
        loadWeatherData(result.current);
        loadDailyForecast(result.daily);
        loadHourlyForecast(result.hourly, result.current.time);
        console.log(result);

    } catch (error) {
        console.error(error.message);
    }


}

function LoadLocationData(locationData) {
    locationcity = locationData.city;
    locationcountry = locationData.country.toUpperCase();

    let dateOptions = {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
    };
    let date = new Intl.DateTimeFormat("en-US", dateOptions).format(new Date());

    dvCityCountry.textContent = `${locationcity}, ${locationcountry}`;
    dvCurrDate.textContent = date;
    // console.log("City: " + locationcity + ", Country: " + locationcountry + ", Date: " + date);
}

function loadWeatherData(weatherData) {

    dvCurrWeatherIcon.src = `/assets/images/icon-${getWeatherType(weatherData.weather_code)}.webp`;
    dvCurrTemp.textContent = `${Math.round(weatherData.apparent_temperature)}°`;
    dvFeelLike.textContent = `${Math.round(weatherData.temperature_2m)}°`;
    dvHumidity.textContent = `${weatherData.relative_humidity_2m}%`;


    if (currentUnit === "F") {
        dvWind.textContent = `${weatherData.wind_speed_10m} m/s`;
        dvPrecipitation.textContent = `${weatherData.precipitation} inch`;
        return;
    }

    dvWind.textContent = `${weatherData.wind_speed_10m} km/h`;
    dvPrecipitation.textContent = `${weatherData.precipitation} mm`;
}

function loadDailyForecast(dailyData) {
    const dailyElements = document.querySelectorAll('.daily_day');
    dailyElements.forEach((element, index) => {
        if (index < dailyData.time.length) {
            const date = new Date(dailyData.time[index]);
            const dayOfWeek = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
            // console.log(dayOfWeek);
            element.querySelector(".daily_day-title").textContent = dayOfWeek;



            element.querySelector('.daily_day-icon').src = `/assets/images/icon-${getWeatherType(dailyData.weather_code[index])}.webp`;

            element.querySelector('.daily_day_high').textContent =
                `${Math.round(dailyData.temperature_2m_max[index])}°`;
            element.querySelector('.daily_day_low').textContent =
                `${Math.round(dailyData.temperature_2m_min[index])}°`;
        }


    });
}

function loadHourlyForecast(hourlyData, currentDay) {
    hourlyDataGlobal = hourlyData;
    currentTimeGlobal = currentDay;

    const sevenDays = [];

    for (let i = 0; i < 7; i++) {
        const date = new Date(currentDay);
        date.setDate(date.getDate() + i);
        sevenDays.push(date.toISOString().split("T")[0]);

    }

    populateDateDropdown(sevenDays);
    renderHourlyForecastByDate(currentDay);

}

function renderHourlyForecastByDate(targetDate) {
    const hourlyElements = document.querySelectorAll('.hourly_hour');
    let currentDate = targetDate.split("T")[0];

    let startIndex = hourlyDataGlobal.time.findIndex(time => time.startsWith(currentDate));

    for (let i = 0; i < hourlyElements.length && i < 24; i++) {
        const dataIndex = startIndex + i;

        //make sure dataIndex is within bounds
        if (dataIndex < hourlyDataGlobal.time.length) {
            const element = hourlyElements[i];

            const time = hourlyDataGlobal.time[dataIndex];
            const temp = hourlyDataGlobal.temperature_2m[dataIndex];
            const weatherCode = hourlyDataGlobal.weather_code[dataIndex];

            const hour = new Date(time).getHours(); // get hour from time string
            const formattedHour = hour.toString().padStart(2, '0') + ":00";

            element.querySelector('.hourly_hour-time').textContent = formattedHour;
            element.querySelector('.hourly_hour-icon').src = `/assets/images/icon-${getWeatherType(weatherCode)}.webp`;
            element.querySelector('.hourly_hour-temp').textContent = `${Math.round(temp)}°`;



        }
    }
}


function populateDateDropdown(days) {
    const dropdown = document.getElementById("hourlyDay");
    dropdown.innerHTML = "";

    days.forEach((day, index) => {
        const option = document.createElement("option");
        option.value = day;

        const dateObj = new Date(day);
        const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(dateObj);

        option.textContent = dayName;
        dropdown.appendChild(option);
    });
}

function getWeatherType(weatherCode) {
    for (let [weatherName, codes] of Object.entries(weatherCodeMap)) {
        if (codes.includes(weatherCode)) {
            // console.log("Weather type: " + weatherName);
            return weatherName;
        }
    }
    return "unknown";
}

function initializeEventListeners() {
    document.getElementById('hourlyDay').addEventListener('change', (event) => {
        const selectedDate = event.target.value;
        renderHourlyForecastByDate(selectedDate);
    });

    ddlUnits.addEventListener('change', handleUnitChange);

    document.querySelector('.hero_button').addEventListener('click', handleSearch);


    document.getElementById('search').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });

}

function handleUnitChange() {
    const selectedUnit = ddlUnits.value;

    if (selectedUnit === currentUnit) {
        return;
    }

    currentUnit = selectedUnit;

    if (currentLat !== null && currentLon !== null) {
        getWeatherData(currentLat, currentLon);
    }
}


function handleSearch() {
    const searchInput = document.getElementById('search');
    const searchTerm = searchInput.value.trim();


    if (searchTerm === '') {
        console.warn("Please enter a city name.");
        return;
    }

    getGeoData(searchTerm);
}







getGeoData();
initializeEventListeners();

