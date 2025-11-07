

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
        loadWeatherData(result.current);
        loadDailyForecast(result.daily);
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




function getWeatherType(weatherCode) {
    for (let [weatherName, codes] of Object.entries(weatherCodeMap)) {
        if (codes.includes(weatherCode)) {
            // console.log("Weather type: " + weatherName);
            return weatherName;
        }
    }
    return "unknown";
}












getGeoData();