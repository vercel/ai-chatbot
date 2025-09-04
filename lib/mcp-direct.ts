/**
 * Integração direta com MCP via Claude CLI
 */

export async function getWeatherViaMCP(location: string) {
  try {
    // Chama o MCP diretamente via fetch para nossa API
    const response = await fetch('/api/mcp/direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'get_weather_by_city',
        params: {
          city_name: location,
          country_code: 'BR',
          units: 'metric'
        }
      })
    });

    if (!response.ok) {
      console.error('MCP request failed:', response.status, response.statusText);
      throw new Error('MCP request failed');
    }

    const data = await response.json();
    console.log('MCP Response:', data);
    
    // Formata dados do MCP para nosso formato
    if (data.success && data.result) {
      const weather = data.result;
      
      // Traduz condições para português
      const conditionMap: Record<string, string> = {
        'açık': 'Céu limpo',
        'clear': 'Céu limpo',
        'clear sky': 'Céu limpo',
        'sunny': 'Ensolarado',
        'bulutlu': 'Nublado',
        'clouds': 'Nublado',
        'cloudy': 'Nublado',
        'overcast': 'Nublado',
        'yağmurlu': 'Chuvoso',
        'rain': 'Chuvoso',
        'light rain': 'Chuva leve',
        'parçalı bulutlu': 'Parcialmente nublado',
        'partly cloudy': 'Parcialmente nublado',
        'mist': 'Neblina',
        'fog': 'Névoa'
      };
      
      const condition = weather.hava_durumu?.açıklama || 
                       weather.hava?.açıklama ||
                       weather.weather?.[0]?.description || 
                       'Desconhecido';
      
      console.log('Returning MCP weather data with source:', 'mcp');
      
      return {
        type: 'weather',
        data: {
          location: weather.konum?.şehir || weather.konum?.ad || location,
          temperature: weather.sıcaklık?.mevcut || weather.ana?.sicaklik || weather.main?.temp || 25,
          condition: conditionMap[condition.toLowerCase()] || condition,
          humidity: weather.atmosfer?.nem || weather.ana?.nem || weather.main?.humidity || 50,
          windSpeed: weather.rüzgar?.hız || weather.ruzgar?.hiz || weather.wind?.speed || 0,
          pressure: weather.atmosfer?.basınç || weather.ana?.basinc || weather.main?.pressure || 1013,
          feelsLike: weather.sıcaklık?.hissedilen || weather.ana?.hissedilen || weather.main?.feels_like || 25,
          visibility: (weather.atmosfer?.görüş_mesafesi || weather.gorunurluk || weather.visibility || 10000) / 1000,
          previsao: weather.previsao || [],  // Passa dados de previsão
          source: data.source || 'mcp'  // Usa o source real da API
        },
        source: data.source || 'mcp'
      };
    }
  } catch (error) {
    console.error('Erro ao chamar MCP:', error);
  }

  // Fallback para simulação
  return {
    type: 'weather',
    data: {
      location,
      temperature: Math.floor(Math.random() * 15 + 20),
      condition: 'Parcialmente nublado',
      humidity: Math.floor(Math.random() * 30 + 50),
      windSpeed: Math.floor(Math.random() * 10 + 5),
      source: 'simulated'
    },
    source: 'simulated'
  };
}