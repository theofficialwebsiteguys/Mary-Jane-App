import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ProductsService } from '../products.service';
import { Router } from '@angular/router';

interface DiscountBanner {
  image: string;
  title: string;
  description?: string;
  discountId: string;
}


@Component({
  selector: 'app-banner-carousel',
  templateUrl: './banner-carousel.component.html',
  styleUrls: ['./banner-carousel.component.scss'],
})
export class BannerCarouselComponent implements OnInit, OnDestroy {
  @ViewChild('dragArea') dragArea!: ElementRef;

  banners: any[] = [];

  currentIndex = 0;

  // drag state
  isDragging = false;
  startX = 0;
  currentX = 0;
  translateX = 0;
  trackTransform = '';
  trackTransition = 'transform 0.45s ease';

  interval: any;

  constructor(private productsService: ProductsService, private router: Router) {}

  ngOnInit(): void {
     
    // this.startAutoplay();
  }

  ngAfterViewInit(){
    this.productsService.getDiscountBanners().subscribe(banners => {
          this.banners = banners;
          console.log(this.banners)
          this.currentIndex = 0;
          this.updateTransform();
        });
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

  onBannerClick(banner: any) {
    // 1️⃣ Set category to Deals
    this.productsService.updateCategory('Deals');

    // 2️⃣ Apply discount filter
    this.productsService.updateProductFilters({
      ...this.productsService['currentProductFilters'].value,
      discountId: banner.discountId,
    });

    // 3️⃣ Navigate to products page
    this.router.navigateByUrl('/products');
  }
}
