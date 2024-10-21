const apiKey = '7590683b7f7e437b978120625242110';  
const city = 'Floridablanca';
const lang = 'es';
const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&lang=${lang}`;

fetch(url)
  .then(response => {
    if (!response.ok) {
      throw new Error('Error al obtener los datos: ' + response.status);
    }
    return response.json(); 
  })
  .then(data => {
    console.log(data);
    
    const location = data.location;
    const current = data.current;

    console.log(`Ubicación: ${location.name}, ${location.region}, ${location.country}`);
    console.log(`Temperatura actual: ${current.temp_c}°C`);
    console.log(`Condición: ${current.condition.text}`);
  })
  .catch(error => {
    console.error('Error:', error);
  });
