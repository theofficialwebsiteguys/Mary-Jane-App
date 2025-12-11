import { Component, ViewChild } from '@angular/core';
import { CartItem, CartService } from '../cart.service';
import { IonContent, LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../auth.service';
import { AccessibilityService } from '../accessibility.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
})
export class CartPage {
  @ViewChild(IonContent) content!: IonContent;

  showCheckout: boolean = false;
  showConfirmation: boolean = false;
  checkoutUrl: string = '';

  cartItems: CartItem[] = [];

  checkoutInfo: any;

  isLoading: boolean = false;

  previewTotals: { subTotal: number; taxTotal: number; discountTotal: number; total: number } | null = null;
  previewLoading = false;
  previewError: string | null = null;

  constructor(
    private readonly cartService: CartService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private authService: AuthService,
    private accessibilityService: AccessibilityService,
    private router: Router
  ) {}

  ngOnInit(): void {
      this.cartService.cart$.subscribe((cart) => {
        this.cartItems = cart;
        this.updateCartPreview();
      });
  }

  private async updateCartPreview() {
    this.previewError = null;
    this.previewTotals = null;

    if (!this.cartItems || this.cartItems.length === 0) {
      return;
    }

    // // Get current user info (where you have treez customer_id stored)
    // const user = this.authService.getCurrentUser?.();
    // const customerId =
    //   user?.treezCustomerId ||
    //   user?.treez_customer_id ||
    //   user?.customerId || // fallback guesses
    //   null;

    // if (!customerId) {
    //   console.warn('No Treez customer_id on user; skipping preview.');
    //   return;
    // }

    this.previewLoading = true;

    try {
      const isDelivery = false; // or derive from user selection
      const response = await this.cartService.checkCartPrice(
        this.cartItems,
        isDelivery
      );

      // Response shape: { success, totals, treez }
      if (response?.success && response.totals) {
        this.previewTotals = response.totals;
        this.accessibilityService.announce(
          `Cart totals updated. Total is ${response.totals.total} dollars.`,
          'polite'
        );
      } else {
        this.previewError = 'Unable to calculate totals from Treez.';
        console.warn('Unexpected cartPrice response:', response);
      }
    } catch (err) {
      console.error('Cart preview error:', err);
      this.previewError = 'Failed to get live totals.';
    } finally {
      this.previewLoading = false;
    }
  }


  async checkout() {
    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Processing Checkout...',
      spinner: 'crescent',
    });
    await loading.present();

    this.checkoutInfo = {
      cart: this.cartItems,
      user_info: this.authService.getCurrentUser(),
      previewTotals: this.previewTotals
    };
    this.showCheckout = true;
    loading.dismiss();
    this.accessibilityService.announce('Checkout process started.', 'polite');
  }

  removeCheckout() {
    this.showCheckout = false;
    this.accessibilityService.announce('Returned to cart.', 'polite');
  }

  async onOrderPlaced() {
    this.resetCart();
    this.showCheckout = false;
    this.scrollToTop();
    this.accessibilityService.announce(
      'Your order was placed successfully.',
      'polite'
    );
    await this.redirectToOrder();
  }

  ionViewDidEnter(): void {
    this.scrollToTop(); // Scroll to top when the page is fully loaded
  }

  scrollToTop() {
    if (this.content) {
      this.content.scrollToTop(300); // Smooth scrolling with animation
    } else {
      console.warn('IonContent is not available.');
    }
  }

  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 5000,
      color: color,
      position: 'bottom',
    });
    await toast.present();
  }

  resetCart() {
    console.log("resetting cart")
    this.cartService.clearCart();
    this.cartItems = [];
    this.checkoutInfo = null;
    this.accessibilityService.announce('Your cart has been cleared.', 'polite');
  }


  private async redirectToOrder() {
    await this.router.navigateByUrl('/orders');
    
    // Force a full page reload after navigation
    setTimeout(async () => {
      await this.presentToast('Your order has been placed successfully!');
    }, 500); // Small delay ensures the navigation completes first
  }

}
