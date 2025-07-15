import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss'],
})
export class EventDetailComponent {
  @Input() event: any;
  rsvpStatus: boolean = false;

  toggleRSVP() {
    this.rsvpStatus = !this.rsvpStatus;
    // Optional: send to backend or service
  }
}
