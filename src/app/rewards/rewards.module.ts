import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RewardsPageRoutingModule } from './rewards-routing.module';

import { RewardsPage } from './rewards.page';
import { SharedModule } from '../shared/shared.module';
import { PointsComponent } from '../points/points.component';
import { AccountComponent } from '../account/account.component';
import { ReferComponent } from '../refer/refer.component';
import { ReviewComponent } from '../review/review.component';
import { GuestComponent } from '../guest/guest.component';
import { RedeemProductsComponent } from '../redeem-products/redeem-products.component';
import { AiqTiersComponent } from '../aiq-tiers/aiq-tiers.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RewardsPageRoutingModule,
    SharedModule
  ],
  declarations: [RewardsPage, PointsComponent, AccountComponent, ReferComponent, ReviewComponent, GuestComponent, RedeemProductsComponent, AiqTiersComponent]
})
export class RewardsPageModule {}
