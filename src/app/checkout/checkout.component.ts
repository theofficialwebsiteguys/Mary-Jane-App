import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppliedDiscount, CartService } from '../cart.service';
import { LoadingController, ToastController } from '@ionic/angular';
import { AccessibilityService } from '../accessibility.service';
import { AuthService } from '../auth.service';
import { SettingsService } from '../settings.service';
import { FcmService } from '../fcm.service';
import { AeropayService } from '../aeropay.service';
import { openWidget } from 'aerosync-web-sdk';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit {
  @Input() checkoutInfo: any;

  @Output() back = new EventEmitter<void>();
  @Output() orderPlaced = new EventEmitter<void>();

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


  constructor(
    private cartService: CartService,
    private loadingController: LoadingController,
    private accessibilityService: AccessibilityService,
    private toastController: ToastController,
    private authService: AuthService,
    private settingsService: SettingsService,
    private fcmService: FcmService,
    private aeropayService: AeropayService  
  ) {}

  async ngOnInit() {
    this.cartService.appliedDiscount$.subscribe(discount => {
      this.appliedDiscount = discount;

      if (discount) {
        this.selectedRewardId = discount.id;
      } else {
        this.selectedRewardId = null;
        this.loadAvailableDiscounts();
      }


      this.updateTotals();
    });

    await this.loadAvailableDiscounts();
    // ------------------------------
    // USE TREEZ PREVIEW TOTALS ONLY
    // ------------------------------
    const t = this.checkoutInfo.previewTotals;
    console.log(this.checkoutInfo)
    this.originalTreezSubtotal = t.subTotal;
    this.originalTreezTax = t.taxTotal;

    // Live values
    this.finalSubtotal = t.subTotal;
    this.finalTax = t.taxTotal;
    this.finalTotal = t.total;
    this.discountTotal = t.discountTotal;

    // Compute available delivery schedule + dates
    this.loadDeliverySchedule();

    // Set next day as minimum date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.minDate = tomorrow.toISOString().split('T')[0];

    //  this.cartService.appliedDiscount$.subscribe(d => {
    //   this.appliedDiscount = d;
    //   this.updateTotals();
    // });
  }

   private async loadAvailableDiscounts() {
    try {
      const discounts = await this.settingsService.getDiscounts();
      const userPoints = this.userPoints;

      this.availableRewards = discounts
        .filter(d =>
          d.tierDiscount === true &&
          d.pointsDeduction > 0 &&
          (d.dollarValue > 0 || d.percentageValue > 0) &&
          d.pointsDeduction <= userPoints
        )
        .map(d => ({
          id: d.id,
          name: d.name,
          dollarValue: d.dollarValue || 0,
          percentageValue: d.percentageValue || 0,
          pointsDeduction: d.pointsDeduction,
          reusable: d.reusable,
          internalName: d.internalName
        })).sort((a: any, b: any) => a.pointsDeduction - b.pointsDeduction);

    } catch (err) {
      console.error('Failed to load discounts', err);
      this.availableRewards = [];
    }
  }

  get userPoints(): number {
    return this.checkoutInfo?.user_info?.points ?? 0;
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
    this.selectedOrderType = event.detail.value;

    if (this.selectedOrderType === 'delivery') {
      this.selectedPaymentMethod = 'aeropay';
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

  updateTotals() {
    // Start from Treez preview subtotal
    let subtotal = this.originalTreezSubtotal;

    // Apply points
    const pointsDiscount = this.pointsToRedeem * this.pointValue;
    subtotal -= pointsDiscount;
    if (subtotal < 0) subtotal = 0;

    // Premium discount
    this.premiumDiscountApplied = false;
    if (this.checkoutInfo.user_info.premium && subtotal > 100) {
      this.premiumDiscountAmount = subtotal * this.premiumDiscountRate;
      subtotal -= this.premiumDiscountAmount;
      this.premiumDiscountApplied = true;
    }

    // Staff discount
    this.employeeDiscountApplied = false;
    if (['employee', 'admin'].includes(this.checkoutInfo.user_info.role)) {
      this.employeeDiscountAmount = subtotal * this.employeeDiscountRate;
      subtotal -= this.employeeDiscountAmount;
      this.employeeDiscountApplied = true;
    }

    // Reapply Treez tax proportional snapshot
    const taxRatio = this.originalTreezTax / this.originalTreezSubtotal;
    this.finalSubtotal = subtotal;
    this.finalTax = subtotal * taxRatio;
    this.finalTotal = this.finalSubtotal + this.finalTax;
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
      const points_redeem = this.pointsToRedeem;
      let points_add = 0;
      let pos_order_id = 0;

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
          : []
      };

      // --- AEROPAY PAYMENT ---
      if (this.selectedPaymentMethod === "aeropay" && this.selectedBankId) {
        try {
          await this.aeropayService.fetchUsedForMerchantToken(this.aeropayUserId).toPromise();
          const tx = await this.aeropayService.createTransaction(
            this.finalTotal.toFixed(2),
            this.selectedBankId
          ).toPromise();

          if (!tx?.data?.success) {
            await this.presentToast("Payment failed.");
            this.isLoading = false;
            return;
          }

          this.presentToast("Payment successful!", "success");

        } catch (err) {
          console.error(err);
          await this.presentToast("Payment error.");
          this.isLoading = false;
          return;
        }
      }


      // // ----------------------------------------------------
      // // 3️⃣ Submit to TREEZ
      // // ----------------------------------------------------
      // const treezRes = await this.cartService.submitTreezOrder(treezPayload);
      // console.log('TREEZ ORDER SUCCESS:', treezRes);

      // pos_order_id = treezRes.order.data.order_number || 0;
      // points_add = this.finalSubtotal;

      // // ----------------------------------------------------
      // // 4️⃣ Save to LOCAL DATABASE (THIS WAS MISSING)
      // // ----------------------------------------------------
      // await this.cartService.placeOrder(
      //   {
      //     user_id,
      //     pos_order_id,
      //     points_add: points_redeem ? 0 : points_add,
      //     points_redeem,
      //     amount: this.finalSubtotal,
      //     cart: this.checkoutInfo.cart,

      //     // NEW ➜ customer fields
      //     customer_name: `${this.checkoutInfo.user_info.fname} ${this.checkoutInfo.user_info.lname}`,
      //     customer_email: this.checkoutInfo.user_info.email,
      //     customer_phone: this.checkoutInfo.user_info.phone,
      //     customer_dob: this.checkoutInfo.user_info.dob,

      //     // NEW ➜ order meta fields
      //     order_type: this.selectedOrderType
      //   }
      // );

      // await this.authService.getUserOrders();

      // const msg =
      //   this.selectedOrderType === 'delivery'
      //     ? 'Your delivery order has been placed!'
      //     : 'Your pickup order has been placed!';

      // await this.fcmService.sendPushNotification(
      //   user_id,
      //   'Order Confirmed',
      //   msg
      // );

      // this.orderPlaced.emit();
      // this.accessibilityService.announce('Your order has been placed successfully.');

    } catch (err) {
      console.error('Order Error:', err);
      this.presentToast('Error placing order.');
    } finally {
      this.isLoading = false;
      loading.dismiss();
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
      environment: "sandbox",
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

}
