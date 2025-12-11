import { Component, Input, OnChanges } from '@angular/core';
import { CartService } from '../cart.service';

export interface Discount {
  id: string;
  name: string;
  dollarValue: number;
  percentageValue: number;
  pointsDeduction: number;
  reusable: boolean;
  tierDiscount: boolean;
  available: boolean;
  posDiscountID: string;
}

interface DisplayDiscount {
  id: string;
  label: string;
  rewardText: string;
  unlockText: string;
  unlocked: boolean;
  redeemable: boolean;
}

@Component({
  selector: 'app-aiq-tiers',
  templateUrl: './aiq-tiers.component.html',
  styleUrls: ['./aiq-tiers.component.scss'],
})
export class AiqTiersComponent implements OnChanges {
  @Input() userPoints = 0;
  @Input() discounts: Discount[] = [];

  displayDiscounts: DisplayDiscount[] = [];

  constructor(private cartService: CartService) {}


  ngOnChanges(): void {
    if (!this.discounts?.length) return;
    this.buildDiscounts();
  }

  private buildDiscounts(): void {
    this.displayDiscounts = this.discounts
      .map(d => this.toDisplayDiscount(d))
      .sort((a, b) => {
        // Tier discounts first (those with points)
        const aPoints = this.extractPoints(a.unlockText);
        const bPoints = this.extractPoints(b.unlockText);

        if (aPoints !== null && bPoints !== null) {
          return aPoints - bPoints; // ascending points
        }
        if (aPoints !== null) return -1;
        if (bPoints !== null) return 1;

        // Both are promos → stable order
        return a.label.localeCompare(b.label);
      });
  }

  private extractPoints(text: string): number | null {
    const match = text.match(/(\d+)\s?pts/i);
    return match ? Number(match[1]) : null;
  }


  private toDisplayDiscount(d: Discount): DisplayDiscount {
    const isTier = d.tierDiscount && d.pointsDeduction > 0;

    const unlocked = isTier
      ? this.userPoints >= d.pointsDeduction
      : d.available === true;

    return {
      id: d.id,
      label: d.name,
      rewardText: this.getRewardText(d),
      unlockText: isTier
        ? `${d.pointsDeduction} pts`
        : d.available
          ? 'Available'
          : 'Locked',
      unlocked,
      redeemable: unlocked
    };
  }

  private getRewardText(d: Discount): string {
    if (d.dollarValue > 0) return `$${d.dollarValue} off your order`;
    if (d.percentageValue > 0) return `${d.percentageValue}% off your order`;
    return 'Special reward';
  }

  redeem(discount: DisplayDiscount): void {
    if (!discount.redeemable) return;

    const original = this.discounts.find(d => d.id === discount.id);
    if (!original) return;

    this.cartService.setDiscount({
      id: original.id,
      posDiscountID: original.posDiscountID,
      dollarValue: original.dollarValue || undefined,
      percentageValue: original.percentageValue || undefined,
      name: original.name
    });
  }
}
