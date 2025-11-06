

const ddlUnits = document.getElementById("ddlUnits");
const dvCityCountry = document.getElementById("dvCityCountry");
const dvCurrDate = document.getElementById("dvCurrDate");
const dvCurrTemp = document.getElementById("dvCurrTemp");
let locationcity, locationcountry;

async function getGeoData(search = "hochiminh") {
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
        loadTempData(result);
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
    console.log("City: " + locationcity + ", Country: " + locationcountry + ", Date: " + date);
}


function loadTempData(weatherData) {
    const currTemp = weatherData.current.apparent_temperature;
    dvCurrTemp.textContent = `${Math.round(currTemp)}°`;
    console.log("Temperature loaded: " + currTemp);
}

getGeoData();