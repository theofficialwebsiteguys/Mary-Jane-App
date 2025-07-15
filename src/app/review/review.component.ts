import { Component, OnInit } from '@angular/core';
import { AccessibilityService } from '../accessibility.service';

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.scss'],
})
export class ReviewComponent {

  reviewComment: string = '';
  googleReviewUrl: string = 'https://search.google.com/local/writereview?placeid=ChIJxYRNs1cp3okRqOS5tuZ2V5s'; // Replace with your actual Google Review link

  constructor(private accessibilityService: AccessibilityService) {}

  leaveReview() {
    const newWindow = window.open(this.googleReviewUrl, '_blank');
    if (newWindow) {
      this.accessibilityService.announce('Google Reviews opened in a new tab.', 'polite');
    } else {
      this.accessibilityService.announce('Failed to open Google Reviews. Please check your browser settings.', 'assertive');
    }
  }
}
