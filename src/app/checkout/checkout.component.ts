import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnInit, Output, ViewChild } from '@angular/core';
import { AppliedDiscount, CartService } from '../cart.service';
import { LoadingController, ToastController } from '@ionic/angular';
import { AccessibilityService } from '../accessibility.service';
import { AuthService } from '../auth.service';
import { SettingsService } from '../settings.service';
import { FcmService } from '../fcm.service';
import { AeropayService } from '../aeropay.service';
import { openWidget } from 'aerosync-web-sdk';
import { environment } from 'src/environments/environment';
import { take } from 'rxjs';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit {
  @Input() checkoutInfo: any;

  @Output() back = new EventEmitter<void>();
  @Output() orderPlaced = new EventEmitter<void>();

  @ViewChild('streetInput') streetInput!: ElementRef<HTMLInputElement>;

  private addressAutocomplete?: google.maps.places.Autocomplete;
  private placesLoaded = false;

  // DELIVERY
  deliveryAddress = {
    street: '',
    apt: '',
    city: '',
    zip: '',
    state: 'NY'
  };

  deliveryAddressValid = false;
  selectedOrderType: string = 'pickup';
  selectedDeliveryDate: string | null = null;
  selectedDeliveryTime: string = '';
  enableDelivery = false;
  minDate: string = '';

  // TIME SELECTION
  timeOptions: { value: string; display: string }[] = [];
  deliverySchedule: any[] = [];
  validDeliveryDates: string[] = [];

  // DISCOUNTS
  pointsToRedeem = 0;
  pointValue = 0.05;
  premiumDiscountRate = 0.10;
  employeeDiscountRate = 0.15;
  premiumDiscountApplied = false;
  premiumDiscountAmount = 0;
  employeeDiscountApplied = false;
  employeeDiscountAmount = 0;

  // COUPONS
  couponCode = '';
  couponMessage = '';
  isApplyingCoupon = false;
  validCoupons: any = {};

  // TOTALS BASED ON TREEZ PREVIEW
  finalSubtotal = 0;
  finalTax = 0;
  finalTotal = 0;
  finalTotalWithoutTip = 0;
  originalTreezSubtotal = 0;
  originalTreezTax = 0;

  isLoading = false;

  discountTotal = 0;

  // --- AEROPAY ---
  selectedPaymentMethod: string = 'cash';
  aeropayUserId: string | null = null;
  verificationRequired: boolean = false;
  verificationCode: string = '';
  existingUserId: string = '';
  isFetchingAeroPay = false;

  userBankAccounts: any[] = [];
  showBankSelection: boolean = false;
  selectedBankId: string | null = null;

  aerosyncURL: string | null = null;
  aerosyncToken: string | null = null;
  aerosyncUsername: string | null = null;
  loadingAerosync = false;

  showAeropay = true; // optional depending on business rules

  appliedDiscount: AppliedDiscount | null = null;
  availableRewards: AppliedDiscount[] = [];

  selectedRewardId: string | null = null;

  twilioVerificationStep: 'idle' | 'sending' | 'code' | 'verifying' | 'verified' = 'idle';
  twilioVerificationCode = '';
  twilioVerificationError = '';
  twilioVerified = false;
  pendingAeroPayUser: any = null;
  deliveryMin: any;

  tipPercentOptions = [
    { label: '10%', value: 0.10 },
    { label: '15%', value: 0.15 },
    { label: '20%', value: 0.20 }
  ];

  // --- TIP ---
  selectedTipPercent: number | null = null;

  // custom dollar tip
  isCustomTip = false;
  customTipAmountInput = ''; // string for typing
  customTipAmount = 0;       // number used for math

  constructor(
    private cartService: CartService,
    private loadingController: LoadingController,
    private accessibilityService: AccessibilityService,
    private toastController: ToastController,
    private authService: AuthService,
    private settingsService: SettingsService,
    private fcmService: FcmService,
    private aeropayService: AeropayService,
    private ngZone: NgZone
  ) {}

  async ngOnInit() {
    // 1) init from Treez first
    const t = this.checkoutInfo?.previewTotals;
    if (t) {
      this.originalTreezSubtotal = Number(t.subTotal) || 0;
      this.originalTreezTax = Number(t.taxTotal) || 0;

      this.finalSubtotal = this.originalTreezSubtotal;
      this.finalTax = this.originalTreezTax;
      this.finalTotal = Number(t.total) || (this.finalSubtotal + this.finalTax);
      this.discountTotal = Number(t.discountTotal) || 0;

      this.updateTotals(); // ✅ now it has real base values
    }

    // 2) now subscribe
    this.cartService.appliedDiscount$.subscribe(discount => {
      this.appliedDiscount = discount;

      if (discount) {
        this.selectedRewardId = discount.id;
      } else {
        this.selectedRewardId = null;
        this.loadAvailableDiscounts();
      }

      this.updateTotals(); // ✅ safe now
    });

    await this.loadAvailableDiscounts();
    this.loadDeliverySchedule();

    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }


  // async ngOnInit() {
  //   this.cartService.appliedDiscount$.subscribe(discount => {
  //     this.appliedDiscount = discount;

  //     if (discount) {
  //       this.selectedRewardId = discount.id;
  //     } else {
  //       this.selectedRewardId = null;
  //       this.loadAvailableDiscounts();
  //     }


  //     this.updateTotals();
  //   });

  //   await this.loadAvailableDiscounts();
  //   // ------------------------------
  //   // USE TREEZ PREVIEW TOTALS ONLY
  //   // ------------------------------
  //   const t = this.checkoutInfo.previewTotals;
  //   console.log(this.checkoutInfo)
  //   this.originalTreezSubtotal = t.subTotal;
  //   this.originalTreezTax = t.taxTotal;

  //   // Live values
  //   this.finalSubtotal = t.subTotal;
  //   this.finalTax = t.taxTotal;
  //   this.finalTotal = t.total;
  //   this.discountTotal = t.discountTotal;

  //   // Compute available delivery schedule + dates
  //   this.loadDeliverySchedule();

  //   // Set next day as minimum date
  //   const today = new Date();
  //   today.setDate(today.getDate());
  //   this.minDate = today.toISOString().split('T')[0];

  //   //  this.cartService.appliedDiscount$.subscribe(d => {
  //   //   this.appliedDiscount = d;
  //   //   this.updateTotals();
  //   // });
  // }

 private initAddressAutocomplete() {
    const googleMaps = (window as any).google?.maps?.places;
    const inputEl = this.streetInput?.nativeElement;

    if (!googleMaps || !inputEl) {
      console.warn('Autocomplete not ready yet');
      return;
    }

    // Prevent double-init
    if (this.addressAutocomplete) return;

    this.addressAutocomplete = new google.maps.places.Autocomplete(inputEl, {
      types: ['address'],
      componentRestrictions: { country: 'us' },
      fields: ['address_components', 'formatted_address']
    });

    this.addressAutocomplete.addListener('place_changed', () => {
      const place = this.addressAutocomplete!.getPlace();
      if (!place.address_components) return;

      const parts = this.parseAddressComponents(place.address_components);

      this.ngZone.run(() => {
        const street = [parts.streetNumber, parts.route]
          .filter(Boolean)
          .join(' ')
          .trim();

        this.deliveryAddress.street =
          street || place.formatted_address || this.deliveryAddress.street;

        this.deliveryAddress.city = parts.locality || this.deliveryAddress.city;
        this.deliveryAddress.state = parts.stateShort || 'NY';
        this.deliveryAddress.zip = parts.postalCode || this.deliveryAddress.zip;

        this.onAddressInputChange();
      });
    });
  }


  private parseAddressComponents(components: google.maps.GeocoderAddressComponent[]) {
    const out: any = {};

    for (const c of components) {
      const t = c.types;

      if (t.includes('street_number')) out.streetNumber = c.long_name;
      if (t.includes('route')) out.route = c.long_name;

      // City can come from different fields depending on address
      if (t.includes('locality')) out.locality = c.long_name;
      if (!out.locality && t.includes('sublocality')) out.locality = c.long_name;
      if (!out.locality && t.includes('postal_town')) out.locality = c.long_name;

      if (t.includes('administrative_area_level_1')) {
        out.stateLong = c.long_name;
        out.stateShort = c.short_name;
      }

      if (t.includes('postal_code')) out.postalCode = c.long_name;
    }

    return out;
  }


   private async loadAvailableDiscounts() {
    try {
      // Live AIQ wallet — already filtered to only rewards this specific
      // customer can redeem right now (real points, no stale local cache),
      // matching what the backend re-checks at redemption time.
      const { rewards } = await this.settingsService.getWalletRewards();

      this.availableRewards = (rewards || [])
        .filter(d =>
          d.tierDiscount === true &&
          d.pointsDeduction > 0 &&
          (d.dollarValue > 0 || d.percentageValue > 0)
        )
        .map(d => ({
          id: d.id,
          name: d.name,
          dollarValue: d.dollarValue || 0,
          percentageValue: d.percentageValue || 0,
          pointsDeduction: d.pointsDeduction,
          reusable: d.reusable,
          posDiscountID: d.posDiscountID
        })).sort((a: any, b: any) => a.pointsDeduction - b.pointsDeduction);

    } catch (err) {
      console.error('Failed to load discounts', err);
      this.availableRewards = [];
    }
  }

  getRewardPoints(reward: any): number {
    return reward?.pointsDeduction ?? 0;
  }

  applyReward(reward: AppliedDiscount) {
    this.selectedRewardId = reward.id;
    this.cartService.setDiscount(reward);
  }
  // --------------------------------------------------------------------------
  // DELIVERY SCHEDULE + VALIDATION
  // --------------------------------------------------------------------------

  async loadDeliverySchedule() {
    try {
      const res: any = await this.settingsService.getDeliveryZone();
      if (res.schedule) {
        this.deliverySchedule = res.schedule;
        if (res.deliveryMin !== null && res.deliveryMin !== undefined) {
          this.deliveryMin = res.deliveryMin;
        }

        this.validDeliveryDates = this.getAvailableDeliveryDates(res.schedule);

        if (this.validDeliveryDates.length) {
          this.selectedDeliveryDate = this.validDeliveryDates[0];

          const d = new Date(this.selectedDeliveryDate);
          this.generateTimeOptionsForDay(d.getDay());
        }
      }
    } catch (err) {
      console.error('Failed to load delivery schedule', err);
    }

    // Delivery eligibility
    this.settingsService.checkDeliveryEligibility().subscribe({
      next: (r) => (this.enableDelivery = r.deliveryAvailable),
      error: () => (this.enableDelivery = false)
    });
  }

  getAvailableDeliveryDates(schedule: any[]): string[] {
    const valid: string[] = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

      if (schedule.some((s) => s.day === dayName)) {
        valid.push(date.toISOString().split('T')[0]);
      }
    }
    return valid;
  }

  isDateValid = (dateIsoString: string) =>
    this.validDeliveryDates.includes(dateIsoString.split('T')[0]);

  onDateSelected(event: any) {
    const iso = event.detail.value;
    if (!iso) return;

    this.selectedDeliveryDate = iso.split('T')[0];
    const d = new Date(this.selectedDeliveryDate || '');
    this.generateTimeOptionsForDay(d.getDay());
  }

  generateTimeOptionsForDay(dayOfWeek: number) {
    const name = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dayOfWeek];
    const schedule = this.deliverySchedule.find((d) => d.day === name);

    if (!schedule) return;

    const [sH, sM] = schedule.startTime.split(':').map(Number);
    const [eH, eM] = schedule.endTime.split(':').map(Number);

    const opts = [];
    for (let h = sH; h <= eH; h++) {
      for (let m of [0,30]) {
        if (h === eH && m >= eM) continue;

        const displayH = h % 12 === 0 ? 12 : h % 12;
        const ampm = h < 12 ? 'AM' : 'PM';
        const HH = h < 10 ? `0${h}` : `${h}`;
        const MM = m === 0 ? '00' : '30';

        opts.push({
          value: `${HH}:${MM}`,
          display: `${displayH}:${MM} ${ampm}`
        });
      }
    }

    this.timeOptions = opts;
  }

  get meetsDeliveryMinimum(): boolean {
    if (!this.deliveryMin) return true;
    return this.finalSubtotal >= this.deliveryMin;
  }


  async onAddressInputChange() {
    const { street, city, zip } = this.deliveryAddress;

    if (!street.trim() || !city.trim() || zip.trim().length < 5) {
      this.deliveryAddressValid = false;
      return;
    }

    try {
      const full = `${street}, ${city}, NY ${zip}`;
      const res = await this.settingsService.checkAddressInZone(this.checkoutInfo.business_id, full);

      this.deliveryAddressValid = res.inZone;
      if (!res.inZone) this.presentToast('Outside delivery zone.');
    } catch (e) {
      console.error(e);
      this.presentToast('Unable to validate address.');
      this.deliveryAddressValid = false;
    }
  }

  onOrderTypeChange(event: any) {
    this.selectedOrderType = event;

    if (this.selectedOrderType === 'pickup') {
      // 🧹 cleanup when DOM is destroyed
      this.addressAutocomplete = undefined;
      return;
    }

    if (this.selectedOrderType === 'delivery') {
      this.selectedPaymentMethod = 'aeropay';

      this.ngZone.onStable.pipe(take(1)).subscribe(() => {
        this.initAddressAutocomplete();
      });

      this.startAeroPayProcess();
    }
  }

  
  onPaymentMethodChange(method: string) {
    this.selectedPaymentMethod = method;

    if (method === 'aeropay') {
      this.startAeroPayProcess();
    } else {
      this.showBankSelection = false;
    }
  }


  // --------------------------------------------------------------------------
  // TREEZ TOTAL ADJUSTMENTS (POINTS / COUPON / PREMIUM / EMPLOYEE)
  // --------------------------------------------------------------------------

  get maxRedeemablePoints(): number {
    return Math.min(
      this.checkoutInfo.user_info.points,
      Math.ceil(this.originalTreezSubtotal * 20)
    );
  }

  private get treezEffectiveTaxRate(): number {
    if (!this.originalTreezSubtotal || this.originalTreezSubtotal <= 0) {
      return 0;
    }
    return this.originalTreezTax / this.originalTreezSubtotal;
  }

  updateTotals() {
    let subtotal = this.originalTreezSubtotal;

    const pointsDiscount = this.pointsToRedeem * this.pointValue;
    subtotal = Math.max(0, subtotal - pointsDiscount);

    if (this.appliedDiscount?.dollarValue) {
      this.discountTotal = this.appliedDiscount.dollarValue;
      subtotal = Math.max(0, subtotal - this.appliedDiscount.dollarValue);
    } else if (this.appliedDiscount?.percentageValue) {
      this.discountTotal = subtotal * (this.appliedDiscount.percentageValue / 100);
      subtotal = Math.max(0, subtotal * (1 - this.appliedDiscount.percentageValue / 100));
    } else {
      this.discountTotal = Number(this.checkoutInfo?.previewTotals?.discountTotal) || 0;
    }

    this.finalSubtotal = Math.max(0, subtotal);

    const taxRate = this.treezEffectiveTaxRate;
    this.finalTax = +(this.finalSubtotal * taxRate).toFixed(2);

    this.finalTotalWithoutTip = +(this.finalSubtotal + this.finalTax).toFixed(2);

    const tip = this.tipAmount || 0;
    this.finalTotal = +(this.finalTotalWithoutTip + tip).toFixed(2);
  }


  applyCoupon() {
    if (!this.couponCode.trim()) {
      this.couponMessage = "Enter a code.";
      return;
    }

    const code = this.couponCode.trim().toUpperCase();
    const discountRate = this.validCoupons[code];

    if (!discountRate) {
      this.couponMessage = "Invalid code.";
      return;
    }

    // Coupon applies as a percent off subtotal
    const discount = this.finalSubtotal * discountRate;
    this.finalSubtotal -= discount;

    const taxRatio = this.originalTreezTax / this.originalTreezSubtotal;
    this.finalTax = this.finalSubtotal * taxRatio;
    this.finalTotal = this.finalSubtotal + this.finalTax;

    this.couponMessage = `Coupon applied! -${discount.toFixed(2)}`;
  }

  // --------------------------------------------------------------------------
  // PLACE ORDER (TREEZ ONLY)
  // --------------------------------------------------------------------------

  async placeOrder() {
    this.isLoading = true;
    const loading = await this.loadingController.create({
      spinner: 'crescent',
      message: 'Processing your order...',
    });
    await loading.present();

    try {
      const user_id = this.checkoutInfo.user_info.id;
      let points_add = 0;
      let pos_order_id = 0;
      let aeropay_transaction_id: string | null = null;

      // ----------------------------------------------------
      // 1️⃣ Build delivery address for backend + Treez
      // ----------------------------------------------------
      const deliveryAddress =
        this.selectedOrderType === 'delivery'
          ? {
              address1: this.deliveryAddress.street.trim(),
              address2: this.deliveryAddress.apt?.trim() || null,
              city: this.deliveryAddress.city.trim(),
              state: this.deliveryAddress.state,
              zip: this.deliveryAddress.zip.trim(),
              delivery_date: this.selectedDeliveryDate,
              delivery_eta_start: this.selectedDeliveryTime
            }
          : null;

      // ----------------------------------------------------
      // 2️⃣ Treez order payload
      // ----------------------------------------------------
     const appliedDiscount = this.cartService.getAppliedDiscount();

      // --- AEROPAY PAYMENT ---
      if (this.selectedPaymentMethod === "aeropay" && this.selectedBankId) {
        try {
          await this.aeropayService.fetchUsedForMerchantToken(this.aeropayUserId).toPromise();
          const tip = this.tipAmount;

          console.log( this.finalTotalWithoutTip.toFixed(2))
          const tx = await this.aeropayService.createTransaction(
            this.finalTotalWithoutTip.toFixed(2),
            this.selectedBankId,
            tip
          ).toPromise();

          if (!tx?.data?.success) {
            const msg =
              tx?.data?.error ||
              tx?.data?.message ||
              'Payment failed. Please try again.';
            await this.presentToast("Payment failed - " + msg);
            this.isLoading = false;
            return;
          }

          aeropay_transaction_id = tx.data.transaction.id;

          this.presentToast("Payment successful!", "success");

        } catch (err) {
          console.error(err);
           await this.presentToast("Payment error - " + this.getErrMsg(err));
          this.isLoading = false;
          return;
        }
      }


      const treezPayload = {
        type: this.selectedOrderType === 'pickup' ? 'PICKUP' : 'DELIVERY',
        order_source: 'ECOMMERCE',
        order_status: 'AWAITING_PROCESSING',
        delivery_address: deliveryAddress,
        customer_id: this.checkoutInfo.user_info.pos_customer_id,

        items: this.checkoutInfo.cart.map((i: any) => ({
          size_id: i.id,
          quantity: i.quantity,
          apply_automatic_discounts: true
        })),

        discounts: appliedDiscount
          ? [{ discountId: appliedDiscount.posDiscountID }]
          : [],

        payments: aeropay_transaction_id
          ? [
              {
                type: 'AEROPAY',
                reference_id: aeropay_transaction_id
              }
            ]
          : []
      };


      // ----------------------------------------------------
      // 3️⃣ Submit to TREEZ
      // ----------------------------------------------------
      const treezRes = await this.cartService.submitTreezOrder(treezPayload);
      console.log('TREEZ ORDER SUCCESS:', treezRes);

      pos_order_id = treezRes.order_number || 0;
      points_add = this.finalSubtotal;

      // AlpineIQ + Treez are natively synced: AIQ performs the actual point
      // deduction when this discount posts to Treez, and auto-awards points
      // when an AIQ loyalty customer purchases. submitTreezOrder only verified
      // eligibility against AIQ's live balance before attaching the discount —
      // this app never adjusts the points balance itself. redeemed_points here
      // is just the confirmed amount to record in the local order history.
      const confirmedPointsRedeemed = treezRes.redeemed_points ?? 0;

      // ----------------------------------------------------
      // 4️⃣ Save to LOCAL DATABASE (THIS WAS MISSING)
      // ----------------------------------------------------
      // The Treez sale has already gone through at this point — a failure here
      // means the local order-history record is at risk, not the sale itself,
      // so retry transient failures rather than let a dropped connection leave
      // a real sale with no local record.
      await this.placeOrderWithRetry({
        user_id,
        pos_order_id,
        points_add: confirmedPointsRedeemed ? 0 : points_add,
        points_redeem: confirmedPointsRedeemed,
        amount: this.finalSubtotal,
        cart: this.checkoutInfo.cart,

        // NEW ➜ customer fields
        customer_name: `${this.checkoutInfo.user_info.fname} ${this.checkoutInfo.user_info.lname}`,
        customer_email: this.checkoutInfo.user_info.email,
        customer_phone: this.checkoutInfo.user_info.phone,
        customer_dob: this.checkoutInfo.user_info.dob,

        // NEW ➜ order meta fields
        order_type: this.selectedOrderType
      });

      const msg =
        this.selectedOrderType === 'delivery'
          ? 'Your delivery order has been placed!'
          : 'Your pickup order has been placed!';

      await this.fcmService.sendPushNotification(
        user_id,
        'Order Confirmed',
        msg
      );

      // Refresh the cached points balance immediately — otherwise the UI
      // keeps showing the pre-redemption balance until the next login/session
      // validation, letting a user attempt to "redeem" again in the same
      // session. A plain re-read is correct here (not validateSession(), which
      // would log the user out on a transient network error right after a
      // successful order) because submitTreezOrder now decrements User.points
      // atomically as part of the redemption itself, so the local row is
      // already up to date by the time this fires.
      this.authService.updateUserData();

      this.orderPlaced.emit();
      this.accessibilityService.announce('Your order has been placed successfully.');

    } catch (err) {
      console.error('Order Error:', err);
      this.presentToast('Error placing order. ' + err);
    } finally {
      this.isLoading = false;
      loading.dismiss();
    }
  }

  // Called only after the Treez sale has already succeeded — a failure here
  // puts the local order-history record at risk, not the sale itself, so this
  // retries transient failures and never reports an "order failed" message
  // (the customer was already charged/served by the time this runs).
  private async placeOrderWithRetry(payload: any, attempts = 3): Promise<void> {
    for (let i = 0; i < attempts; i++) {
      try {
        await this.cartService.placeOrder(payload);
        return;
      } catch (err) {
        console.error(`placeOrder attempt ${i + 1}/${attempts} failed:`, err);
        if (i === attempts - 1) {
          this.presentToast(
            'Your order was placed! It may take a moment to appear in your order history.',
            'warning'
          );
          return;
        }
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
      }
    }
  }

  async presentToast(message: string, color: string = 'danger') {
    const t = await this.toastController.create({
      message, duration: 5000, color, position: 'bottom'
    });
    t.present();
  }

  async presentVerifyToast(message: string, color: string = 'danger') {
    const t = await this.toastController.create({
      message, duration: 15000, color, position: 'bottom'
    });
    t.present();
  }

  goBack() {
    this.back.emit();
  }

  placeholderFor(category?: string | null): string {
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
    return map[(category || '').toLowerCase()] || map['default'];
  }

  
  //Aeropay
  // async startAeroPayProcess() {
  //   this.isFetchingAeroPay = true;

  //   this.aeropayService.fetchMerchantToken().subscribe({
  //     next: (res: any) => {
  //       if (!res?.data?.token) {
  //         this.presentToast("AeroPay authentication failed.");
  //         this.isFetchingAeroPay = false;
  //         return;
  //       }
  //       this.createAeroPayUser();

  //     },
  //     error: () => {
  //       this.presentToast("AeroPay auth error.");
  //       this.isFetchingAeroPay = false;
  //     }
  //   });
  // }

  async startAeroPayProcess() {
    this.isFetchingAeroPay = true;

    this.aeropayService.fetchMerchantToken().subscribe({
      next: (res: any) => {
        if (!res?.data?.token) {
          this.presentToast("AeroPay authentication failed.");
          this.isFetchingAeroPay = false;
          return;
        }

        // ✅ Always attempt Aeropay user creation first
        this.createAeroPayUser();
      },
      error: () => {
        this.presentToast("AeroPay auth error.");
        this.isFetchingAeroPay = false;
      }
    });
  }

  async createAeroPayUser() {
    const payload = {
      first_name: this.checkoutInfo.user_info.fname,
      last_name: this.checkoutInfo.user_info.lname,
      phone_number: this.checkoutInfo.user_info.phone,
      email: this.checkoutInfo.user_info.email
    };

    this.aeropayService.createUser(payload).subscribe({
      next: (res: any) => {
        this.isFetchingAeroPay = false;

        // Existing user → needs verification
        if (res?.data?.displayMessage) {
          this.verificationRequired = true;
          this.existingUserId = res.data.existingUser.userId;
          this.presentVerifyToast(res.data.displayMessage, 'warning');
          return;
        }

        // New or verified user
        this.aeropayUserId = res.data.user.userId;
        this.userBankAccounts = res.data.user.bankAccounts || [];

        if (this.userBankAccounts.length > 0) {
          this.showBankSelection = true;
          this.selectedBankId = this.userBankAccounts[0].bankAccountId;
        } else {
          // 🆕 NEW USER → require Twilio FIRST (only once)
          if (!this.twilioVerified) {
            this.pendingAeroPayUser = res.data.user; // stash response
            this.startPhoneVerification();
            return;
          }
          // this.retrieveAerosyncCredentials();
        }
      },
      error: () => {
        this.presentToast("AeroPay user creation failed.");
        this.isFetchingAeroPay = false;
      }
    });
  }

  async startPhoneVerification() {
    this.twilioVerificationError = '';
    this.twilioVerificationStep = 'sending';

    try {
      await this.settingsService.sendVerify(this.checkoutInfo.user_info.phone);
      this.twilioVerificationStep = 'code';
    } catch (e) {
      console.error(e);
      this.twilioVerificationError = 'Unable to send code. Please try again.';
      this.twilioVerificationStep = 'idle';
      this.presentToast('Unable to send verification code.');
    }
  }

  async confirmVerification() {
    this.twilioVerificationError = '';
    this.twilioVerificationStep = 'verifying';

    try {
      const result = await this.settingsService.checkVerify(
        this.checkoutInfo.user_info.phone,
        this.twilioVerificationCode // ✅ correct field
      );

      if (!result?.verified) {
        this.twilioVerificationError = 'Invalid code. Try again.';
        this.twilioVerificationStep = 'code';
        return;
      }

      this.twilioVerified = true;
      this.twilioVerificationStep = 'verified';

      // ✅ Resume Aeropay onboarding using the saved user payload
      this.aeropayUserId = this.pendingAeroPayUser?.userId || null;
      this.userBankAccounts = this.pendingAeroPayUser?.bankAccounts || [];
      this.pendingAeroPayUser = null;

      if (this.userBankAccounts.length > 0) {
        this.showBankSelection = true;
        this.selectedBankId = this.userBankAccounts[0].bankAccountId;
      } else {
        this.retrieveAerosyncCredentials();
      }

    } catch (e) {
      console.error(e);
      this.twilioVerificationError = 'Verification failed. Try again.';
      this.twilioVerificationStep = 'code';
    }
  }


  verifyAeroPayUser() {
    this.aeropayService.verifyUser(this.existingUserId, this.verificationCode)
    .subscribe({
      next: () => {
        this.verificationRequired = false;
        this.presentToast("Verification successful!", "success");
        this.createAeroPayUser(); // resume onboarding
      },
      error: () => this.presentToast("Invalid verification code.")
    });
  }


  retrieveAerosyncCredentials() {
    this.loadingAerosync = true;

    this.aeropayService.fetchUsedForMerchantToken(this.aeropayUserId)
    .subscribe({
      next: () => {
        this.aeropayService.getAerosyncCredentials().subscribe({
          next: (res: any) => {
            this.aerosyncToken = res.data.token;
            this.aerosyncURL = res.data.fastlinkURL;
            this.aerosyncUsername = res.data.username;
            this.openAerosyncWidget();
          },
          error: () => this.presentToast("Error getting AeroSync."),
          complete: () => (this.loadingAerosync = false)
        });
      },
      error: () => {
        this.presentToast("AeroPay auth failed.");
        this.loadingAerosync = false;
      }
    });
  }

  openAerosyncWidget() {
    if (!this.aerosyncToken) {
      console.error("Missing AeroSync token");
      return;
    }

    const widget = openWidget({
      id: "widget",
      token: this.aerosyncToken,
      iframeTitle: "Connect",
      environment: "production",
      consumerId: environment.aeropay_consumerId || '',

      onLoad: () => {
        console.log("AeroSync widget loaded");
      },

      onSuccess: (ev: any) => {
        console.log("AeroSync success:", ev);

        if (ev.user_id && ev.user_password) {
          this.linkBankToAeropay(ev.user_id, ev.user_password);
        } else {
          console.error("Missing AeroSync credentials in event", ev);
        }
      },

      onError: (err: any) => {
        console.error("AeroSync widget error:", err);
        this.presentToast("AeroPay connection error.");
      },

      onClose: () => {
        console.log("AeroSync widget closed");
      },

      onEvent: (evt: any, type: string) => {
        console.log("AeroSync event:", type, evt);
      }
    });

    widget.launch();
  }


  linkBankToAeropay(userId: string, pass: string) {
    this.aeropayService.linkBankAccount(userId, pass).subscribe({
      next: (res: any) => {
        if (res.data.success) {
          this.presentToast("Bank linked!", "success");
          this.createAeroPayUser(); // refresh user + banks
        } else {
          this.presentToast("Bank link failed.");
        }
      },
      error: () => this.presentToast("Bank link error.")
    });
  }

  selectBank(bankId: string) {
    this.selectedBankId = bankId;
  }


  removeDiscount() {
    this.cartService.setDiscount(null);
  }

  get appliedRewardAmount(): number {
    if (!this.appliedDiscount) return 0;
    if (this.appliedDiscount.dollarValue) return this.appliedDiscount.dollarValue;
    if (this.appliedDiscount.percentageValue) {
      return this.originalTreezSubtotal * (this.appliedDiscount.percentageValue / 100);
    }
    return 0;
  }

  get deliveryAvailabilityText(): string | null {
    if (!this.enableDelivery || !this.deliverySchedule?.length) return null;

    // If a date is selected, show that day's hours
    if (this.selectedDeliveryDate) {
      const d = new Date(this.selectedDeliveryDate);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });

      const daySchedule = this.deliverySchedule.find(s => s.day === dayName);
      if (!daySchedule) return null;

      return `Delivery is available from ${this.formatTime(daySchedule.startTime)} – ${this.formatTime(daySchedule.endTime)}`;
    }

    // Otherwise show general availability range
    const starts = this.deliverySchedule.map(s => s.startTime);
    const ends = this.deliverySchedule.map(s => s.endTime);

    const earliest = starts.sort()[0];
    const latest = ends.sort().slice(-1)[0];

    return `Delivery is available from ${this.formatTime(earliest)} – ${this.formatTime(latest)}`;
  }

  private formatTime(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
  }


  get tipAmount(): number {
    if (this.isCustomTip) {
      return this.customTipAmount;
    }

    const percent = this.selectedTipPercent ?? 0;
    return +(this.finalSubtotal + this.finalTax) * percent;
  }


  selectTipPercent(percent: number) {
    if(this.selectedTipPercent === percent) {
      this.selectedTipPercent = null;
      this.updateTotals();
      return;
    }
    this.isCustomTip = false;
    this.selectedTipPercent = percent;
    this.customTipAmountInput = '';
    this.customTipAmount = 0;
    this.updateTotals();
  }


  enableCustomTipPercent() {
    this.isCustomTip = true;
    this.selectedTipPercent = null;
    this.customTipAmountInput = '';
    this.customTipAmount = 0;
    this.updateTotals();
  }


  onCustomTipAmountChange(value: string) {
    // allow empty while typing
    if (value === '') {
      this.customTipAmount = 0;
      this.updateTotals();
      return;
    }

    const numeric = Number(value);

    if (isNaN(numeric) || numeric < 0) return;

    // optional hard cap (example $100)
    this.customTipAmount = Math.min(numeric, 100);
    this.updateTotals();
  }


  private getErrMsg(err: any): string {
    if (!err) return 'Unknown error';

    // Standard Error
    if (err instanceof Error) return err.message;

    // Angular HttpErrorResponse shape
    // err.error can be string or object
    if (err?.error) {
      if (typeof err.error === 'string') return err.error;
      if (typeof err.error === 'object') {
        return (
          err.error.message ||
          err.error.error ||
          err.error.displayMessage ||
          JSON.stringify(err.error)
        );
      }
    }

    // Common API shapes
    return (
      err?.message ||
      err?.data?.error ||
      err?.data?.message ||
      err?.statusText ||
      JSON.stringify(err)
    );
  }


}
