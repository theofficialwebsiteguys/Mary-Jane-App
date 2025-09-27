import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OrdersPageRoutingModule } from './orders-routing.module';

import { OrdersPage } from './orders.page';
import { SharedModule } from '../shared/shared.module';
import { RecentOrdersComponent } from '../recent-orders/recent-orders.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OrdersPageRoutingModule,
    SharedModule
  ],
  declarations: [OrdersPage, RecentOrdersComponent]
})
export class OrdersPageModule {}
