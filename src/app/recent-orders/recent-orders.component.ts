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
    this.loading = true;

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

    const normalized = orders.map(order => {
      const latestStatus = this.getLatestStatus(order).toLowerCase();
      const complete =
        typeof order.complete === 'boolean'
          ? order.complete
          : latestStatus.includes('complete');

      return { ...order, complete };
    });

    const sorted = [...normalized].sort((a, b) => b.id_order - a.id_order);

    this.pendingOrders = sorted.filter(
      o => !o.complete && o.items?.length > 0
    );


    this.pastOrders = sorted.filter(o => o.complete);
  }

  getLatestStatus(order: any): string {
    if (!order?.status_list?.length) return 'Received';

    const latest = order.status_list.reduce((a: any, b: any) =>
      new Date(a.created_at) > new Date(b.created_at) ? a : b
    );

    return latest.customer_message || 'Received';
  }

  getCurrentStepIndex(order: any): number {
    const status = this.getLatestStatus(order).toLowerCase();

    if (status.includes('prepar')) return 1;
    if (status.includes('ready') || status.includes('complete')) return 2;
    return 0;
  }

  getProgressWidth(order: any): string {
    const index = this.getCurrentStepIndex(order);
    const percent = (index / (this.statusSteps.length - 1)) * 100;
    return `${percent}%`;
  }

  toggleExpand(index: number, section: 'pending' | 'past'): void {
    this.expandedOrderIndex[section] =
      this.expandedOrderIndex[section] === index ? null : index;

    this.accessibilityService.announce(
      `Order ${index + 1} ${
        this.expandedOrderIndex[section] === null ? 'collapsed' : 'expanded'
      }.`,
      'polite'
    );
  }

  reorder(order: any): void {
    order.items.forEach((item: any) => {
      this.cartService.addToCart({ ...item });
    });

    this.accessibilityService.announce(
      `Items from order ${order.id_order} added to cart.`,
      'assertive'
    );
  }

  getOrderDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  getStatusClass(order: any): string {
    const status = this.getLatestStatus(order).toLowerCase();

    if (status.includes('prepar')) return 'status-preparing';
    if (status.includes('ready')) return 'status-ready';
    if (status.includes('complete')) return 'status-complete';
    return 'status-received';
  }

  /* ✅ DERIVED STATE */

  get hasOrders(): boolean {
    return this.pendingOrders.length > 0 || this.pastOrders.length > 0;
  }

  get hasPending(): boolean {
    return this.pendingOrders.length > 0;
  }

  get currentOrder(): any | null {
    return this.pendingOrders.length ? this.pendingOrders[0] : null;
  }

  get pendingList(): any[] {
    return this.pendingOrders;
  }


}
