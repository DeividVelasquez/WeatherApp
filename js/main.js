const apiKey = '7590683b7f7e437b978120625242110';  
const input = document.getElementById('location-input');
const suggestionsContainer = document.getElementById('suggestions');
const searchIcon = document.getElementById('search-icon'); 
let currentIndex = -1;
let places = [];

// Variables para almacenar valores anteriores (inicializados en 0)
let previousWind = 0; 
let previousRainChance = 0; 
let previousPressure = 0; 
let previousUV = 0; 

// Debounce function
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// Función para mostrar/ocultar el input de búsqueda al hacer clic en la lupa
searchIcon.addEventListener('click', (event) => {
    event.stopPropagation(); 
    if (input.style.display === 'none' || input.style.display === '') {
        input.style.display = 'block'; // Mostrar el input
        input.focus(); // Enfocar el input
    } else {
        input.style.display = 'none'; // Ocultar el input
        suggestionsContainer.innerHTML = ''; // Limpiar sugerencias al ocultar
    }
});

// Ocultar el input al hacer clic en cualquier lugar de la página
document.addEventListener('click', (event) => {
    if (event.target !== input && event.target !== searchIcon) {
        input.style.display = 'none';
        suggestionsContainer.innerHTML = ''; // Limpiar sugerencias
    }
});

// Evitar que el clic dentro del input lo oculte
input.addEventListener('click', (event) => {
    event.stopPropagation();
});

// Función para manejar la entrada del usuario
input.addEventListener('input', debounce(() => {
    const query = input.value.trim(); // Trim para eliminar espacios en blanco

    if (query.length > 2) {
        const url = `https://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${query}`;
        
        // Mostrar mensaje de carga
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
}, 200)); // 200 ms delay

// Manejo de teclas para navegar por las sugerencias
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
            input.value = selectedPlace.name; // Actualiza el valor del input con el nombre del lugar
            suggestionsContainer.innerHTML = '';
            currentIndex = -1;
            fetchWeatherData(selectedPlace.name);
        }
    }
});

// Resaltar sugerencias
function highlightSuggestion(suggestionDivs, index) {
    suggestionDivs.forEach((div, i) => {
        div.style.backgroundColor = i === index ? '#e0e0e0' : '#fff';
    });
}

// Mostrar sugerencias
function showSuggestions(places) {
    suggestionsContainer.innerHTML = '';

    if (places.length > 0) {
        suggestionsContainer.style.display = 'block'; 
        places.forEach((place, index) => {
            const suggestionDiv = document.createElement('div');
            suggestionDiv.textContent = `${place.name}, ${place.region}, ${place.country}`;
            
            suggestionDiv.addEventListener('click', () => {
                input.value = place.name; // Actualiza el valor del input con el nombre del lugar
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

// Obtener datos del clima (usando el endpoint forecast para obtener día y noche)
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
            displayHourlyForecast(data); // Mostrar el pronóstico por horas
            displayHourlyForecast2(data);
            console.log(data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Mostrar datos del clima y las temperaturas diurnas y nocturnas
function displayWeatherData(data) {
    if (data && data.location && data.current && data.forecast) {
        document.getElementById('location-name').textContent = `${data.location.name}, ${data.location.region}`;
        document.getElementById('temperature').textContent = `${data.current.temp_c}°`;
        document.getElementById('feels-like').textContent = `Feels like ${data.current.feelslike_c}°`;
        
        // Extraer las temperaturas máximas del día y mínimas de la noche
        const maxTempDay = data.forecast.forecastday[0].day.maxtemp_c; // Máxima del día
        const minTempNight = data.forecast.forecastday[0].day.mintemp_c; // Mínima de la noche
        
        document.getElementById('maxTempDay').textContent = `Day ${maxTempDay}°`;
        document.getElementById('minTempNight').textContent = `Night ${minTempNight}°`;

        // Transformación de la fecha
        const localtime = data.location.localtime;
        const fecha = new Date(localtime);
        const meses = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const nombreMes = meses[fecha.getMonth()];
        const dia = fecha.getDate();
        const horas = fecha.getHours().toString().padStart(2, '0');
        const minutos = fecha.getMinutes().toString().padStart(2, '0');

        // Mostrar el formato "Mes Día, HH:MM"
        document.getElementById('localTime').textContent = `${nombreMes} ${dia}, ${horas}:${minutos}`;
        
        document.getElementById('condition').textContent = `${data.current.condition.text}`;
        document.getElementById('humidity').textContent = `Humedad: ${data.current.humidity}%`;

        // Mostrar datos de viento, lluvia, presión e índice UV
        const currentWind = data.current.wind_kph;
        const currentRainChance = data.forecast.forecastday[0].day.daily_chance_of_rain;
        const currentPressure = data.current.pressure_mb;
        const currentUV = data.current.uv;

        document.getElementById('wind').textContent = `${currentWind} km/h`;
        document.getElementById('rain-chance').textContent = `${currentRainChance}%`;
        document.getElementById('pressure').textContent = `${currentPressure} hPa`;
        document.getElementById('uv-index').textContent = `${currentUV}`;

        // Calcular y mostrar los valores de extra-value
        document.getElementById('wind-change').textContent = `${(currentWind - previousWind).toFixed(1)} km/h`;
        document.getElementById('rain-change').textContent = `${(currentRainChance - previousRainChance).toFixed(1)}%`;
        document.getElementById('pressure-change').textContent = `${(currentPressure - previousPressure).toFixed(1)} hPa`;
        document.getElementById('uv-change').textContent = `${(currentUV - previousUV).toFixed(1)}`;

        document.getElementById('temperature2').textContent = `${data.current.temp_c}°`;
        document.getElementById('weather-icon2').src = data.current.condition.icon;
        document.getElementById('weather-icon2').alt = data.current.condition.text;

        // Actualizar los valores anteriores
        previousWind = currentWind;
        previousRainChance = currentRainChance;
        previousPressure = currentPressure;
        previousUV = currentUV;

        document.getElementById('weather-icon').src = data.current.condition.icon;
        document.getElementById('weather-icon').alt = data.current.condition.text;

        // Mostrar salida y puesta del sol
        const sunrise = data.forecast.forecastday[0].astro.sunrise;
        const sunset = data.forecast.forecastday[0].astro.sunset;

        // Extraer horas actuales
        const currentTime = new Date(data.location.localtime);
        const currentHour = currentTime.getHours();
        const currentMinutes = currentTime.getMinutes();

        // Calcular tiempo desde la salida del sol y hasta la puesta del sol
        const [sunriseHour, sunriseMinute] = sunrise.split(' ')[0].split(':').map(Number);
        const [sunsetHour, sunsetMinute] = sunset.split(' ')[0].split(':').map(Number);

        const sunriseTime = new Date(currentTime);
        const sunsetTime = new Date(currentTime);
        sunriseTime.setHours(sunriseHour + (sunrise.includes('PM') ? 12 : 0), sunriseMinute);
        sunsetTime.setHours(sunsetHour + (sunset.includes('PM') ? 12 : 0), sunsetMinute);

        // Diferencias de tiempo
        const timeSinceSunrise = Math.floor((currentTime - sunriseTime) / (1000 * 60 * 60)); // Horas desde salida
        const timeUntilSunset = Math.ceil((sunsetTime - currentTime) / (1000 * 60 * 60)); // Horas hasta puesta

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

// Mostrar pronóstico por horas en los divs
function displayHourlyForecast(data) {
    const currentHour = new Date(data.location.localtime).getHours();
    const forecastHours = data.forecast.forecastday[0].hour;

    // Mostrar el pronóstico para las próximas 5 horas desde la hora actual
    for (let i = 1; i <= 5; i++) {
        const hourData = forecastHours[(currentHour + i) % 24]; // Obtener la hora, asegurarse de que no se salga de rango
        const time = new Date(hourData.time).getHours().toString().padStart(2, '0') + ':00';
        const temp = hourData.temp_c + '°C';
        const condition = hourData.condition.text;
        const icon = hourData.condition.icon;

        // Actualizar los elementos del DOM para cada hora
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

        // Formatear la hora en formato 12 horas
        const formattedHour = (hourTime % 12 || 12) + (hourTime >= 12 ? ' PM' : ' AM');
        const rainChance = hourData.chance_of_rain; // Probabilidad de lluvia

        // Actualizar el contenido de los elementos
        document.getElementById(`hour-${i}2`).textContent = formattedHour;
        document.getElementById(`rain-prob-${i}`).textContent = rainChance + '%';
        
        // Ajustar el ancho de la barra según la probabilidad de lluvia
        const rainBar = document.getElementById(`rain-bar-${i}`);
        rainBar.style.width = `${rainChance}%`;
        rainBar.style.backgroundColor = '#6a0dad'; // Color de la barra
    }
}


// Llamar a la función fetchWeatherData para Floridablanca al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    fetchWeatherData('Floridablanca, Santander, Colombia');
});


