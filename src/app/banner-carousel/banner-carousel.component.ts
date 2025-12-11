import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-banner-carousel',
  templateUrl: './banner-carousel.component.html',
  styleUrls: ['./banner-carousel.component.scss'],
})
export class BannerCarouselComponent implements OnInit, OnDestroy {
  @ViewChild('dragArea') dragArea!: ElementRef;

  banners = [
    { image: 'assets/banner1.jpg', title: 'banner 1', description: '' },
    { image: 'assets/banner2.jpg', title: 'banner 2', description: '' },
    { image: 'assets/banner3.jpg', title: 'banner 3', description: '' },
    { image: 'assets/banner4.jpg', title: 'banner 4', description: '' }
  ];

  currentIndex = 0;

  // drag state
  isDragging = false;
  startX = 0;
  currentX = 0;
  translateX = 0;
  trackTransform = '';
  trackTransition = 'transform 0.45s ease';

  interval: any;

  ngOnInit(): void {
    this.updateTransform();
    // this.startAutoplay();
  }

  startAutoplay() {
    this.interval = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.banners.length;
      this.updateTransform();
    }, 3500);
  }

  stopAutoplay() {
    clearInterval(this.interval);
  }

  onDragStart(event: any) {
    this.stopAutoplay();
    this.isDragging = true;
    this.trackTransition = 'none';

    this.startX = event.touches ? event.touches[0].clientX : event.clientX;
    this.currentX = this.startX;
  }

  onDragMove(event: any) {
    if (!this.isDragging) return;

    this.currentX = event.touches ? event.touches[0].clientX : event.clientX;
    this.translateX =
      -this.currentIndex * window.innerWidth + (this.currentX - this.startX);

    this.trackTransform = `translateX(${this.translateX}px)`;
  }

  onDragEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;

    const dragDistance = this.currentX - this.startX;

    // swipe threshold
    if (dragDistance > 50) {
      this.prev();
    } else if (dragDistance < -50) {
      this.next();
    } else {
      this.snap();
    }

    this.startAutoplay();
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.banners.length;
    this.snap();
  }

  prev() {
    this.currentIndex =
      (this.currentIndex - 1 + this.banners.length) % this.banners.length;
    this.snap();
  }

  snap() {
    this.trackTransition = 'transform 0.45s ease';
    this.updateTransform();
  }

  updateTransform() {
    this.trackTransform = `translateX(-${this.currentIndex * 100}%)`;
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }
}
