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
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  darkModeEnabled: boolean = false;

  showPassword = false;
  passwordFieldType: 'password' | 'text' = 'password';


  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly settingsService: SettingsService,
    private accessibilityService: AccessibilityService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.settingsService.isDarkModeEnabled$.subscribe(mode => this.darkModeEnabled = mode);
  }

  ngOnDestroy() {
    this.resetForm();
  }

  
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.passwordFieldType = this.showPassword ? 'text' : 'password';
    const announcement = this.showPassword ? 'Password characters now visible.' : 'Password characters now hidden.';
    this.accessibilityService.announce(announcement, 'polite');
  }

  resetForm() {
    this.loginForm.reset();
    this.submitted = false; 
    this.error = ''; 
    this.loading = false;
  }

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
      next: () => {
        this.resetForm();
        this.accessibilityService.announce('Login successful. Redirecting to rewards page.', 'polite');
        this.router.navigate(['/rewards'])
      },
      error: (err) => {
        this.loading = false;
        // this.error = this.getErrorMessage(err);
        this.error = err.data.error;
        this.accessibilityService.announce(this.error, 'assertive');
      },
    });
  }

  private getErrorMessage(err: any): string {
    if (err.status === 400) return 'Invalid email or password. Please try again.';
    if (err.status === 500) return 'Server error. Please try again later.';
    if (err.status === 0) return 'Network error. Please check your internet connection.';
    return 'An unexpected error occurred. Please try again.';
  }
}
