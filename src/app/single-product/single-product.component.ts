import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

import { ProductsService } from '../products.service';

import { Product } from '../product/product.model';
import { CartService } from '../cart.service';
import { AuthService } from '../auth.service';
import { AccessibilityService } from '../accessibility.service';
import { ProductCategory } from '../product-category/product-category.model';

@Component({
  selector: 'app-single-product',
  templateUrl: './single-product.component.html',
  styleUrls: ['./single-product.component.scss'],
})
export class SingleProductComponent implements OnInit {
  currentProduct: Product = {
    id: '',
    category: 'Flower' as ProductCategory,
    title: '',
    desc: '',
    brand: '',
    strainType: 'HYBRID',
    thc: '',
    thcMG: '',
    cbd: '',
    weight: '',
    price: '',
    image: '',
    quantity: 0,
    unit: '',

    sale: {
      discountId: 0,
      discountName: '',
      discountValue: 0,
      discountedPrice: 0,
      menuDisplay: undefined
    },

    // Added Treez-compatible fields
    description: '',
    subtype: '',
    uom: '',
    gallery: [],
    attributes: {
      general: [],
      flavors: [],
      effects: []
    },
    effects: [],
    flavors: [],
    discounts: [],
    active: true,
    aboveThreshold: false,
    updatedAt: ''
  };


  showFullDescription = false;
  quantity = 1; 

  isLoggedIn: boolean = false;

  constructor(
    private productService: ProductsService,
    private cartService: CartService,
    private authService: AuthService,
    private location: Location,
    private router: Router,
    private toastController: ToastController,
    private accessibilityService: AccessibilityService
  ) {}

  ngOnInit() {
    this.productService.currentProduct$.subscribe((product) => {
      if (product) {
        this.currentProduct = product;
        this.quantity = 1; 
        this.accessibilityService.announce(`Now viewing ${product.title} by ${product.brand}.`, 'polite');
      } else {
        this.router.navigateByUrl('/home');
      }
    });

    this.authService.isLoggedIn().subscribe(status => {
      this.isLoggedIn = status;
    });
  }

  ngOnDestroy(){
    this.quantity = 1;
  }

  toggleDescription() {
    this.showFullDescription = !this.showFullDescription;
    const message = this.showFullDescription ? 'Full description shown.' : 'Description collapsed.';
    this.accessibilityService.announce(message, 'polite');
  }

  getDescription(): string {
    const raw =
      this.currentProduct.description ||
      this.currentProduct.desc ||
      '';

    if (!raw) return '';

    return this.showFullDescription || raw.length <= 150
      ? raw
      : raw.substring(0, 150) + '...';
  }

  currentImageIndex = 0;

  get primaryImage(): string {
    const gallery = this.currentProduct.gallery || [];
    if (gallery.length) return gallery[this.currentImageIndex];
    if (this.currentProduct.image) return this.currentProduct.image;
    return this.placeholderFor(this.currentProduct.category);
  }

  selectImage(i: number) {
    this.currentImageIndex = i;
  }

  formatDiscountAmount(d: any): string {
    if (!d) return '';
    if (d.method === 'PERCENT') return `${d.amount}% off`;
    if (d.method === 'DOLLAR') return `$${d.amount} off`;
    return `${d.amount}`;
  }

  getDiscountConditionsSummary(d: any): string {
    if (!d?.conditions?.length) return '';
    return d.conditions.map((c: any) => `${c.type}: ${c.value}`).join(' • ');
  }

  getStockLabel(): string | null {
    const qty = this.currentProduct.quantity;
    if (qty <= 0) return 'Out of stock';
    if (qty <= 10) return `Low stock – only ${qty} left`;
    return 'In stock';
  }



  goBack() {
    this.location.back();
    this.accessibilityService.announce('Returned to the previous page.', 'polite');
  }

  incrementQuantity() {
    if (this.quantity < this.currentProduct['quantity'] ) {
      this.quantity++;
      this.accessibilityService.announce(`Quantity increased to ${this.quantity}.`, 'polite');
    }
  }

  decrementQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
      this.accessibilityService.announce(`Quantity decreased to ${this.quantity}.`, 'polite');
    }
  }

  async addToCart() {
    const cartItem = {
      ...this.currentProduct,
      quantity: this.quantity,
    };
  
   this.cartService.addToCart(cartItem); 
    this.accessibilityService.announce(`${this.currentProduct.title} added to cart. Quantity: ${this.quantity}.`, 'assertive');
    // alert('Item added to cart!');
  }
  
  getProductImage(product: any): string {
    if (product.image) {
      return product.image;
    }
    return this.placeholderFor(product.category);
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

  // shouldShowThc(product: any): boolean {
  //   const thc = Number(product.thc || 0);
  //   const thcMG = Number(product.thcMG || 0);

  //   return thc > 0 || thcMG > 0;
  // }
  
}
