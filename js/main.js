const apiKey = '7590683b7f7e437b978120625242110';  
const input = document.getElementById('location-input');
const suggestionsContainer = document.getElementById('suggestions');
const searchIcon = document.getElementById('search-icon'); 
let currentIndex = -1;
let places = [];

let previousWind = 0; 
let previousRainChance = 0; 
let previousPressure = 0; 
let previousUV = 0; 

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

searchIcon.addEventListener('click', (event) => {
    event.stopPropagation(); 
    if (input.style.display === 'none' || input.style.display === '') {
        input.style.display = 'block';
        input.focus(); 
    } else {
        input.style.display = 'none';
        suggestionsContainer.innerHTML = ''; 
    }
});

document.addEventListener('click', (event) => {
    if (event.target !== input && event.target !== searchIcon) {
        input.style.display = 'none';
        suggestionsContainer.innerHTML = '';
    }
});

input.addEventListener('click', (event) => {
    event.stopPropagation();
});

input.addEventListener('input', debounce(() => {
    const query = input.value.trim();

    if (query.length > 2) {
        const url = `https://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${query}`;
        
        suggestionsContainer.innerHTML = '<div>Loading...</div>';
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la búsqueda: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                places = data;
                currentIndex = -1;
                showSuggestions(data);
            })
            .catch(error => {
                console.error('Error:', error);
                suggestionsContainer.innerHTML = '<div>No results found.</div>'; // Mensaje de error
            });
    } else {
        suggestionsContainer.innerHTML = '';
        places = [];
    }
}, 200));

input.addEventListener('keydown', (event) => {
    const suggestionDivs = suggestionsContainer.querySelectorAll('div');

    if (event.key === 'ArrowDown') {
        currentIndex = (currentIndex + 1) % suggestionDivs.length;
        highlightSuggestion(suggestionDivs, currentIndex);
    } else if (event.key === 'ArrowUp') {
        currentIndex = (currentIndex - 1 + suggestionDivs.length) % suggestionDivs.length;
        highlightSuggestion(suggestionDivs, currentIndex);
    } else if (event.key === 'Enter') {
        if (currentIndex > -1 && currentIndex < suggestionDivs.length) {
            const selectedPlace = places[currentIndex];
            input.value = selectedPlace.name;
            suggestionsContainer.innerHTML = '';
            currentIndex = -1;
            fetchWeatherData(selectedPlace.name);
        }
    }
});

function highlightSuggestion(suggestionDivs, index) {
    suggestionDivs.forEach((div, i) => {
        div.style.backgroundColor = i === index ? '#e0e0e0' : '#fff';
    });
}

function showSuggestions(places) {
    suggestionsContainer.innerHTML = '';

    if (places.length > 0) {
        suggestionsContainer.style.display = 'block'; 
        places.forEach((place, index) => {
            const suggestionDiv = document.createElement('div');
            suggestionDiv.textContent = `${place.name}, ${place.region}, ${place.country}`;
            
            suggestionDiv.addEventListener('click', () => {
                input.value = place.name;
                suggestionsContainer.innerHTML = '';
                suggestionsContainer.style.display = 'none'; 
                currentIndex = -1;
                fetchWeatherData(place.name);
            });

            suggestionsContainer.appendChild(suggestionDiv);
        });
    } else {
        suggestionsContainer.style.display = 'none'; 
    }
}

function fetchWeatherData(location) {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${location}&days=1&aqi=no&alerts=no`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener el clima: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            displayWeatherData(data);
            displayHourlyForecast(data);
            displayHourlyForecast2(data);
            console.log(data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function displayWeatherData(data) {
    if (data && data.location && data.current && data.forecast) {
        document.getElementById('location-name').textContent = `${data.location.name}, ${data.location.region}`;
        document.getElementById('temperature').textContent = `${data.current.temp_c}°`;
        document.getElementById('feels-like').textContent = `Feels like ${data.current.feelslike_c}°`;
        
        const maxTempDay = data.forecast.forecastday[0].day.maxtemp_c;
        const minTempNight = data.forecast.forecastday[0].day.mintemp_c;
        
        document.getElementById('maxTempDay').textContent = `Day ${maxTempDay}°`;
        document.getElementById('minTempNight').textContent = `Night ${minTempNight}°`;

        const localtime = data.location.localtime;
        const fecha = new Date(localtime);
        const meses = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const nombreMes = meses[fecha.getMonth()];
        const dia = fecha.getDate();
        const horas = fecha.getHours().toString().padStart(2, '0');
        const minutos = fecha.getMinutes().toString().padStart(2, '0');

        document.getElementById('localTime').textContent = `${nombreMes} ${dia}, ${horas}:${minutos}`;
        
        document.getElementById('condition').textContent = `${data.current.condition.text}`;
        document.getElementById('humidity').textContent = `Humedad: ${data.current.humidity}%`;

        const currentWind = data.current.wind_kph;
        const currentRainChance = data.forecast.forecastday[0].day.daily_chance_of_rain;
        const currentPressure = data.current.pressure_mb;
        const currentUV = data.current.uv;

        document.getElementById('wind').textContent = `${currentWind} km/h`;
        document.getElementById('rain-chance').textContent = `${currentRainChance}%`;
        document.getElementById('pressure').textContent = `${currentPressure} hPa`;
        document.getElementById('uv-index').textContent = `${currentUV}`;

        document.getElementById('wind-change').textContent = `${(currentWind - previousWind).toFixed(1)} km/h`;
        document.getElementById('rain-change').textContent = `${(currentRainChance - previousRainChance).toFixed(1)}%`;
        document.getElementById('pressure-change').textContent = `${(currentPressure - previousPressure).toFixed(1)} hPa`;
        document.getElementById('uv-change').textContent = `${(currentUV - previousUV).toFixed(1)}`;

        document.getElementById('temperature2').textContent = `${data.current.temp_c}°`;
        document.getElementById('weather-icon2').src = data.current.condition.icon;
        document.getElementById('weather-icon2').alt = data.current.condition.text;

        previousWind = currentWind;
        previousRainChance = currentRainChance;
        previousPressure = currentPressure;
        previousUV = currentUV;

        document.getElementById('weather-icon').src = data.current.condition.icon;
        document.getElementById('weather-icon').alt = data.current.condition.text;

        const sunrise = data.forecast.forecastday[0].astro.sunrise;
        const sunset = data.forecast.forecastday[0].astro.sunset;

        const currentTime = new Date(data.location.localtime);
        const currentHour = currentTime.getHours();
        const currentMinutes = currentTime.getMinutes();

        const [sunriseHour, sunriseMinute] = sunrise.split(' ')[0].split(':').map(Number);
        const [sunsetHour, sunsetMinute] = sunset.split(' ')[0].split(':').map(Number);

        const sunriseTime = new Date(currentTime);
        const sunsetTime = new Date(currentTime);
        sunriseTime.setHours(sunriseHour + (sunrise.includes('PM') ? 12 : 0), sunriseMinute);
        sunsetTime.setHours(sunsetHour + (sunset.includes('PM') ? 12 : 0), sunsetMinute);

        const timeSinceSunrise = Math.floor((currentTime - sunriseTime) / (1000 * 60 * 60));
        const timeUntilSunset = Math.ceil((sunsetTime - currentTime) / (1000 * 60 * 60)); 

        document.getElementById('sunrise-time').textContent = sunrise;
        document.getElementById('sunset-time').textContent = sunset;
        document.getElementById('time-since-sunrise').textContent = `${timeSinceSunrise}h ago`;
        document.getElementById('time-until-sunset').textContent = `in ${timeUntilSunset}h`;

        input.value = '';
        suggestionsContainer.innerHTML = '';
    } else {
        console.error('Datos del clima no disponibles.');
    }
}

function displayHourlyForecast(data) {
    const currentHour = new Date(data.location.localtime).getHours();
    const forecastHours = data.forecast.forecastday[0].hour;

    for (let i = 1; i <= 5; i++) {
        const hourData = forecastHours[(currentHour + i) % 24];
        const time = new Date(hourData.time).getHours().toString().padStart(2, '0') + ':00';
        const temp = hourData.temp_c + '°C';
        const condition = hourData.condition.text;
        const icon = hourData.condition.icon;

        document.getElementById(`hour-${i}`).textContent = time;
        document.getElementById(`temp-${i}`).textContent = temp;
        document.getElementById(`icon-${i}`).src = icon;
        document.getElementById(`icon-${i}`).alt = condition;
    }
}

function displayHourlyForecast2(data) {
    const currentHour = new Date(data.location.localtime).getHours();
    const forecastHours = data.forecast.forecastday[0].hour;

    for (let i = 1; i <= 4; i++) {
        const hourIndex = (currentHour + i) % 24;
        const hourData = forecastHours[hourIndex];
        const hourTime = new Date(hourData.time).getHours();

        const formattedHour = (hourTime % 12 || 12) + (hourTime >= 12 ? ' PM' : ' AM');
        const rainChance = hourData.chance_of_rain;

        document.getElementById(`hour-${i}2`).textContent = formattedHour;
        document.getElementById(`rain-prob-${i}`).textContent = rainChance + '%';
        
        const rainBar = document.getElementById(`rain-bar-${i}`);
        rainBar.style.width = `${rainChance}%`;
        rainBar.style.backgroundColor = '#6a0dad';
    }
}


document.addEventListener('DOMContentLoaded', () => {
    fetchWeatherData('Floridablanca, Santander, Colombia');
});


