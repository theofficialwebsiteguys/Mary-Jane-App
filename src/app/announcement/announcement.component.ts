// src/app/components/announcement/announcement.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Announcement, SettingsService } from '../settings.service';

@Component({
  selector: 'app-announcement',
  templateUrl: './announcement.component.html',
  styleUrls: ['./announcement.component.scss'],
})
export class AnnouncementComponent implements OnInit, OnDestroy {
  announcements: Announcement[] = [];
  currentIndex = 0;

  isLoading = true;
  hasError = false;
  isHidden = false;

  private rotateInterval: any;

  constructor(private settingsService: SettingsService) {}

  async ngOnInit() {
    try {
      this.announcements = await this.settingsService.getBusinessAnnouncements();
      console.log('Announcements:', this.announcements);

      this.hasError = this.announcements.length === 0;
      this.isLoading = false;

      if (this.announcements.length > 1) {
        this.startRotation();
      }

    } catch (err) {
      this.hasError = true;
      this.isLoading = false;
    }
  }

  startRotation() {
    this.clearRotation();
    this.rotateInterval = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.announcements.length;
    }, 5000);
  }

  clearRotation() {
    if (this.rotateInterval) {
      clearInterval(this.rotateInterval);
      this.rotateInterval = null;
    }
  }

  ngOnDestroy(): void {
    this.clearRotation();
  }
}
