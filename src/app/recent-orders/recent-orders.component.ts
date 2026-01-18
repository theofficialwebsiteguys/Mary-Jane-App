import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { CartService } from '../cart.service';
import { AccessibilityService } from '../accessibility.service';


const MOCK_ORDERS = [
  {
    id_order: 1042,
    complete: false,
    total: 87.45,
    items: [
      {
        id: 1,
        title: 'Blue Dream – 3.5g',
        quantity: 1,
        price: 35,
        image: 'assets/mock/blue-dream.png',
        brand: 'SunGrow',
        strainType: 'Hybrid',
        thc: '21%',
        weight: '3.5g',
        category: 'Flower',
        desc: 'Balanced hybrid'
      },
      {
        id: 2,
        title: 'Sour Diesel Pre-Roll',
        quantity: 2,
        price: 12.5,
        image: 'assets/mock/sour-diesel.png',
        brand: 'GreenCo',
        strainType: 'Sativa',
        thc: '24%',
        weight: '1g',
        category: 'Pre-Roll',
        desc: 'Energetic'
      }
    ],
    status_list: [
      // { customer_message: 'Order complete', created_at: '2025-01-05T16:45:00Z' },
      { customer_message: 'Order ready', created_at: '2025-01-04T19:45:00Z' },
      { customer_message: 'Preparing your order', created_at: '2025-01-04T18:45:00Z' },
      { customer_message: 'Order received', created_at: '2025-01-04T18:30:00Z' }
    ]
  },
  // {
  //   id_order: 1038,
  //   complete: true,
  //   total: 62.10,
  //   items: [
  //     {
  //       id: 3,
  //       title: 'Gummies – 10 pack',
  //       quantity: 1,
  //       price: 25,
  //       image: 'assets/mock/gummies.png',
  //       brand: 'ChewWell',
  //       strainType: 'N/A',
  //       thc: '10mg',
  //       weight: '100mg',
  //       category: 'Edibles',
  //       desc: 'Fruit flavors'
  //     }
  //   ],
  //   status_list: [
  //     { customer_message: 'Order received', created_at: '2024-12-22T15:10:00Z' },
  //     { customer_message: 'Preparing your order', created_at: '2024-12-22T15:30:00Z' },
  //     { customer_message: 'Order ready', created_at: '2024-12-22T16:10:00Z' },
  //     { customer_message: 'Order complete', created_at: '2024-12-22T16:45:00Z' }
  //   ]
  // }
];

@Component({
  selector: 'app-recent-orders',
  templateUrl: './recent-orders.component.html',
  styleUrls: ['./recent-orders.component.scss'],
})
export class RecentOrdersComponent implements OnInit {
  pendingOrders: any[] = [];
  pastOrders: any[] = [];
  loading = true;

  expandedOrderIndex = {
    pending: null as number | null,
    past: null as number | null
  };

  statusSteps = ['Received', 'Preparing', 'Ready'];

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private accessibilityService: AccessibilityService
  ) {}

  ngOnInit(): void {
    this.authService.orders.subscribe((orders: any[]) => {
      this.processOrders(orders || []);
      this.loading = false;
    });
  }

  processOrders(orders: any[]): void {
    if (!orders.length) {
      this.pendingOrders = [];
      this.pastOrders = [];
      return;
    }

    const normalized = orders.map(o => ({
      ...o,
      complete: Boolean(o.complete),
      items: Array.isArray(o.items) ? o.items : [],
      status: o.status || 'Received'
    }));

    const sorted = normalized.sort(
      (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    );

    this.pendingOrders = sorted.filter(o => !o.complete);
    this.pastOrders = sorted.filter(o => o.complete);
  }

  /* ---------------- STATUS ---------------- */

  getLatestStatus(order: any): string {
    if (order.status) return order.status;
    return 'Received';
  }

  getCurrentStepIndex(order: any): number {
    const s = this.getLatestStatus(order).toLowerCase();
    if (s.includes('prepar')) return 1;
    if (s.includes('ready') || s.includes('complete')) return 2;
    return 0;
  }

  getProgressWidth(order: any): string {
    const index = this.getCurrentStepIndex(order);
    return `${(index / (this.statusSteps.length - 1)) * 100}%`;
  }

  getStatusClass(order: any): string {
    const s = this.getLatestStatus(order).toLowerCase();
    if (s.includes('prepar')) return 'status-preparing';
    if (s.includes('ready')) return 'status-ready';
    if (s.includes('complete')) return 'status-complete';
    return 'status-received';
  }

  /* ---------------- UI HELPERS ---------------- */

  toggleExpand(index: number, section: 'pending' | 'past') {
    this.expandedOrderIndex[section] =
      this.expandedOrderIndex[section] === index ? null : index;
  }

  async reorder(order: any) {
    if (!order.items?.length) return;

    for (const item of order.items) {
      const cartItem = {
        id: item.item_id,
        title: item.title,
        brand: item.brand || '',
        category: item.category || 'Other',
        desc: '', 
        strainType: 'N/A', 
        quantity: item.quantity || 1,
        price: String(item.price),
        image: 'assets/stock/default.png',
        thc: '',
        weight: '',
        sale: undefined,
      };

      this.cartService.addToCart(cartItem);
    }

    this.accessibilityService.announce(
      `Items from order ${order.orderId} added to cart.`,
      'assertive'
    );
  }


  getOrderDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  /* ---------------- DERIVED ---------------- */

  get hasOrders(): boolean {
    return this.pendingOrders.length > 0 || this.pastOrders.length > 0;
  }

  get currentOrder(): any | null {
    return this.pendingOrders[0] || null;
  }

  get pendingList(): any[] {
    return this.pendingOrders;
  }

}
