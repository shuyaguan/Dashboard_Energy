// API Service for station and corridor data

class APIService {
  constructor() {
      this.baseUrl = 'https://widgets.nrel.gov/afdc/station-locator/api';
      this.apiKey = 'YOUR_API_KEY'; // In production, this should be secured
  }

  // Error handling wrapper
  async fetchWithErrorHandling(url, options = {}) {
      try {
          const response = await fetch(url, {
              ...options,
              headers: {
                  'Content-Type': 'application/json',
                  'X-Api-Key': this.apiKey,
                  ...options.headers
              }
          });

          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }

          return await response.json();
      } catch (error) {
          console.error('API Error:', error);
          throw error;
      }
  }

  // Get stations near a point
  async getNearestStations(lat, lng, options = {}) {
      const queryParams = new URLSearchParams({
          latitude: lat,
          longitude: lng,
          fuel_type: options.fuelType || 'ELEC',
          radius: options.radius || 50,
          limit: options.limit || 20,
          ...options
      });

      return this.fetchWithErrorHandling(
          `${this.baseUrl}/stations/nearest?${queryParams}`
      );
  }

  // Get stations by state
  async getStationsByState(state, options = {}) {
      const queryParams = new URLSearchParams({
          state: state,
          fuel_type: options.fuelType || 'ELEC',
          ...options
      });

      return this.fetchWithErrorHandling(
          `${this.baseUrl}/stations/state?${queryParams}`
      );
  }

  // Get corridor information
  async getCorridors(options = {}) {
      const queryParams = new URLSearchParams(options);
      
      return this.fetchWithErrorHandling(
          `${this.baseUrl}/corridors?${queryParams}`
      );
  }

  // Get route between two points
  async getRoute(start, end, options = {}) {
      const queryParams = new URLSearchParams({
          start_lat: start.lat,
          start_lng: start.lng,
          end_lat: end.lat,
          end_lng: end.lng,
          fuel_type: options.fuelType || 'ELEC',
          max_distance: options.maxDistance || 50,
          ...options
      });

      return this.fetchWithErrorHandling(
          `${this.baseUrl}/route?${queryParams}`
      );
  }
}

// Create and export single instance
export const apiService = new APIService();