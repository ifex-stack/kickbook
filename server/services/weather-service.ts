/**
 * Weather Service - Fetches and manages weather forecasts for football matches
 */
import { storage } from "../storage";

// Weather forecast data structure
export interface WeatherForecast {
  date: Date;
  temperature: number;      // in Celsius
  precipitation: number;    // Probability of precipitation (0-100%)
  windSpeed: number;        // in km/h
  humidity: number;         // in percentage (0-100%)
  condition: string;        // e.g., "clear", "cloudy", "rain", "snow"
  conditionDescription: string; // More detailed description
  icon: string;             // Icon code for the weather condition
}

/**
 * Fetch weather forecast for a specific location and date
 * This would normally connect to a weather API service like OpenWeatherMap, AccuWeather, etc.
 * For development purposes, we'll generate some mock weather data
 * 
 * @param location The location to get weather for
 * @param date The date to get weather for
 */
export async function fetchWeatherForecast(location: string, date: Date): Promise<WeatherForecast> {
  try {
    // In a production environment, replace this with actual API call
    // For example: return await axios.get(`${WEATHER_API_URL}?location=${encodeURIComponent(location)}&date=${date.toISOString()}...`)
    
    // For development, generate some realistic random weather data
    const weather = generateMockWeather(date);
    
    console.log(`Fetched weather forecast for ${location} on ${date.toLocaleDateString()}`);
    return weather;
  } catch (error) {
    console.error(`Error fetching weather forecast for ${location} on ${date.toLocaleDateString()}:`, error);
    // Return a default weather forecast in case of error
    return {
      date,
      temperature: 15,
      precipitation: 20,
      windSpeed: 10,
      humidity: 60,
      condition: "unknown",
      conditionDescription: "Weather data not available",
      icon: "question_mark"
    };
  }
}

/**
 * Update weather forecasts for all upcoming bookings
 * This should be scheduled to run once or twice daily
 */
export async function updateWeatherForecasts(): Promise<void> {
  try {
    const now = new Date();
    const allBookings = await storage.getAllBookings();
    
    // Filter to only upcoming bookings within the next 7 days
    // (weather forecasts beyond that are typically less accurate)
    const upcomingBookings = allBookings.filter(booking => {
      const bookingDate = new Date(booking.startTime);
      const diffTime = bookingDate.getTime() - now.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays > 0 && diffDays <= 7;
    });
    
    console.log(`Updating weather forecasts for ${upcomingBookings.length} upcoming bookings`);
    
    // Update weather for each upcoming booking
    for (const booking of upcomingBookings) {
      const forecast = await fetchWeatherForecast(booking.location, new Date(booking.startTime));
      
      // Store the forecast in the booking's weatherData field
      await storage.updateBooking(booking.id, {
        weatherData: forecast
      });
      
      console.log(`Updated weather forecast for booking ${booking.id} - ${booking.title}`);
    }
    
    console.log('Weather forecast update completed');
  } catch (error) {
    console.error('Error updating weather forecasts:', error);
  }
}

/**
 * Get the weather forecast for a specific booking
 * @param bookingId The ID of the booking
 */
export async function getWeatherForBooking(bookingId: number): Promise<WeatherForecast | null> {
  try {
    const booking = await storage.getBooking(bookingId);
    if (!booking) {
      console.error(`Cannot get weather: Booking ${bookingId} not found`);
      return null;
    }
    
    // If the booking has weather data and it's recent (within last 12 hours), use it
    if (booking.weatherData) {
      return booking.weatherData as unknown as WeatherForecast;
    }
    
    // Otherwise fetch new weather data
    const forecast = await fetchWeatherForecast(booking.location, new Date(booking.startTime));
    
    // Store the forecast for future reference
    await storage.updateBooking(booking.id, {
      weatherData: forecast
    });
    
    return forecast;
  } catch (error) {
    console.error(`Error getting weather for booking ${bookingId}:`, error);
    return null;
  }
}

/**
 * Setup scheduled weather forecast updates
 * Should be called on server startup
 */
export function scheduleWeatherUpdates(): void {
  // Schedule to run twice daily (every 12 hours)
  setInterval(() => {
    console.log('Running scheduled weather forecast update...');
    updateWeatherForecasts();
  }, 12 * 60 * 60 * 1000);
  
  // Also run immediately on server start
  updateWeatherForecasts();
  
  console.log('Weather forecast scheduler initialized');
}

/**
 * Generate mock weather data for testing purposes
 * This produces realistic but randomized weather data
 */
function generateMockWeather(date: Date): WeatherForecast {
  // Get month to make seasonally appropriate weather
  const month = date.getMonth(); // 0-11 (Jan-Dec)
  const isWinter = month >= 11 || month <= 1; // Dec-Feb
  const isSpring = month >= 2 && month <= 4;  // Mar-May
  const isSummer = month >= 5 && month <= 7;  // Jun-Aug
  const isAutumn = month >= 8 && month <= 10; // Sep-Nov
  
  // Generate temperature based on season
  let tempBase = 15; // Base temperature
  if (isWinter) tempBase = 5;
  if (isSpring) tempBase = 15;
  if (isSummer) tempBase = 25;
  if (isAutumn) tempBase = 15;
  
  // Add some random variation
  const temperature = tempBase + (Math.random() * 10 - 5);
  
  // Generate precipitation chance based on season
  let precipitationBase = 30; // Base precipitation chance
  if (isWinter) precipitationBase = 40;
  if (isSpring) precipitationBase = 50;
  if (isSummer) precipitationBase = 20;
  if (isAutumn) precipitationBase = 60;
  
  // Add some random variation
  const precipitation = Math.min(100, Math.max(0, precipitationBase + (Math.random() * 40 - 20)));
  
  // Generate humidity based on precipitation and season
  let humidityBase = 60;
  if (precipitation > 50) humidityBase = 80;
  if (isSummer && precipitation < 30) humidityBase = 50;
  if (isWinter) humidityBase = 70;
  
  // Add some random variation
  const humidity = Math.min(100, Math.max(0, humidityBase + (Math.random() * 20 - 10)));
  
  // Generate wind speed
  const windSpeed = Math.random() * 30;
  
  // Determine weather condition based on precipitation
  let condition: string;
  let conditionDescription: string;
  let icon: string;
  
  if (precipitation < 20) {
    condition = "clear";
    conditionDescription = "Clear skies";
    icon = "wb_sunny";
  } else if (precipitation < 40) {
    condition = "partly_cloudy";
    conditionDescription = "Partly cloudy";
    icon = "partly_cloudy_day";
  } else if (precipitation < 60) {
    condition = "cloudy";
    conditionDescription = "Cloudy";
    icon = "cloud";
  } else if (precipitation < 80) {
    condition = "rain";
    conditionDescription = "Rain showers";
    icon = "rainy";
  } else {
    condition = "heavy_rain";
    conditionDescription = "Heavy rain";
    icon = "thunderstorm";
  }
  
  // Adjust for winter (snow instead of rain)
  if (isWinter && temperature < 3 && precipitation > 50) {
    condition = "snow";
    conditionDescription = "Snow";
    icon = "ac_unit";
  }
  
  return {
    date,
    temperature: parseFloat(temperature.toFixed(1)),
    precipitation: Math.round(precipitation),
    windSpeed: parseFloat(windSpeed.toFixed(1)),
    humidity: Math.round(humidity),
    condition,
    conditionDescription,
    icon
  };
}