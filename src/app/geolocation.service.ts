import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  // New Jersey bounding box
  private NJBounds = {
    north: 41.3572,   // Northernmost point
    south: 38.9285,   // Southernmost point
    west: -75.5598,   // Westernmost point
    east: -73.8939,   // Easternmost point
  };

  constructor() {}

  async isUserInNewJersey(): Promise<boolean> {
    try {
      // Request location permissions
      const permission = await Geolocation.requestPermissions();
  
      if (permission.location !== 'granted') {
        console.error('Location permission not granted');
        return false;
      }
  
      // Get the user's current position
      const coordinates = await Geolocation.getCurrentPosition();
      const { latitude, longitude } = coordinates.coords;
  
      // Check if the user is within NJ bounds
      const isInNJ =
        latitude >= this.NJBounds.south &&
        latitude <= this.NJBounds.north &&
        longitude >= this.NJBounds.west &&
        longitude <= this.NJBounds.east;
  
      return isInNJ;
    } catch (error) {
      console.error('Error getting user location:', error);
      return false;
    }
  }
}
