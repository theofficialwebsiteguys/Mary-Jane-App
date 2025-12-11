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
  splashVisibility = 'visible';
  logoSrc = 'assets/logo.png';

  constructor(
    private accessibilityService: AccessibilityService
  ) {}

  ngOnInit() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    this.logoSrc = isDarkMode ? 'assets/logo-dark-mode.png' : 'assets/logo.png';

    setTimeout(() => {
      this.logoState = 'final';
      this.accessibilityService.announce(
        'Welcome to the shop.',
        'polite'
      );
    }, 200);
  }

  onEnterClick() {
    this.accessibilityService.announce(
      'Entering the shop.',
      'polite'
    );
    this.closeSplash.emit();
  }

  onYes() {
    this.accessibilityService.announce('Access granted.', 'polite');
    this.closeSplash.emit(); // proceed into the app
  }

  onNo() {
    this.accessibilityService.announce('Access denied.', 'assertive');
  }

}
