import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { Observable, of, startWith } from 'rxjs';

import { ProductsService } from '../products.service';

import { Product } from '../product/product.model';
import { ProductCategory } from '../product-category/product-category.model';
import { AccessibilityService } from '../accessibility.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent implements OnInit {

  @Input() showSimilarItems: boolean = false;
  @Input() searchQuery: string = '';

  constructor(private productService: ProductsService, private accessibilityService: AccessibilityService) {}

  currentCategory: ProductCategory = 'Pre-Roll';
  products$: Observable<Product[]> = of([]);

  ngOnInit() {
    this.updateProducts();

    this.productService.currentCategory$.subscribe((category) => {
      console.log(category)
      this.currentCategory = category; 
      this.updateProducts();
      this.accessibilityService.announce(`Category updated to ${category}.`, 'polite');
    });

    this.productService.currentProductFilters$.subscribe(() => {
      this.updateProducts();
      this.accessibilityService.announce('Product filters updated.', 'polite');
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['searchQuery']) {
      this.updateProducts();
    }

    if (changes['showSimilarItems']) {
      this.updateProducts();
      const message = this.showSimilarItems ? 'Displaying similar items.' : 'Displaying filtered products.';
      this.accessibilityService.announce(message, 'polite');
    }
  }

  private updateProducts() {
    if (this.showSimilarItems) {
      this.products$ = this.productService.getSimilarItems().pipe(startWith([]));
    } else {
      this.products$ = this.productService.getFilteredProducts(this.searchQuery).pipe(startWith([]));
      this.products$.subscribe((products) => {
        console.log('Filtered Products:', products); // <-- This will print the products array
      });
    }
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value.trim();
    this.updateProducts();
  }

  isCategoryVisible(category: string, masterCategory: string): boolean {
    return (
      this.searchQuery.trim() !== '' ||
      this.productService.getEffectiveCategory(category, masterCategory) === this.currentCategory
    );
  }

}
