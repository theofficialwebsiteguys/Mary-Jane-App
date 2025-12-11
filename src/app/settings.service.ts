import { Inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, catchError, from, map, Observable } from 'rxjs';

import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';

export interface Announcement {
  id: string;
  title?: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
  priority?: 'info' | 'promo' | 'warning';
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  DARK_MODE_ENABLED = 'darkModeEnabled';

  isLoggedIn: boolean = false;

  private venuesSubject = new BehaviorSubject<any[]>([]);
  venues$ = this.venuesSubject.asObservable();

  private selectedVenueIdSubject = new BehaviorSubject<string | null>(null);
  selectedVenueId$ = this.selectedVenueIdSubject.asObservable();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.authService.isLoggedIn().subscribe((isLoggedIn) => {
      this.isLoggedIn = isLoggedIn;
      this.isDarkModeEnabled.next(this.getDarkModeEnabled());
      this.updateTheme();
    });
  }


  async getAlpineVenues(): Promise<any[]> {
    const options = {
      url: `${environment.apiUrl}/alpine/venues?venue_id=54b6dd7c6a45d7ce`,
      method: 'GET',
      headers: { 
        'x-auth-api-key': environment.db_api_key,
        'Content-Type': 'application/json'
      },
    };

    try {
      const response = await CapacitorHttp.request(options);
      const venues = response.data
       .filter((venue: any) => !venue.name.includes('Astoria')) 
       .map((venue: any) => {
        let key = 'UNKNOWN';

        if (venue.name.includes('Rochester')) key = 'ROCHESTER';
        else if (venue.name.includes('CANANDAIGUA')) key = 'CANANDAIGUA';

        return {
          ...venue,
          key,
        };
      });

      this.venuesSubject.next(venues);
      return venues;
    } catch (error) {
      console.error('Error fetching venues from backend:', error);
      throw error;
    }
  }

  setSelectedVenueId(id: string): void {
    this.selectedVenueIdSubject.next(id);
    localStorage.setItem('selectedVenueId', id);
  }

  getSelectedVenueKey(): string | null {
    const venueId = this.getSelectedVenueId();
    const venues = this.venuesSubject.value;

    const selectedVenue = venues.find(v => v.id === venueId);
    return selectedVenue?.key ?? null;
  }


  getSelectedVenueId(): string | null {
    const id = this.selectedVenueIdSubject.value;
    if (id) return id;

    const saved = localStorage.getItem('selectedVenueId');
    if (saved) {
      this.selectedVenueIdSubject.next(saved);
      return saved;
    }

    return null;
  }
  
  private getHeaders(): { [key: string]: string } {
    const sessionData = localStorage.getItem('sessionData');
    const token = sessionData ? JSON.parse(sessionData).token : null;
  
    if (!token) {
      console.error('No API key found, user needs to log in.');
      throw new Error('Unauthorized: No API key found');
    }
  
    return {
      'x-auth-api-key': environment.db_api_key,
      Authorization: token,
      'Content-Type': 'application/json',
    };
  }

  getDarkModeEnabled = (): boolean =>
    localStorage.getItem(this.DARK_MODE_ENABLED) === 'true' && this.isLoggedIn;

  setDarkModeEnabled = (value: boolean): void => {
    localStorage.setItem(this.DARK_MODE_ENABLED, JSON.stringify(value));
    this.isDarkModeEnabled.next(value);
    this.updateTheme();
  };

  updateTheme(): void {
    this.getDarkModeEnabled()
      ? this.document.body.classList.add('dark-mode')
      : this.document.body.classList.remove('dark-mode');
  }

  async getUserNotifications(): Promise<any> {
    try {
      const userId = this.authService.getCurrentUser().id;
      const url = `${environment.apiUrl}/notifications/all?userId=${userId}`;

      const response = await CapacitorHttp.get({ 
        url, 
        headers: this.getHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching user notifications:', JSON.stringify(error));
      return null;
    }
  }
  
  async markNotificationAsRead(notificationId: number): Promise<any> {
    try {
      const url = `${environment.apiUrl}/notifications/mark-read/${notificationId}`;

      const response = await CapacitorHttp.put({
        url,
        headers: this.getHeaders(),
        data: {},
      });

      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', JSON.stringify(error));
      return null;
    }
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<any> {
    try {
      const url = `${environment.apiUrl}/notifications/mark-all-read`;

      const response = await CapacitorHttp.put({
        url,
        headers: this.getHeaders(),
        data: { userId },
      });

      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', JSON.stringify(error));
      return null;
    }
  }
  
  async deleteNotification(notificationId: number): Promise<any> {
    try {
      const url = `${environment.apiUrl}/notifications/delete/${notificationId}`;

      const response = await CapacitorHttp.delete({ 
        url, 
        headers: this.getHeaders() 
      });

      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', JSON.stringify(error));
      return null;
    }
  }
  
  async deleteAllNotifications(userId: number): Promise<any> {
    try {
      const url = `${environment.apiUrl}/notifications/delete-all`;

      const response = await CapacitorHttp.delete({
        url,
        headers: this.getHeaders(),
        data: { userId },
      });

      return response.data;
    } catch (error) {
      console.error('Error deleting all notifications:', JSON.stringify(error));
      return null;
    }
  }

  private isDarkModeEnabled = new BehaviorSubject<boolean>(
    this.getDarkModeEnabled()
  );
  isDarkModeEnabled$ = this.isDarkModeEnabled.asObservable();

  getCarouselImages(): Observable<{ images: string[] }> {
    const url = `${environment.apiUrl}/notifications/images`;
  
    const options = {
      method: 'GET',
      url,
      headers: { 'x-auth-api-key': environment.db_api_key } // Add headers
    };
  
    return from(CapacitorHttp.request(options)).pipe(
      map((response: any) => response.data) // Extract the `data` property
    );
  }

  async sendMessage(name: string, email: string, message: string) {
    const emailData = {
      subject: `New Message from ${name}`,  // ✅ Use backticks for template literals
      message: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`  // ✅ Properly format string
    };

    const options = {
      url: `${environment.apiUrl}/businesses/send-email`,  // ✅ Fix missing backticks
      method: 'POST',
      headers: { 
        'x-auth-api-key': environment.db_api_key,
        'Content-Type': 'application/json'  // ✅ Ensure correct content type
      },
      data: emailData  // ✅ Ensure proper structure
    };

    try {
      const response = await CapacitorHttp.request(options);
      console.log('Email sent!', response);
      return response;
    } catch (error) {
      console.error('Error sending email', error);
      throw error;
    }
}

  checkDeliveryEligibility(): Observable<{ deliveryAvailable: boolean }> {
    const options = {
      url: `${environment.apiUrl}/businesses/delivery-eligibility`,
      method: 'GET',
      headers: this.getHeaders()
    };

    // Convert CapacitorHttp request to Observable
    return from(CapacitorHttp.request(options).then(response => response.data));
  }

  async getDeliveryZone(): Promise<any> {
    const options = {
      url: `${environment.apiUrl}/businesses/zone`,
      method: 'GET',
      headers: this.getHeaders()
    };
  
    try {
      const response = await CapacitorHttp.request(options);
      return response.data;
    } catch (error) {
      console.error('Error fetching delivery zone:', error);
      throw error;
    }
  }
  
  async checkAddressInZone(businessId: number, address: string): Promise<{ inZone: boolean, lat: number, lng: number }> {
    const options = {
      url: `${environment.apiUrl}/businesses/zone/check`,
      method: 'POST',
      headers: this.getHeaders(),
      data: { address }
    };
  
    try {
      const response = await CapacitorHttp.request(options);
      return response.data;
    } catch (error) {
      console.error('Error checking address in zone:', error);
      throw error;
    }
  }
  
  async getBusinessAnnouncements(): Promise<Announcement[]> {
    const options = {
      url: `${environment.apiUrl}/businesses/announcements`,
      method: 'GET',
      headers: { 'x-auth-api-key': environment.db_api_key },
    };

    try {
      const response = await CapacitorHttp.request(options);

      console.log('Fetched announcements:', response.data);
      return response.data as Announcement[];
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
  }
  

  async getDiscounts(): Promise<any[]> {
    const options = {
      url: `${environment.apiUrl}/alpine/discounts`,
      method: 'GET',
      headers: { 'x-auth-api-key': environment.db_api_key },
    };

    try {
      const response = await CapacitorHttp.request(options);

      console.log('Fetched discounts:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching discounts:', error);
      return [];
    }
  }
}
