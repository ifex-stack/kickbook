/**
 * Weather Service - Fetches weather forecast data for booking locations
 * 
 * Uses OpenWeatherMap API to get weather forecasts for booking locations
 * You'll need to set WEATHER_API_KEY in your environment variables
 * Sign up for a free API key at https://openweathermap.org/api
 */

// This is a simple implementation - in a production app, you'd want to implement
// more robust error handling, caching, and possibly use a paid weather API with more capabilities

interface WeatherForecast {
  date: string;
  temperature: number;
  description: string;
  icon: string;
  precipitation: number;
  windSpeed: number;
  humidity: number;
}

export async function getWeatherForecast(location: string, date: Date): Promise<WeatherForecast | null> {
  try {
    // For demonstration, we'll return a mock forecast
    // In a real app, you would make an API call to a weather service
    // Example with OpenWeatherMap:
    // const apiKey = process.env.WEATHER_API_KEY;
    // const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${apiKey}&units=metric`);
    // const data = await response.json();
    
    // Mock response for demonstration
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Generate some random weather data based on the booking date
    const randomTemp = Math.round(10 + Math.random() * 20); // Random temp between 10-30°C
    const randomPrecip = Math.round(Math.random() * 100) / 100; // Random precipitation between 0-1mm
    const randomWind = Math.round(Math.random() * 30) / 10; // Random wind between 0-3 m/s
    const randomHumidity = Math.round(40 + Math.random() * 40); // Random humidity between 40-80%
    
    // Weather conditions more likely to be poor on weekends for dramatic effect!
    const weatherConditions = isWeekend 
      ? ['Sunny', 'Clear', 'Partly cloudy', 'Cloudy', 'Light rain', 'Rain']
      : ['Sunny', 'Clear', 'Partly cloudy'];
    
    const randomCondition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    
    // Map weather condition to icon code
    const iconMap: Record<string, string> = {
      'Sunny': '01d',
      'Clear': '01d',
      'Partly cloudy': '02d',
      'Cloudy': '03d',
      'Light rain': '10d',
      'Rain': '09d'
    };
    
    return {
      date: date.toISOString().split('T')[0],
      temperature: randomTemp,
      description: randomCondition,
      icon: iconMap[randomCondition],
      precipitation: randomPrecip,
      windSpeed: randomWind,
      humidity: randomHumidity
    };
    
  } catch (error) {
    console.error("Error fetching weather forecast:", error);
    return null;
  }
}

export function getWeatherIconUrl(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

// Utility function to check if weather is suitable for playing
export function isSuitableForPlaying(forecast: WeatherForecast): boolean {
  // Logic to determine if weather conditions are good for playing
  // This is a simple example - you might want more complex rules
  const isHeavyRain = forecast.precipitation > 0.5;
  const isExtremeCold = forecast.temperature < 5;
  const isExtremeHeat = forecast.temperature > 35;
  const isStrongWind = forecast.windSpeed > 8;
  
  return !(isHeavyRain || isExtremeCold || isExtremeHeat || isStrongWind);
}