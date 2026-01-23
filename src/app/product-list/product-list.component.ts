import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { filter, map, Observable, of, startWith, switchMap } from 'rxjs';

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

  similarItems$: Observable<Product[]> = of([]);
  brandItems$: Observable<Product[]> = of([]);

  loading$: Observable<boolean> = of(true);

  ngOnInit() {
    this.updateProducts();

    // 🔄 Loading = products not yet loaded
    this.loading$ = this.productService.productsLoaded$.pipe(
      map(loaded => !loaded)
    );

    this.productService.currentCategory$.subscribe(category => {
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
    if (changes['showSimilarItems']) {

      // When user selects a product
      if (this.showSimilarItems) {

        // Load similar items first
        this.similarItems$ = this.productService.getSimilarItemsByCategoryAndPrice().pipe(startWith([]));

        // Then load brand items with duplicate exclusion
        this.brandItems$ = this.similarItems$.pipe(
          switchMap(similarList => {
            const similarIds = similarList.map(p => p.id);
            return this.productService.getMoreFromBrand(similarIds);
          }),
          filter(items => items.length > 0)
        );


        return;
      }


      // Announce UI change
      const msg = this.showSimilarItems
        ? 'Displaying similar items.'
        : 'Displaying filtered products.';
      this.accessibilityService.announce(msg, 'polite');
    }

    if (changes['searchQuery']) {
      this.updateProducts();
    }
  }

  private updateProducts() {
    if (this.showSimilarItems) {
      this.similarItems$ =
        this.productService.getSimilarItemsByCategoryAndPrice();
      return;
    }

    this.products$ =
      this.productService.getFilteredProducts(this.searchQuery);
  }


  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value.trim();
    this.updateProducts();
  }

  // isCategoryVisible(product: Product): boolean {
  //   return product.category === this.currentCategory || this.currentCategory === 'All';
  // }


}
