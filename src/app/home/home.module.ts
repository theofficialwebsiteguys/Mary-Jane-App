import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';

import { HomePageRoutingModule } from './home-routing.module';
import { CardSliderComponent } from '../card-slider/card-slider.component';
import { BannerCarouselComponent } from '../banner-carousel/banner-carousel.component';

import { SharedModule } from '../shared/shared.module';
import { GuestComponent } from '../guest/guest.component';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    HomePageRoutingModule,
    SharedModule,
  ],
  declarations: [HomePage, CardSliderComponent],
})
export class HomePageModule {}
