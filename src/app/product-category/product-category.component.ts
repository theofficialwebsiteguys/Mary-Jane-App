import { Component, Input, OnInit } from '@angular/core';

import { ProductsService } from '../products.service';

import { CategoryWithImage, ProductCategory } from './product-category.model';
import { AccessibilityService } from '../accessibility.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-category',
  templateUrl: './product-category.component.html',
  styleUrls: ['./product-category.component.scss'],
})
export class ProductCategoryComponent implements OnInit {
  constructor(
    private productService: ProductsService,
    private accessibilityService: AccessibilityService,
    private router: Router
  ) {}

  @Input() category: CategoryWithImage = { category: 'Flower', imageUrl: '' };

  ngOnInit() {}

  handleCategorySelect(category: ProductCategory) {
    console.log(category)
    this.productService.updateCategory(category); // Update the selected category in the service
    this.accessibilityService.announce(
      `${category} category selected.`,
      'polite'
    ); // Accessibility announcement
  }

  isSelectedCategory(category: ProductCategory): boolean {
    // Do not highlight any category if the current route is `/`
    if (this.router.url === '/home') {
      return false;
    }
    // Otherwise, check the selected category
    return this.productService.getCurrentCategory() === category;
  }
}
