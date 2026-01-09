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
  @Input() index: number = 0;

  @Input() product: Product = {
    id: '',
    category: 'Flower',
    title: '',
    brand: '',
    desc: '',
    strainType: 'HYBRID',
    sale: {
      discountId: 0,
      discountName: '',
      discountValue: 0,
      discountedPrice: 0,
      menuDisplay: undefined
    },
    thc: '',
    thcMG: '',
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
    if (product.gallery.length) {
      return product.gallery[0];
    }
    return this.placeholderFor(product.category);
  }

  placeholderFor(category?: string | null): string {
    const key = (category || 'default').toLowerCase();
    // map to your assets; provide a default fallback
    const map: Record<string, string> = {
      flower: 'assets/stock/flower-general.png',
      'pre-roll': 'assets/stock/pre-roll-general.png',
      prerolls: 'assets/stock/pre-roll-general.png',
      edibles: 'assets/stock/edibles-general.png',
      vapes: 'assets/stock/vapes-general.png',
      concentrates: 'assets/stock/concentrates-general.png',
      beverage: 'assets/stock/beverage-general.png',
      tinctures: 'assets/stock/tincture-general.png',
      topicals: 'assets/stock/topicals-general.png',
      accessories: 'assets/stock/accessories-general.png',
      default: 'assets/stock/default.png'
    };
    return map[key] || map['default'];
  }

}

