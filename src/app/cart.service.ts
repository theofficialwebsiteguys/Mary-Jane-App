import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, forkJoin, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { CapacitorHttp } from '@capacitor/core';

export interface CartItem {
  id: string;
  image: string;
  brand: string;
  desc: string;
  price: string;
  quantity: number;
  title: string;
  strainType: string;
  thc: string;
  weight: string;
  category: string;
  id_item?: string;
  price_after_points?: number;
  price_after_premium?: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cartKey = 'cart'; 
  private cartSubject = new BehaviorSubject<CartItem[]>(this.getCart());
  cart$ = this.cartSubject.asObservable(); 
  private inactivityTime = 0;
  private inactivityLimit = 24 * 24 * 60; // 24 hours
  private userId: number | null = null; // Store user ID
  private lastNotificationKey = 'lastCartAbandonmentNotification';

  private inactivityTimer: any;

  constructor(private http: HttpClient, private authService: AuthService) {
    if (!sessionStorage.getItem(this.cartKey)) {
      sessionStorage.setItem(this.cartKey, JSON.stringify([]));
    }

    this.authService.isLoggedIn().subscribe((status) => {
      if (status) {
        this.authService.getUserInfo().subscribe((user: any) => {
          if (user) {
            this.userId = user.id;
            sessionStorage.removeItem(this.lastNotificationKey);
            this.setupTracking();
          }
        });
      }
    });
    
  }

  private setupTracking() {
    document.addEventListener('mousemove', () => this.resetInactivity());
    document.addEventListener('keypress', () => this.resetInactivity());
  
    const trackInactivity = () => {
      this.inactivityTime += 1; // Increase by half-second steps
  
      if (this.inactivityTime > this.inactivityLimit && this.getCart().length > 0) {
        this.handleAbandonedCart();
      }
  
      this.inactivityTimer = setTimeout(trackInactivity, 1000); // Schedule next check
    };
  
    trackInactivity();
  }
  
  ngOnDestroy() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
  }
  

  private resetInactivity() {
    if (this.getCart().length === 0) {
      sessionStorage.removeItem(this.lastNotificationKey);
    }
    if (this.inactivityTime > 0) {
      this.inactivityTime = 0; // Reset inactivity timer
    }
  }

  private handleAbandonedCart() {
    const cartItems = this.getCart();
    const lastNotification = sessionStorage.getItem(this.lastNotificationKey);

    if (cartItems.length > 0 && this.userId && !lastNotification) {
      this.sendCartAbandonmentNotification(this.userId);
      sessionStorage.setItem(this.lastNotificationKey, 'sent'); // Mark as sent
    }
  }
  

  private async sendCartAbandonmentNotification(userId: number) {
    const payload = { userId, title: 'Forget To Checkout?', body: 'Come back to checkout!' };
  
    const sessionData = localStorage.getItem('sessionData');
    const token = sessionData ? JSON.parse(sessionData).token : null;
  
    const headers = {
      Authorization: token,
      'Content-Type': 'application/json'
    };
  
    try {
      const response = await CapacitorHttp.post({
        url: `${environment.apiUrl}/notifications/send-push`,
        headers,
        data: payload
      });
      console.log('Cart abandonment notification sent', response);
    } catch (error) {
      console.error('Error sending notification', error);
    }
  }

  getCart(): CartItem[] {
    const cart = sessionStorage.getItem(this.cartKey);
    return cart ? JSON.parse(cart) : [];
  }

  addToCart(item: CartItem) {
    const cart = this.getCart();
    const existingItemIndex = cart.findIndex(
      (cartItem: CartItem) => cartItem.id === item.id
    );

    if (existingItemIndex !== -1) {
      cart[existingItemIndex].quantity += item.quantity;
    } else {
      cart.push(item);
    }

    console.log(cart)
    this.saveCart(cart);
  }

  updateQuantity(itemId: string, quantity: number) {
    const cart = this.getCart();
    const itemIndex = cart.findIndex((cartItem: CartItem) => cartItem.id === itemId);

    if (itemIndex !== -1) {
      cart[itemIndex].quantity = quantity;
      if (cart[itemIndex].quantity <= 0) {
        cart.splice(itemIndex, 1);
      }
      this.saveCart(cart);
    }
  }

  removeFromCart(itemId: string) {
    const cart = this.getCart();
    const updatedCart = cart.filter((cartItem: CartItem) => cartItem.id !== itemId);
    this.saveCart(updatedCart);
  }

  clearCart() {
    this.saveCart([]);
  }

  checkout(points_redeem: number, orderType: string, deliveryAddress: any) {
    const cartItems = this.getCart();

    this.authService.getUserInfo().subscribe((user_info: any) => {
      const preorder: any = {
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        isDelivery: orderType === 'delivery',
        notes: '',
        ...(orderType === 'delivery' && {
          deliveryInfo: {
            street: deliveryAddress.street,
            street2: deliveryAddress.street2 || '',
            city: deliveryAddress.city,
            state: deliveryAddress.state,
            zip: deliveryAddress.zip,
          }
        })
      };

      const userInfo = {
        firstName: user_info.fname,
        lastName: user_info.lname,
        emailAddress: user_info.email,
        phone: user_info.phone,
        dateOfBirth: user_info.dob,
      };

      const payload = {
        preorder,
        userInfo,
      };

      console.log(payload)

      CapacitorHttp.post({
        url: `${environment.apiUrl}/dutchie/submitOrder`,
        headers: {
          'x-auth-api-key': environment.db_api_key,
          'Content-Type': 'application/json'
        },
        data: payload,
      })
        .then((response) => {
          console.log('Dutchie preorder submitted successfully:', response.data);
          this.clearCart();
          // Navigate to confirmation screen if needed
        })
        .catch((error) => {
          console.error('Dutchie preorder failed:', error);
        });
    });
  }

  

  // Save the cart back to sessionStorage and notify subscribers
  private saveCart(cart: CartItem[]) {
    sessionStorage.setItem(this.cartKey, JSON.stringify(cart));
    this.cartSubject.next(cart); // Emit the updated cart
  }

  async placeOrder(user_id: number, pos_order_id: number, points_add: number, points_redeem: number, amount: number, cart: any) {
    const payload = { user_id, pos_order_id, points_add, points_redeem, amount, cart };
  
  
    const sessionData = localStorage.getItem('sessionData');
    const token = sessionData ? JSON.parse(sessionData).token : null;
  
    if (!token) {
      throw new Error("No user logged in");
    }
  
    const headers = {
      Authorization: token,
      'Content-Type': 'application/json', // Ensure it's set
      Accept: 'application/json',
    };
    
    const options = {
      url: `${environment.apiUrl}/orders/create`,
      method: 'POST',
      headers: headers,
      data: payload,
    };
  
    return CapacitorHttp.request(options)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        console.error('Error in placeOrder:', error);
        throw error;
      });
  }
  
  
  async checkCartPrice(cartItems: any[], isDelivery: boolean, customerTypeId: number) {
    const payload = {
      cart: cartItems,
      delivery: isDelivery,
      customerTypeId: customerTypeId
    };

    const sessionData = localStorage.getItem('sessionData');
    const token = sessionData ? JSON.parse(sessionData).token : null;

    if (!token) {
      throw new Error("No user logged in");
    }

    const headers = {
      'x-auth-api-key': environment.db_api_key,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const options = {
      url: `${environment.apiUrl}/dutchie/cartPrice`,
      method: 'POST',
      headers: headers,
      data: payload,
    };

    return CapacitorHttp.request(options)
      .then(response => response.data)
      .catch(error => {
        console.error('Error in checkCartPrice:', error);
        throw error;
      });
  }
}
