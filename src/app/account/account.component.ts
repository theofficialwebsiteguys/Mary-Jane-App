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

  editForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  };


  @ViewChild('liveRegion') liveRegion!: ElementRef;
  
  constructor(private authService: AuthService, private settingsService: SettingsService, private accessibilityService: AccessibilityService, private alertController: AlertController) {}

  ngOnInit(): void {
    if (this.user) {
      this.userInfo = [
        { key: 'name', icon: 'person-outline', label: 'Name', value: `${this.user.fname} ${this.user.lname}` },
        { key: 'email', icon: 'mail-outline', label: 'Email', value: this.user.email },
        { key: 'phone', icon: 'call-outline', label: 'Phone', value: this.user.phone }
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

  async openEditProfileModal(): Promise<void> {
    // preload current values
    this.editForm = {
      firstName: this.user.fname,
      lastName: this.user.lname,
      email: this.user.email,
      phone: this.user.phone,
    };

    const alert = await this.alertController.create({
      header: 'Edit Account Details',
      inputs: [
        {
          name: 'firstName',
          type: 'text',
          placeholder: 'First name',
          value: this.editForm.firstName,
        },
        {
          name: 'lastName',
          type: 'text',
          placeholder: 'Last name',
          value: this.editForm.lastName,
        },
        {
          name: 'email',
          type: 'email',
          placeholder: 'Email',
          value: this.editForm.email,
        },
        {
          name: 'phone',
          type: 'tel',
          placeholder: 'Phone',
          value: this.editForm.phone,
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Save',
          handler: (data) => {
            this.saveProfileChanges(data);
          },
        },
      ],
    });

    await alert.present();
  }

  saveProfileChanges(data: any): void {
    const payload: any = {
      // ALWAYS send stable identifiers
      lookupEmail: this.user.email,
      lookupPhone: this.user.phone,
    };

    // Only send changed values
    if (data.firstName !== this.user.fname) payload.firstName = data.firstName;
    if (data.lastName !== this.user.lname) payload.lastName = data.lastName;
    if (data.email !== this.user.email) payload.email = data.email;
    if (data.phone !== this.user.phone) payload.phone = data.phone;

    // Nothing changed (only lookup fields present)
    if (Object.keys(payload).length === 2) {
      this.accessibilityService.announce('No changes made');
      return;
    }

    this.authService.editAiqContact(payload).subscribe({
      next: () => {
        this.user.fname = data.firstName;
        this.user.lname = data.lastName;
        this.user.email = data.email;
        this.user.phone = data.phone;

        this.ngOnInit();
        this.accessibilityService.announce('Account details updated');
      },
      error: () => {
        this.accessibilityService.announce('Failed to update account details');
      },
    });
  }





}
