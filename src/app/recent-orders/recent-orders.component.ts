import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { CartItem, CartService } from '../cart.service';
import { AccessibilityService } from '../accessibility.service';
import { CapacitorHttp } from '@capacitor/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-recent-orders',
  templateUrl: './recent-orders.component.html',
  styleUrls: ['./recent-orders.component.scss'],
})
export class RecentOrdersComponent  implements OnInit {
  pendingOrders: any[] = [];
  pastOrders: any[] = [];
  loading: boolean = true; // Track loading state
  expandedOrderIndex: { pending: number | null; past: number | null } = {
    pending: null,
    past: null,
  }; 

  constructor(private authService: AuthService, private cartService: CartService, private accessibilityService: AccessibilityService) {}

  ngOnInit() {
  this.loading = true; // Ensure loading state is set before subscribing

  this.authService.orders.subscribe((orders) => {
    // If the observable emits immediately, force Angular to detect changes
    setTimeout(() => {
      // Sort orders by ID in descending order (most recent first)
      orders.sort((a, b) => b.id_order - a.id_order);

      // Separate pending and past orders
      this.pendingOrders = orders.filter((order) => !order.complete);
      this.pastOrders = orders.filter((order) => order.complete);

      this.loading = false; // Stop loading after orders are processed
    }, 500); // Simulate delay for better UI feedback
  });
}

getLatestStatus(order: any): string {
  if (order.status_list && order.status_list.length > 0) {
    return order.status_list.reduce((latest: any, current: any) => 
      new Date(current.created_at) > new Date(latest.created_at) ? current : latest
    ).customer_message;
  }
  return '';
}

async sendStatusNotification(userId: number, statusMessage: string) {
  const payload = { 
    userId, 
    title: 'Order Update', 
    body: `Your order status: ${statusMessage}` 
  };

  const sessionData = localStorage.getItem('sessionData');
  const token = sessionData ? JSON.parse(sessionData).token : null;

  const headers = {
    Authorization: token,
    'Content-Type': 'application/json'
  };

  try {
    await CapacitorHttp.post({
      url: `${environment.apiUrl}/notifications/send-push`,
      headers,
      data: payload
    });
    console.log('Order status notification sent:', statusMessage);
  } catch (error) {
    console.error('Error sending notification', error);
  }
}

  toggleExpand(index: number, section: 'pending' | 'past'): void {
    const isExpanded = this.expandedOrderIndex[section] === index;
    this.expandedOrderIndex[section] = isExpanded ? null : index;

    const message = isExpanded
      ? `Order ${section} #${index + 1} collapsed.`
      : `Order ${section} #${index + 1} expanded.`;
    this.accessibilityService.announce(message, 'polite');
  }

  reorder(order: any): void {
    order.items.forEach((item: any) => {
      const cartItem: CartItem = {
        id: item.id,
        image: item.image,
        brand: item.brand,
        desc: item.desc,
        price: item.price,
        quantity: item.quantity,
        title: item.title,
        strainType: item.strainType,
        thc: item.thc,
        weight: item.weight,
        category: item.category
      };
      this.cartService.addToCart(cartItem);
    });
    const message = `Order #${order.id_order} items have been added to your cart.`;
    this.accessibilityService.announce(message, 'assertive');
    console.log('Order added to cart:', order);
  }
}
