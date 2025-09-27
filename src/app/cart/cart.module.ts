import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CartPageRoutingModule } from './cart-routing.module';

import { CartPage } from './cart.page';
import { CartItemsComponent } from '../cart-items/cart-items.component';
import { SharedModule } from '../shared/shared.module';
import { CheckoutComponent } from '../checkout/checkout.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CartPageRoutingModule,
    SharedModule
  ],
  declarations: [CartPage, CartItemsComponent, CheckoutComponent]
})
export class CartPageModule {}
