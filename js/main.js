const apiKey = '7590683b7f7e437b978120625242110';  
const input = document.getElementById('location-input');
const suggestionsContainer = document.getElementById('suggestions');
const searchIcon = document.getElementById('search-icon'); 
let currentIndex = -1;
let places = [];

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
        document.getElementById('wind').textContent = `Viento: ${data.current.wind_kph} km/h`;
        document.getElementById('weather-icon').src = data.current.condition.icon;
        document.getElementById('weather-icon').alt = data.current.condition.text;

        input.value = '';
        suggestionsContainer.innerHTML = '';
    } else {
        console.error('Datos del clima no disponibles.');
    }
}

// Llamar a la función fetchWeatherData para Floridablanca al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    fetchWeatherData('Floridablanca, Santander, Colombia');
});
