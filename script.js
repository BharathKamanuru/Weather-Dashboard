function dateFormat(timestamp) {
    const date = new Date(timestamp * 1000); // Convert from seconds to milliseconds
    return date.toLocaleString();
}

function getSkyDescriptionIcon(description) {
    const icons = {
        "clear sky": "./images/cloudy.png",
        "few clouds": "./images/clouds.png",
        "scattered clouds": "./images/clouds.png",
        "broken clouds": "./images/clouds.png",
        "overcast clouds": "./images/cloudy.png",
        "light rain": "./images/drizzle.png",
        "moderate rain": "./images/rain.png",
        "heavy intensity rain": "./images/rain.png",
        "thunderstorm": "./images/storm.png",
        "snow": "./images/cloud.png",
        "mist": "./images/weather.png",
        "fog": "./images/weather.png",
        "haze": "./images/weather.png"
    };
    return icons[description.toLowerCase()] || "./cloud.png";
}

async function fetchAQIData(lat, lon) {
    const response = await fetch(
        `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=d28274b5fe592e1f1e558103a5e66370`
    );
    const data = await response.json();
    const list = data.list[0].components;

    $("#no2Value")[0].innerText = list.no2;
    $("#o3Value")[0].innerText = list.o3;
    $("#coValue")[0].innerText = list.co;
    $("#so2Value")[0].innerText = list.so2;
}

async function nextFiveDays(lat, lon) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=d28274b5fe592e1f1e558103a5e66370&units=metric`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        let dailyForecasts = {};

        data.list.forEach(item => {
            let date = item.dt_txt.split(" ")[0];
            if (!dailyForecasts[date]) {
                dailyForecasts[date] = {
                    temp: item.main.temp.toFixed(1),
                    description: item.weather[0].description,
                    day: new Date(date).toLocaleDateString('en-US', { weekday: 'long' })
                };
            }
        });

        let forecastHtml = "";
        Object.keys(dailyForecasts).slice(0, 5).forEach(date => {
            const forecast = dailyForecasts[date];
            const iconPath = getSkyDescriptionIcon(forecast.description);

            forecastHtml += `
                <div class="forecastRow d-flex align-items-center justify-content-between">
                    <div class="d-flex gap-1 align-items-center">
                        <img src="${iconPath}" alt="" width="35px">
                        <h6 class="m-0">${forecast.temp} &deg;C</h6>
                    </div>
                    <h6 class="m-0">${forecast.day}</h6>
                    <h6 class="m-0">${date}</h6>
                </div>
            `;
        });

        document.getElementById("forecastContainer").innerHTML = forecastHtml;

    } catch (error) {
        console.error(error);
        alert("Error fetching forecast data.");
    }
}

async function todayTemps(lat, lon) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=d28274b5fe592e1f1e558103a5e66370&units=metric`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Failed to fetch weather data");

        const data = await response.json();
        const todayDate = new Date().toISOString().split("T")[0];
        const todayForecasts = data.list.filter(item => item.dt_txt.startsWith(todayDate));
        const selectedHours = todayForecasts.slice(0, 6);

        let todayHtml = "";
        selectedHours.forEach(item => {
            const time = new Date(item.dt_txt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            const temp = item.main.temp.toFixed(1);
            const description = item.weather[0].description;
            const iconPath = getSkyDescriptionIcon(description);

            todayHtml += `
                <div class="todayTemp">
                    <h6 class="m-0">${time}</h6>
                    <img src="${iconPath}" alt="" width="35px">
                    <h5>${temp}&deg;C</h5>
                </div>
            `;
        });

        document.getElementById("todayTempContainer").innerHTML = todayHtml;

    } catch (error) {
        console.error(error);
        alert("Failed to retrieve today's temperatures.");
    }
}

async function fetchData() {
    const cityName = document.querySelector('.inputfield').value;
    const errorElement = document.getElementById("errorMessage");
    errorElement.innerText = "";

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=d28274b5fe592e1f1e558103a5e66370&units=metric`
        );
        const data = await response.json();

        if (data.cod === "404") {
            errorElement.innerText = "❌ City not found. Please check the spelling.";
            return;
        }

        const city = data.name;
        const temp = data.main.temp;
        const description = data.weather[0].description;

        $('#cityName')[0].innerText = city;
        $("#cityTemp")[0].innerText = temp;
        $("#skyDesc")[0].innerText = description;

        const iconPath = getSkyDescriptionIcon(description);
        document.getElementById("skyIcon").src = iconPath;

        $("#humidity")[0].innerText = data.main.humidity;
        $("#pressure")[0].innerText = data.main.pressure;
        $("#feelsLike")[0].innerText = data.main.feels_like;
        $("#visiblity")[0].innerText = data.visibility;

        const properDate = dateFormat(data.dt).split(',');
        $("#date")[0].innerText = properDate[0];
        $("#time")[0].innerText = properDate[1];

        const sunrise = dateFormat(data.sys.sunrise).split(',')[1];
        const sunset = dateFormat(data.sys.sunset).split(',')[1];
        $("#sunriseTime")[0].innerText = sunrise;
        $("#sunsetTime")[0].innerText = sunset;

        const lat = data.coord.lat;
        const lon = data.coord.lon;

        fetchAQIData(lat, lon);
        nextFiveDays(lat, lon);
        todayTemps(lat, lon);

    } catch (error) {
        errorElement.innerText = "⚠️ Something went wrong. Please try again.";
        console.error("Error fetching data:", error);
    }
}

        // Enable "Enter" key to trigger fetchData()
document.addEventListener("DOMContentLoaded", function () {
    const inputField = document.querySelector(".inputfield");

    inputField.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            fetchData();
        }
    });
});
