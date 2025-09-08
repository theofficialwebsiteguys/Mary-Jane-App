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


}
