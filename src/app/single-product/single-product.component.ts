import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
  @ViewChild('topOfPage') topOfPage!: ElementRef<HTMLElement>;
  
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

        this.topOfPage?.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        this.accessibilityService.announce(
          `Now viewing ${product.title} by ${product.brand}.`,
          'polite'
        );
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
    if (d.discount_method === 'PERCENT') return `${d.discount_amount}% off`;
    if (d.discount_method === 'DOLLAR') return `$${d.discount_amount} off`;
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

  viewerOpen = false;

  scale = 1;
  minScale = 1;
  maxScale = 4;

  x = 0;
  y = 0;

  private pointers = new Map<number, { x: number; y: number }>();
  private lastPan?: { x: number; y: number };
  private startDist = 0;
  private startScale = 1;

  get transform() {
    return `translate(${this.x}px, ${this.y}px) scale(${this.scale})`;
  }

  openViewer() {
    this.viewerOpen = true;
    this.resetZoom();
    document.body.style.overflow = 'hidden';
  }

  closeViewer() {
    this.viewerOpen = false;
    document.body.style.overflow = '';
    this.pointers.clear();
    this.lastPan = undefined;
  }

  resetZoom() {
    this.scale = 1;
    this.x = 0;
    this.y = 0;
  }

  zoomIn() {
    this.scale = Math.min(this.maxScale, +(this.scale + 0.25).toFixed(2));
  }

  zoomOut() {
    this.scale = Math.max(this.minScale, +(this.scale - 0.25).toFixed(2));
    if (this.scale === 1) this.resetZoom();
  }

  onWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    const next = this.scale + delta;
    this.scale = Math.min(this.maxScale, Math.max(this.minScale, next));
    if (this.scale === 1) this.resetZoom();
  }

  onDoubleClick(e?: MouseEvent) {
    e?.preventDefault();

    if (this.scale === 1) {
      this.scale = 2;
    } else {
      this.resetZoom();
    }
  }

  onPointerDown(e: PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.pointers.size === 1) {
      this.lastPan = { x: e.clientX, y: e.clientY };
    }

    if (this.pointers.size === 2) {
      const pts = Array.from(this.pointers.values());
      this.startDist = this.distance(pts[0], pts[1]);
      this.startScale = this.scale;
    }
  }

  onPointerMove(e: PointerEvent) {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // pinch zoom
    if (this.pointers.size === 2) {
      const pts = Array.from(this.pointers.values());
      const dist = this.distance(pts[0], pts[1]);
      const ratio = dist / this.startDist;
      this.scale = Math.min(this.maxScale, Math.max(this.minScale, this.startScale * ratio));
      return;
    }

    // pan
    if (this.scale > 1 && this.lastPan) {
      const dx = e.clientX - this.lastPan.x;
      const dy = e.clientY - this.lastPan.y;
      this.x += dx;
      this.y += dy;
      this.lastPan = { x: e.clientX, y: e.clientY };
    }
  }

  onPointerUp(e: PointerEvent) {
    this.pointers.delete(e.pointerId);
    this.lastPan = undefined;
    if (this.pointers.size < 2) this.startDist = 0;
  }

  private distance(a: any, b: any) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  
}
