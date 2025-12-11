import { Component, OnInit } from '@angular/core';

import { ProductsService } from '../products.service';

import { CategoryWithImage, ProductCategory } from '../product-category/product-category.model';
import { Product } from '../product/product.model';
import { AccessibilityService } from '../accessibility.service';
import { DEFAULT_PRODUCT_FILTERS } from '../product-filters/product-filters.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-card-slider',
  templateUrl: './card-slider.component.html',
  styleUrls: ['./card-slider.component.scss'],
})
export class CardSliderComponent implements OnInit {
  products: Product[] = [];
  categories: CategoryWithImage[] = [];
  loading: boolean = true; // Add loading state

  homeSections = [
    { key: 'featured', label: 'Featured Products' },
    { key: 'newest', label: 'Newest Drops' },
    { key: 'deals', label: 'Deals' },
    { key: 'accessory', label: 'Accessory' },
    { key: 'all', label: 'All Products' }
  ];


  constructor(private readonly productService: ProductsService, private accessibilityService: AccessibilityService,  private router: Router) {}

  ngOnInit() {
    this.categories = this.productService.getCategories();

    this.productService.getProducts().subscribe((products) => {
      this.products = products;
      console.log(this.products)
      this.loading = false; // Set loading to false when data is retrieved
    });
  }

  private normalizeCategory(value: string | undefined | null): string {
    return (value || '').trim().toLowerCase();
  }

getLimitedProducts(section: string) {
  switch (section) {
    case 'deals':
      return this.products.filter(p => p.isDeal).slice(0, 9);

    case 'accessory':
      return this.products.filter(
        p => p.category?.toLowerCase() === 'accessory'
      ).slice(0, 9);

    case 'featured':
      return this.products.slice(0, 9);
      // return this.products.filter(p => p.isFeatured).slice(0, 9);

    case 'all':
      return this.products.slice(0, 9);

    case 'newest':
      return [...this.products]
        .sort(
          (a: any, b: any) =>
            new Date(b['updatedAt']).getTime() -
            new Date(a['updatedAt']).getTime()
        )
        .slice(0, 9);

    default:
      return [];
  }
}


  getTotalProducts(category: string) {
    if (category === 'All') return this.products.length;
    if (category === 'Deals') return this.products.filter(p => p['isDeal']).length;
    return this.products.filter(p => p.category === category).length;
  }


  updateCategory(category?: ProductCategory) {
    if (category) {
      this.productService.updateCategory(category);
      this.accessibilityService.announce(`Category changed to ${category}`, 'polite');
    }
  }

  updateProductDisplay(product: Product) {
    this.productService.updateCurrentProduct(product);
    this.accessibilityService.announce(`Viewing product ${product.title}`, 'polite');
  }

  getProductImage(product: any): string {
    if (product.image) {
      return product.image;
    }
    return this.placeholderFor(product.category);
  }

    
  placeholderFor(category?: string | null): string {
    const key = (category || 'default').toLowerCase();
    // map to your assets; provide a default fallback
    const map: Record<string, string> = {
      flower: 'assets/flower-general.png',
      'pre-roll': 'assets/pre-roll-general.png',
      prerolls: 'assets/pre-roll-general.png',
      edibles: 'assets/edibles-general.png',
      vapes: 'assets/vapes-general.png',
      concentrates: 'assets/concentrates-general.png',
      beverage: 'assets/beverage-general.png',
      tinctures: 'assets/tincture-general.png',
      topicals: 'assets/topicals-general.png',
      accessory: 'assets/accessories-general.png',
      default: 'assets/default.png'
    };
    return map[key] || map['default'];
  }

  goToSection(section: string) {
  if (section === 'deals') {
    this.updateCategory('Deals'); // real category
    return;
  }

  if (section === 'accessories') {
    this.updateCategory('Accessory'); // real category
    return;
  }

  // Featured → go to /products?page=featured
  if (section === 'featured') {
    this.productService.updateCategory('All');
    this.productService.updateProductFilters({
      ...DEFAULT_PRODUCT_FILTERS,
      sortMethod: { criterion: 'recent', direction: 'DESC' }
    });
    this.router.navigate(['/products'], { queryParams: { view: 'featured' } });
    return;
  }

  // Newest → go to /products sorted newest
  if (section === 'newest') {
    this.productService.updateCategory('All');
    this.productService.updateProductFilters({
      ...DEFAULT_PRODUCT_FILTERS,
      sortMethod: { criterion: 'recent', direction: 'DESC' }
    });
    this.router.navigate(['/products'], { queryParams: { view: 'newest' } });
  }
}

}
