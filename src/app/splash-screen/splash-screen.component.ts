import { trigger, transition, style, animate, state } from '@angular/animations';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AccessibilityService } from '../accessibility.service';
import { SettingsService } from '../settings.service';
import { environment } from 'src/environments/environment';
import { ProductsService } from '../products.service';

@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss'],
  animations: [
    trigger('logoAnimation', [
      state('initial', style({ transform: 'translateY(-100%)', opacity: 0 })),
      state('final', style({ transform: 'translateY(0)', opacity: 1 })),
      transition('initial => final', [animate('0.6s ease-out')]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.5s ease-in', style({ opacity: 1 })),
      ]),
    ]),
    trigger('fadeOut', [
      transition(':leave', [
        style({ transform: 'scale(1)', opacity: 1 }),
        animate('0.5s ease-in', style({ transform: 'scale(0.8)', opacity: 0 })),
      ]),
    ]),
  ],
})
export class SplashScreenComponent implements OnInit {
  @Output() closeSplash = new EventEmitter<void>();
  logoState = 'initial';
  showAgeVerification = false;
  splashVisibility = 'visible';
  logoSrc = 'assets/logo.png';

  selectedAgeConfirmed: boolean = false;
  locations: any[] = []; // Populate this with your fetched venue data


  constructor(private accessibilityService: AccessibilityService, private settingsService: SettingsService, private productsService: ProductsService) {}
  
  ngOnInit() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    this.logoSrc = isDarkMode ? 'assets/logo-dark-mode.png' : 'assets/logo.png';

    setTimeout(() => {
      this.logoState = 'final';
      this.accessibilityService.announce('Welcome to the app. Logo displayed.', 'polite');
    }, 200);

    setTimeout(() => {
      this.showAgeVerification = true;
      this.accessibilityService.announce('Please confirm if you are 21 years old or older.', 'assertive');
    }, 1000);
  }

  onYesClick() {
    this.selectedAgeConfirmed = true;
    this.showAgeVerification = false;
    setTimeout(() => {
      this.closeSplash.emit();
    }, 100);
    // this.accessibilityService.announce('Thank you for confirming your age. Entering the app.', 'polite');
    // setTimeout(() => {
    //   this.closeSplash.emit();
    // }, 100);
  }

  onNoClick() {
    this.accessibilityService.announce('Access denied. You must be over 21 to enter.', 'assertive');
    alert('Sorry, you must be over 21 to enter.');
  }

  // loadLocations() {
  //   this.settingsService.getAlpineVenues().then((data) => {
  //     console.log(data)
  //     this.locations = data;
  //   }).catch((err) => {
  //     console.error('Failed to load locations', err);
  //   });
  // }

  // selectLocation(venue: any) {
  //   this.settingsService.setSelectedVenueId(venue.id);
  //   const location_key = this.settingsService.getSelectedVenueKey();
  //   // Map venue key to flowhub location ID
  //   let locationId = '';
  //   switch (location_key) {
  //     case 'ROCHESTER':
  //       locationId = environment.flowhub_location_rochester;
  //       console.log(locationId)
  //       break;
  //     case 'CANANDAIGUA':
  //       locationId = environment.flowhub_location_canandaigua;
  //       break;
  //     default:
  //       console.warn('Unknown venue selected, using default location ID.');
  //   }
  //    this.productsService.fetchProducts(locationId).subscribe({
  //     next: () => {
  //       console.log("Products fetched successfully.");
  

  //     },
  //     error: (error) => {
  //       console.error("Error fetching products:", error);
  //     }
  //   });
  //   this.accessibilityService.announce('Thank you for confirming your age. Entering the app.', 'polite');
  //   setTimeout(() => {
  //     this.closeSplash.emit();
  //   }, 100);
  // }

}
