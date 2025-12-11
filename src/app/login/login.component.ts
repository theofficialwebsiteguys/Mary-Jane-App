import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../auth.service';
import { SettingsService } from '../settings.service';
import { AccessibilityService } from '../accessibility.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  passwordForm: FormGroup; // ⭐ new form

  loading = false;
  submitted = false;
  error = '';
  darkModeEnabled = false;

  // ⭐ UI mode
  mode: 'login' | 'create-password' = 'login';

  // ⭐ store user from backend (AIQ or legacy user)
  pendingUser: any = null;

  showPassword = false;
  passwordFieldType: 'password' | 'text' = 'password';

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly settingsService: SettingsService,
    private accessibilityService: AccessibilityService
  ) {
    // Login form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    // ⭐ Password / profile completion form
    this.passwordForm = this.fb.group({
      firstName: [''],               // NOT required
      lastName: [''],                // NOT required
      email: ['', [Validators.email]], // optional but must be valid format
      phone: [''],                    // optional
      dob: ['', Validators.required],  // REQUIRED
      password: ['', [Validators.required, Validators.minLength(6)]], // REQUIRED
      confirm: ['', Validators.required],                            // REQUIRED
    });

  }

  ngOnInit() {
    this.settingsService.isDarkModeEnabled$.subscribe(
      mode => (this.darkModeEnabled = mode)
    );
  }

  ngOnDestroy() {
    this.resetForm();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.passwordFieldType = this.showPassword ? 'text' : 'password';
    const announcement = this.showPassword
      ? 'Password characters now visible.'
      : 'Password characters now hidden.';
    this.accessibilityService.announce(announcement, 'polite');
  }

  resetForm() {
    this.loginForm.reset();
    this.passwordForm.reset();
    this.submitted = false;
    this.error = '';
    this.loading = false;
    this.mode = 'login';
    this.pendingUser = null;
  }

  // ============================
  // LOGIN SUBMIT
  // ============================
  onSubmit() {
    this.submitted = true;

    if (this.loginForm.invalid) {
      this.error = 'Please fill in all required fields correctly.';
      this.accessibilityService.announce(this.error, 'assertive');
      return;
    }

    this.loading = true;
    this.error = '';
    this.accessibilityService.announce('Attempting to log in...', 'polite');

    this.authService.login(this.loginForm.value).subscribe({
      next: (data) => {
        // ⭐ Password setup required (AIQ or legacy)
        if (data.requiresPasswordSetup) {
          this.loading = false;

          this.pendingUser = data.user || {};
          this.mode = 'create-password';

          // Prefill the form with what we know
          this.passwordForm.patchValue({
            firstName: this.pendingUser.fname || '',
            lastName: this.pendingUser.lname || '',
            email: this.pendingUser.email || this.loginForm.value.email,
            phone: this.pendingUser.phone || '',
          });

          this.accessibilityService.announce(
            'We found your account. Please review your info, add your date of birth, and create a password.',
            'polite'
          );

          return;
        }

        // ⭐ Normal login handled in AuthService
        this.resetForm();
        this.accessibilityService.announce(
          'Login successful. Redirecting to rewards page.',
          'polite'
        );
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err.data?.details?.issue ||
          err.data?.error ||
          'An unexpected error occurred.';
        this.accessibilityService.announce(this.error, 'assertive');
      },
    });
  }

  // ============================
  // CREATE PASSWORD + PROFILE SUBMIT
  // ============================
  submitPassword() {
    this.submitted = true;

    if (this.passwordForm.invalid) {
      this.error = 'Please fill in all required fields.';
      this.accessibilityService.announce(this.error, 'assertive');
      return;
    }

    const { password, confirm } = this.passwordForm.value;
    if (password !== confirm) {
      this.error = 'Passwords do not match.';
      this.accessibilityService.announce(this.error, 'assertive');
      return;
    }

    this.loading = true;
    this.error = '';

    const form = this.passwordForm.value;

    // Convert DOB string to Date so backend gets ISO with "T"
    const dobDate = new Date(form.dob); // yyyy-MM-dd from <input type="date">

    const userData = {
      fname: form.firstName,
      lname: form.lastName,
      email: form.email,
      phone: form.phone,
      dob: dobDate,
      password: form.password,
      // if you later want to send aiq_id or country, you can add:
      // aiq_id: this.pendingUser?.aiq_id,
      // country: 'US',
    };

    this.authService.register(userData).subscribe({
      next: () => {
        this.loading = false;
        this.resetForm();
        this.accessibilityService.announce(
          'Account updated and password created. You are now logged in.',
          'polite'
        );
        this.router.navigate(['/rewards']);
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err.data?.error ||
          err.error?.message ||
          'Unable to complete your account. Please try again.';
        this.accessibilityService.announce(this.error, 'assertive');
      },
    });
  }

  // Optional: let user cancel password setup and go back to login
  backToLogin() {
    this.mode = 'login';
    this.passwordForm.reset();
    this.pendingUser = null;
    this.error = '';
  }

  private getErrorMessage(err: any): string {
    if (err.status === 400)
      return 'Invalid email or password. Please try again.';
    if (err.status === 500) return 'Server error. Please try again later.';
    if (err.status === 0)
      return 'Network error. Please check your internet connection.';
    return 'An unexpected error occurred. Please try again.';
  }
}
