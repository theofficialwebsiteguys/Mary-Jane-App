import { Component, Input, OnInit } from '@angular/core';
import { CartItem, CartService } from '../cart.service';
import { AccessibilityService } from '../accessibility.service';

@Component({
  selector: 'app-cart-items',
  templateUrl: './cart-items.component.html',
  styleUrls: ['./cart-items.component.scss'],
})
export class CartItemsComponent implements OnInit {

  @Input() items: CartItem[] = []


  constructor(private readonly cartService: CartService, private readonly accessibilityService: AccessibilityService){}

  ngOnInit(): void {
    this.cartService.cart$.subscribe((cart) => {
      this.items = cart;
    });
  }

  updateQuantity(item: CartItem, delta: number): void {
    const newQuantity = item.quantity + delta;

    if (newQuantity < 1) {
      this.accessibilityService.announce(`Removed ${item.title} from your cart.`, 'polite');
    } else {
      this.accessibilityService.announce(`Updated ${item.title} quantity to ${newQuantity}.`, 'polite');
    }

    this.cartService.updateQuantity(item.id, newQuantity);
  }

  calculateSubtotal(): number {
    const subtotal = this.items.reduce(
      (total: any, item: any) => {
        const price = item.sale?.discountedPrice ?? item.price;
        return total + price * item.quantity;
      },
      0
    );
    this.accessibilityService.announce(`Subtotal updated to ${subtotal.toFixed(2)} dollars.`, 'polite');
    return subtotal;
  }

  placeholderFor(category?: string | null): string {
    const key = (category || 'default').toLowerCase();
    // map to your assets; provide a default fallback
    const map: Record<string, string> = {
      flower: 'assets/flower-general.png',
      'pre-roll': 'assets/pre-roll-general.png',
      prerolls: 'assets/pre-roll-general.png',
      edibles: 'assets/edibles-general.png',
      vapes: 'assets/vapes-general.png',
      concentrates: 'assets/concentrates-general.png',
      beverage: 'assets/beverage-general.png',
      tinctures: 'assets/tincture-general.png',
      topicals: 'assets/topicals-general.png',
      accessories: 'assets/accessories-general.png',
      default: 'assets/default.png'
    };
    return map[key] || map['default'];
  }
}
