import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

import { AuthService } from '../auth.service';
import { SettingsService } from '../settings.service';
import { AccessibilityService } from '../accessibility.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
})
export class AccountComponent implements OnInit {
  @Input() user: any;
  allowNotifications = false;
  darkModeEnabled = false;
  userInfo: any = [];
  settings: any = [];

  @ViewChild('liveRegion') liveRegion!: ElementRef;
  
  constructor(private authService: AuthService, private settingsService: SettingsService, private accessibilityService: AccessibilityService, private alertController: AlertController) {}

  ngOnInit(): void {
    if (this.user) {
      this.userInfo = [
        { icon: 'person-outline', label: 'Name', value: `${this.user.fname} ${this.user.lname}` },
        { icon: 'mail-outline', label: 'Email', value: this.user.email },
        { icon: 'call-outline', label: 'Phone', value: this.user.phone }
      ];
      this.darkModeEnabled = this.settingsService.getDarkModeEnabled();
      // this.settings = [
      //   { id: 'darkMode', label: 'Dark Mode', value: this.darkModeEnabled, action: (val: boolean) => this.toggleDarkMode(val) }
      // ];
    }
  }

  toggleDarkMode(value: boolean): void {
    this.darkModeEnabled = value;
    this.settingsService.setDarkModeEnabled(value);
    this.accessibilityService.announce(`Dark mode has been ${value ? 'enabled' : 'disabled'}`);
  }

  async logout(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirm Logout',
      message: 'Are you sure you want to log out?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            this.accessibilityService.announce('Log out canceled');
          },
        },
        {
          text: 'Log Out',
          role: 'destructive',
          handler: () => {
            this.authService.logout();
            this.accessibilityService.announce('You have been logged out');
          },
        },
      ],
    });

    await alert.present();
  }
}
