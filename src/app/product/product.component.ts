import { Component, Input, OnInit } from '@angular/core';

import { ProductsService } from '../products.service';

import { Product } from './product.model';
import { CartItem, CartService } from '../cart.service';
import { AuthService } from '../auth.service';
import { AccessibilityService } from '../accessibility.service';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
})
export class ProductComponent implements OnInit {
  constructor(private productService: ProductsService, private cartService: CartService, private authService: AuthService, private accessibilityService: AccessibilityService) {}

  @Input() product: Product = {
    id: '',
    category: 'Flower',
    title: '',
    brand: '',
    desc: '',
    strainType: 'HYBRID',
    thc: '',
    cbd: '',
    weight: '',
    unit: '',
    quantity: 0,
    price: '',
    priceAfterTax: '',
    image: '',
  };

  quantity = 1;
  isLoggedIn: boolean = false;

  ngOnInit() {
    this.authService.isLoggedIn().subscribe(status => this.isLoggedIn = status);
  }

  ngOnDestroy(){
    this.quantity = 1;
  }

  updateProductDisplay() {
    this.productService.updateCurrentProduct(this.product);
    this.accessibilityService.announce(`Viewing details for ${this.product.title}.`, 'polite');
  }

  adjustQuantity(amount: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const previousQuantity = this.quantity;
    this.quantity = Math.max(1, this.quantity + amount);
    const change = this.quantity > previousQuantity ? 'increased' : 'decreased';
    this.accessibilityService.announce(`Quantity ${change} to ${this.quantity} for ${this.product.title}.`, 'polite');
  }

  addToCart(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const cartItem: CartItem = { ...this.product, quantity: this.quantity };
    this.cartService.addToCart(cartItem);
    // alert('Item added to cart!');
    this.accessibilityService.announce(`${this.product.title} added to your cart.`, 'polite');
  }

  getProductImage(product: any): string {
    if (product.image) {
      return product.image;
    }
    return 'assets/default.png';
  }
}
