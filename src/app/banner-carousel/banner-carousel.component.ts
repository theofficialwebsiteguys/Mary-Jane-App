import { Component, OnInit, OnDestroy } from '@angular/core';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-banner-carousel',
  templateUrl: './banner-carousel.component.html',
  styleUrls: ['./banner-carousel.component.scss'],
})
export class BannerCarouselComponent implements OnInit, OnDestroy {
  banners: { image: string; title: string; description: string }[] = [];
  currentIndex = 0;
  interval: any;

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    // this.loadCarouselImages();
    this.banners = [{ image: 'assets/banner2.jpg' , title: 'goood life banner', description: 'goood life banner'},
      { image: 'assets/banner1.png' , title: 'banner 1', description: 'goood life banner'},
      { image: 'assets/banner4.avif' , title: 'banner 2', description: 'goood life banner'},
      { image: 'assets/banner3.jpg' , title: 'banner 3', description: 'goood life banner'},
      { image: 'assets/banner6.webp' , title: 'banner 4', description: 'goood life banner'},
      { image: 'assets/banner5.avif' , title: 'banner 5', description: 'goood life banner'}
    ]
    this.startCarousel();
  }

  loadCarouselImages() {
    this.settingsService.getCarouselImages().subscribe(
      response => {
        console.log(response)
        this.banners = response.images.map((imgUrl, index) => ({
          image: `${imgUrl}?v=${new Date().getTime()}`,
          title: `Carousel Image ${index + 1}`,
          description: 'CottonMouth Dispensary',
        }));
        console.log(this.banners)
      },
      error => {
        console.error('Error fetching carousel images:', error);
      }
    );
  }

  startCarousel() {
    this.interval = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.banners.length;
    }, 6000);
  }

  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}
