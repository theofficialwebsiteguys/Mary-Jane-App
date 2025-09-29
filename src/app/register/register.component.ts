import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { SettingsService } from '../settings.service';
import { AccessibilityService } from '../accessibility.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  isFormTouched = false; 

  countries = [
    { name: 'United States', dialCode: '+1', code: 'US' },
    { name: 'United Kingdom', dialCode: '+44', code: 'GB' },
    { name: 'France', dialCode: '+33', code: 'FR' },
    { name: 'Germany', dialCode: '+49', code: 'DE' },
    { name: 'Croatia', dialCode: '+385', code: 'HR' },
    { name: 'Canada', dialCode: '+1', code: 'CA' },
    { name: 'Australia', dialCode: '+61', code: 'AU' },
    { name: 'India', dialCode: '+91', code: 'IN' },
    { name: 'Japan', dialCode: '+81', code: 'JP' },
    { name: 'China', dialCode: '+86', code: 'CN' },
    { name: 'Italy', dialCode: '+39', code: 'IT' },
    { name: 'Spain', dialCode: '+34', code: 'ES' },
    { name: 'Mexico', dialCode: '+52', code: 'MX' },
    { name: 'Brazil', dialCode: '+55', code: 'BR' },
    { name: 'South Africa', dialCode: '+27', code: 'ZA' },
    { name: 'New Zealand', dialCode: '+64', code: 'NZ' },
    { name: 'Russia', dialCode: '+7', code: 'RU' },
    { name: 'South Korea', dialCode: '+82', code: 'KR' },
  ];

  selectedCountryCode = this.countries[0].dialCode;

  dobEmptyError = false; 
  dobInvalidError = false; 
  underageError = false; 

  currentYear = new Date().getFullYear();
  darkModeEnabled: boolean = false;

  showPassword = false;
  passwordFieldType: 'password' | 'text' = 'password';

  showConfirmPassword = false;
  confirmPasswordFieldType: 'password' | 'text' = 'password';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private settingsService: SettingsService,
    private accessibilityService: AccessibilityService
  ) {
    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        countryCode: [this.countries[0].code, Validators.required], 
        phone: ['', [Validators.required, Validators.pattern(/^\d{7,15}$/)]], 
        month: [
          '',
          [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])$/)],
        ], 
        day: [
          '',
          [
            Validators.required,
            Validators.pattern(/^(0[1-9]|[12][0-9]|3[01])$/),
          ],
        ],
        year: [
          '',
          [
            Validators.required,
            Validators.pattern(
              new RegExp(
                `^(19[0-9][0-9]|20[0-9][0-9]|20${Math.floor(this.currentYear / 10)}[0-${this.currentYear % 10}])$`
              )
            )
            
          ],
        ],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        termsAccepted: [false, Validators.requiredTrue],
      },
      {
        validator: this.passwordMatchValidator, 
      }
    );
  }

  ngOnInit() {
    window.addEventListener('resize', this.handleKeyboard.bind(this));
  
    this.registerForm.valueChanges.subscribe(() => {
      this.isFormTouched = true;
    });
    this.settingsService.isDarkModeEnabled$.subscribe((isDarkModeEnabled) => {
      this.darkModeEnabled = isDarkModeEnabled;
    });
  }

  ngOnDestroy() {
    // Reset the form when navigating away
    this.resetForm();
    window.removeEventListener('resize', this.handleKeyboard.bind(this));
  }

  handleKeyboard() {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.tagName === 'INPUT') {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    this.passwordFieldType = this.showPassword ? 'text' : 'password';
    const announcement = this.showPassword
      ? 'Password characters now visible.'
      : 'Password characters now hidden.';
    this.accessibilityService.announce(announcement, 'polite');
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
    this.confirmPasswordFieldType = this.showConfirmPassword
      ? 'text'
      : 'password';
    const announcement = this.showConfirmPassword
      ? 'Confirm Password characters now visible.'
      : 'Confirm Password characters now hidden.';
    this.accessibilityService.announce(announcement, 'polite');
  }

  onSubmit() {
    this.submitted = true;

    if (this.registerForm.invalid) {
      this.accessibilityService.announce('Please correct the errors in the form.', 'assertive');
      this.loading = false;
      return;
    }

    if (!this.registerForm.get('termsAccepted')?.value) {
      this.error = "You must accept the Terms & Conditions to continue.";
      return;
    }

    this.loading = true;
    const month = this.registerForm.get('month')?.value;
    const day = this.registerForm.get('day')?.value;
    const year = this.registerForm.get('year')?.value;

    console.log(month);
    console.log(day);
    console.log(year);

    if (!month || !day || !year) {
      this.dobEmptyError = true;
      this.loading = false;
      return;
    } else {
      this.dobEmptyError = false;
    }

    // Create DOB and check if user is 21+
    const dobString = `${year}-${month}-${day}`;
    const dob = new Date(dobString);

    console.log(dob);
    console.log(isNaN(dob.getTime()))

    if (isNaN(dob.getTime())) {
      this.dobInvalidError = true;
      this.accessibilityService.announce('Invalid date of birth.', 'assertive');
      this.loading = false;
      return;
    } else {
      this.dobInvalidError = false;
    }

    const age = this.calculateAge(dob);
    console.log(age)
    if (age < 21) {
      this.underageError = true;
      this.accessibilityService.announce('You must be at least 21 years old to register.', 'assertive');
      this.loading = false;
      return;
    } else {
      this.underageError = false;
    }

    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = ''; // Clear previous error

    const formData = this.registerForm.value;
    const userData = {
      fname: formData.firstName,
      lname: formData.lastName,
      email: formData.email,
      dob: dob,
      country: formData.countryCode,
      phone: formData.phone,
      password: formData.password,
    };

    this.authService.register(userData).subscribe({
      next: () => {
        this.loading = false;
        this.resetForm();
      },
      error: (err) => {
        this.loading = false;
    
        const errorMessage = err.data.error; // Assuming `err.error` is the string you provided
        this.error
        // if (err.status === 500) {
        //   if (errorMessage.includes('SequelizeUniqueConstraintError')) {
        //     this.error = 'This user already exists in the system.';
        //   } else if (errorMessage.includes('SequelizeValidationError')) {
        //     this.error = 'The provided phone or email is invalid.';
        //   } else {
        //     this.error = 'An unexpected error occurred. Please try again later.';
        //   }
        // } else {
        //   this.error = 'Unable to register a new user at this time. Please try again later.';
        // }
      },
    });
    
  }

  resetForm() {
    this.registerForm.reset(); // Reset the form fields
    this.submitted = false; // Reset submission state
    this.error = ''; // Clear any errors
    this.isFormTouched = false; // Reset the touch state
    this.dobEmptyError = false;
    this.dobInvalidError = false;
    this.underageError = false;
  }

  onCountryCodeChange() {
    const countryCode = this.registerForm.get('countryCode')?.value;
    const phoneControl = this.registerForm.get('phone');
    if (phoneControl) {
      phoneControl.setValue(`${countryCode}${phoneControl.value || ''}`);
    }
  }

  // Custom validator to check if password and confirmPassword match
  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { notMatching: true };
  }

  // Helper to calculate age
  calculateAge(dob: Date): number {
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDifference = today.getMonth() - dob.getMonth();
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < dob.getDate())
    ) {
      return age - 1;
    }
    return age;
  }
}
