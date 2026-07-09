import { Component, Input, OnInit } from '@angular/core';
import { Browser } from '@capacitor/browser';

@Component({
  selector: 'app-force-update',
  templateUrl: './force-update.component.html',
  styleUrls: ['./force-update.component.scss'],
})
export class ForceUpdateComponent implements OnInit {
  @Input() storeUrl = '';

  constructor() {}

  ngOnInit() {}

  async openStore() {
    if (!this.storeUrl) return;
    await Browser.open({ url: this.storeUrl });
  }
}
