import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AuthService } from '../auth.service';
import { SettingsService } from '../settings.service';
import { Location } from '@angular/common';
import { AccessibilityService } from '../accessibility.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm: FormGroup;
  emailSent = false;
  errorMessage = '';
  loading = false;
  darkModeEnabled: boolean = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly settingsService: SettingsService,
    private readonly location: Location,
    private readonly accessibilityService: AccessibilityService
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit() {
    this.settingsService.isDarkModeEnabled$.subscribe((isDarkModeEnabled) => {
      this.darkModeEnabled = isDarkModeEnabled;
    });
  }

  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.errorMessage = 'Please enter a valid email address.';
      this.accessibilityService.announce(this.errorMessage, 'assertive');
      return;
    }

    const email = this.forgotPasswordForm.value.email;
    this.errorMessage = '';
    this.loading = true;

    this.authService.sendPasswordReset(email).subscribe({
      next: () => {
        this.loading = false;
        this.emailSent = true;
        this.accessibilityService.announce('Password reset email sent. Please check your inbox.', 'polite');
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.getErrorMessage(err);
        this.accessibilityService.announce(this.errorMessage, 'assertive');
      },
    });
  }

  goBack() {
    this.location.back();
    this.accessibilityService.announce('Returned to the previous page.', 'polite');
  }

  private getErrorMessage(err: any): string {
    if (err.status === 404) {
      return 'The email is not associated with a registered account.';
    } else if (err.status === 400) {
      return 'The email address provided is invalid.';
    } else if (err.status === 500) {
      return 'An error occurred on the server. Please try again later.';
    }
    return 'An unexpected error occurred. Please try again.';
  }
}
