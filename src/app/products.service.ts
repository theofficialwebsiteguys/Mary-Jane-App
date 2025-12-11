import { Injectable } from '@angular/core';
import { Product, Strain } from './product/product.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, filter, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CapacitorHttp } from '@capacitor/core';

import { ProductCategory, CategoryWithImage } from './product-category/product-category.model';
import {
  DEFAULT_PRODUCT_FILTERS,
  PotencyRange,
  ProductFilterOptions,
  ProductFilters,
} from './product-filters/product-filters.model';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private products = new BehaviorSubject<Product[]>([]);
  products$ = this.products.asObservable();

  private currentCategory = new BehaviorSubject<ProductCategory>('All');
  currentCategory$ = this.currentCategory.asObservable();

  private currentProduct = new BehaviorSubject<Product | null>(null); // Start with null or a default Product
  currentProduct$ = this.currentProduct.asObservable();

  private currentProductFilters = new BehaviorSubject<ProductFilters>(
    DEFAULT_PRODUCT_FILTERS
  );
  currentProductFilters$ = this.currentProductFilters.asObservable();

  private lastFetchedLocationId: string | null = null;


  constructor(private http: HttpClient, private route: Router) {
    // this.loadProductsFromSessionStorage();
  }

  private loadProductsFromSessionStorage(): void {
    const storedProducts = sessionStorage.getItem('products');
    if (storedProducts) {
      const parsedProducts: Product[] = JSON.parse(storedProducts);
      const sortedProducts = this.sortProducts(parsedProducts);
      this.products.next(sortedProducts);
    }
  }

  private saveProductsToSessionStorage(products: Product[]): void {
    sessionStorage.setItem('products', JSON.stringify(products));
  }

 fetchProducts(toggleVape = true): Observable<Product[]> {
  // Clear products if location has changed
  // if (this.lastFetchedLocationId && this.lastFetchedLocationId !== location_id) {
  //   console.log('Location changed. Clearing previous products.');
  //   this.products.next([]);
  //   this.saveProductsToSessionStorage([]); // optional, if you’re syncing to session storage
  // }

  // Return cached products if already loaded for the same location
  // if (this.products.value.length > 0 && this.lastFetchedLocationId === location_id) {
  //   console.log('Products already loaded for this location.');
  //   return of(this.products.value);
  // }

  const options = {
    url: `${environment.apiUrl}/treez/inventory`,
    params: { toggleVape: String(toggleVape) },
    headers: {
      'Content-Type': 'application/json',
      'x-auth-api-key': environment.db_api_key,
    },
  };

  return new Observable<Product[]>((observer) => {
    CapacitorHttp.get(options)
      .then((response) => {
        if (response.status === 200) {
          const normalized = response.data.products.map((p: any) => ({
            ...p,
            isDeal: Array.isArray(p.discounts) && p.discounts.length > 0
          }));

          const sortedProducts = this.sortProducts(normalized);

          this.products.next(sortedProducts);
          this.saveProductsToSessionStorage(sortedProducts);
          observer.next(sortedProducts);
          observer.complete();
        } else {
          console.error('API request failed:', response);
          observer.error(response);
        }
      })
      .catch((error) => {
        console.error('Error fetching products:', error);
        observer.error(error);
      });
  });
}

  
  getProducts(): Observable<Product[]> {
    return this.products$.pipe(
      filter(products => products.length > 0) // Only emit if products exist
    );
  }

  private sortProducts(products: Product[]): Product[] {
    const sorted = products
      .filter(p => p && typeof p.title === 'string') // filter out invalid products
      .sort((a, b) => a.title.localeCompare(b.title));
    
      console.log(sorted)
      return sorted;
  }

 getFilteredProducts(searchQuery: string = ''): Observable<Product[]> {
  return combineLatest([
    this.products$,
    this.currentProductFilters$,
    this.currentCategory$
  ]).pipe(
    filter(([products]) => products.length > 0),
    map(([products, filters, currentCategory]) => {
      const {
        brands,
        strains,
        weights,
        sizes,
        effects,
        flavors,
        subtypes,
        generals,
        price,
        potency,
        sortMethod: { criterion, direction },
      } = filters;

      const isEmpty = (arr: any[]) => !arr || arr.length === 0;

      const filtered = products.filter((product) => {
        const {
          category,
          title,
          brand,
          strainType,
          weight,
          isDeal,
          thc,
          sale,
        } = product;

        // 🔍 SEARCH
        // 🔍 SEARCH (always applies)
        const matchesSearch =
          !searchQuery.trim() ||
          title.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        // DEALS = virtual category
        if (currentCategory === 'Deals' && !isDeal) {
          return false;
        }

        // REAL CATEGORIES
        if (currentCategory !== 'All' && currentCategory !== 'Deals') {
          if (product.category !== currentCategory) {
            return false;
          }
        }



        // 🌱 STRAINS
        const normalizedStrain = this.normalizeStrain(strainType);

        if (!isEmpty(strains) && !strains.includes(normalizedStrain)) {
          return false;
        }

        // 🏷 BRANDS
        if (!isEmpty(brands) && !brands.includes(brand)) {
          return false;
        }

        // ⚖️ WEIGHTS
        if (!isEmpty(weights) && weight && !weights.includes(weight)) {
          return false;
        }

        // 📏 SIZES (uom / unit / weight)
        const sizeValue =
          (product as any).uom || product.unit || product.weight;
        if (!isEmpty(sizes) && sizeValue && !sizes.includes(sizeValue)) {
          return false;
        }

        // 💊 ATTRIBUTES + ROOT ARRAYS
        const attrs = (product as any).attributes || {};

        const productEffects: string[] = [
          ...(attrs.effects || []),
          ...(product.effects || []),
        ];
        const productFlavors: string[] = [
          ...(attrs.flavors || []),
          ...(product.flavors || []),
        ];
        const productGenerals: string[] = [
          ...(attrs.general || []),
        ];

        // ✨ EFFECTS
        if (
          !isEmpty(effects) &&
          !productEffects.some((e) => effects.includes(e))
        ) {
          return false;
        }

        // 🍓 FLAVORS
        if (
          !isEmpty(flavors) &&
          !productFlavors.some((f) => flavors.includes(f))
        ) {
          return false;
        }

        // 🧬 SUBTYPES
        const subtype = (product as any).subtype;
        if (!isEmpty(subtypes) && subtype && !subtypes.includes(subtype)) {
          return false;
        }

        // 🧾 GENERALS
        if (
          !isEmpty(generals) &&
          !productGenerals.some((g) => generals.includes(g))
        ) {
          return false;
        }

        // 💵 PRICE RANGE (prefers sale price)
        const numericPrice =
          Number(sale?.discountedPrice ?? product.price) || 0;

        if (numericPrice < price.min || numericPrice > price.max) {
          return false;
        }


        // 🌡 THC POTENCY RANGE
        const thcIsPercent = typeof thc === 'string' && thc.includes('%');

        if (thcIsPercent) {
          const thcNumeric = this.extractThcPercent(thc);
          if (thcNumeric < potency.lower || thcNumeric > potency.upper) {
            return false;
          }
        }


        return true;
      });

      // 🔁 SORTING (keep your behavior, make it a bit more robust)
      const sorted = filtered.sort((a, b) => {
        const idA = Number((a as any).posProductId ?? a.id);
        const idB = Number((b as any).posProductId ?? b.id);
        const priceA = Number(a.sale?.discountedPrice ?? a.price);
        const priceB = Number(b.sale?.discountedPrice ?? b.price);
        const thcA = this.extractThcPercent(a.thc);
        const thcB = this.extractThcPercent(b.thc);
        const titleA = a.title || '';
        const titleB = b.title || '';

        switch (criterion) {
          case 'recent':
            return direction === 'ASC' ? idA - idB : idB - idA;

          case 'price':
            return direction === 'ASC' ? priceA - priceB : priceB - priceA;

          case 'thc':
            return direction === 'ASC' ? thcA - thcB : thcB - thcA;

          case 'alphabetical':
            return direction === 'ASC'
              ? titleA.localeCompare(titleB)
              : titleB.localeCompare(titleA);

          default:
            return 0;
        }
      });

      return sorted;
    })
  );
}

private normalizeStrain(strain: string | null | undefined): Strain {
  if (!strain) return 'NONE';

  const s = strain.toUpperCase().trim();

  // Exact matches first
  if (s === 'HYBRID') return 'HYBRID';
  if (s === 'INDICA') return 'INDICA';
  if (s === 'SATIVA') return 'SATIVA';
  if (s === 'CBD') return 'CBD';
  if (s === 'I/S') return 'I/S';
  if (s === 'S/I') return 'S/I';

  // Common Treez patterns:
  if (s.includes('INDICA') && s.includes('SATIVA')) return 'I/S';
  if (s.includes('SATIVA') && s.includes('INDICA')) return 'S/I';

  if (s.includes('INDICA')) return 'INDICA';
  if (s.includes('SATIVA')) return 'SATIVA';
  if (s.includes('HYBRID')) return 'HYBRID';

  // Fallback
  return 'NONE';
}


private extractThcPercent(thc: string | null | undefined): number {
  if (!thc) return 0;
  const match = String(thc).match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}


  
getProductFilterOptions(): Observable<ProductFilterOptions> {
  return combineLatest([this.products$, this.currentCategory$]).pipe(
    map(([products, currentCategory]) => {
      const options = {
        brands: new Set<string>(),
        weights: new Set<string>(),
        sizes: new Set<string>(),
        effects: new Set<string>(),
        flavors: new Set<string>(),
        subtypes: new Set<string>(),
        generals: new Set<string>()
      };

      products.forEach((product) => {
        // Respect current category for options
        if (
          currentCategory !== 'All' &&
          currentCategory !== 'Deals' &&
          product.category !== currentCategory
        ) {
          return;
        }

        if (currentCategory === 'Deals' && !product.isDeal) {
          return;
        }

        // BRAND
        if (product.brand) {
          options.brands.add(product.brand);
        }

        // WEIGHT
        if (product.weight) {
          options.weights.add(product.weight);
        }

        // SIZE (uom / unit)
        const sizeValue =
          (product as any).uom || product.unit || product.weight;
        if (sizeValue) {
          options.sizes.add(sizeValue);
        }

        // SUBTYPE
        if ((product as any).subtype) {
          options.subtypes.add((product as any).subtype);
        }

        // ATTRIBUTES
        const attrs = (product as any).attributes || {};

        // EFFECTS (attributes.effects OR product.effects)
        [
          ...(attrs.effects || []),
          ...(product.effects || []),
        ].forEach((e: string) => options.effects.add(e));

        // FLAVORS (attributes.flavors OR product.flavors)
        [
          ...(attrs.flavors || []),
          ...(product.flavors || []),
        ].forEach((f: string) => options.flavors.add(f));

        // GENERALS (attributes.general)
        (attrs.general || []).forEach((g: string) =>
          options.generals.add(g)
        );
      });

      const toFilterOptions = (set: Set<string>) =>
        Array.from(set).map((value) => ({
          label: value,
          value,
        }));

      return {
        brands: toFilterOptions(options.brands),
        weights: toFilterOptions(options.weights),
        sizes: toFilterOptions(options.sizes),
        effects: toFilterOptions(options.effects),
        flavors: toFilterOptions(options.flavors),
        subtypes: toFilterOptions(options.subtypes),
        generals: toFilterOptions(options.generals),
      };
    })
  );
}


  updateCategory(category: ProductCategory) {
    this.currentCategory.next(category); 
    this.route.navigateByUrl('/products');
  }

  getCurrentCategory(): ProductCategory {
    return this.currentCategory.value;
  }

  getCategories(): CategoryWithImage[] {
    return [
      { category: 'All', imageUrl: 'assets/icons/all.png' },
      { category: 'Deals', imageUrl: 'assets/icons/deals.png' },
      { category: 'Flower', imageUrl: 'assets/icons/flower.png' },
      { category: 'Pre-Roll', imageUrl: 'assets/icons/rolls.png' },
      { category: 'Vapes', imageUrl: 'assets/icons/vapes.png' },
      { category: 'Concentrates', imageUrl: 'assets/icons/extract.png' },
      { category: 'Edibles', imageUrl: 'assets/icons/edibles.png' },
      { category: 'Beverages', imageUrl: 'assets/icons/drinks.png' },
      { category: 'Tinctures', imageUrl: 'assets/icons/tinctures.png' },
      { category: 'Capsules', imageUrl: 'assets/icons/capsules.png' },
      { category: 'Topicals', imageUrl: 'assets/icons/topicals.png' },
      { category: 'Accessory', imageUrl: 'assets/icons/accessories.png' }
    ];
  }


  getSimilarItems(): Observable<Product[]> {
    return combineLatest([this.currentProduct$, this.products$]).pipe(
      map(([currentProduct, productArray]) => {
  
        if (!currentProduct || !currentProduct.category || !currentProduct.brand) {
          return []; 
        }
  
        const { category, brand } = currentProduct;

        const filteredProducts = productArray.filter((product) => 
          product.category === category && product.brand === brand && product.id != currentProduct.id
        );
  
        return filteredProducts.slice(0, 5);
      })
    );
  }
/** 
 * SIMILAR ITEMS — same category + similar price 
 */
getSimilarItemsByCategoryAndPrice(): Observable<Product[]> {
  return combineLatest([this.currentProduct$, this.products$]).pipe(
    map(([current, products]) => {
      if (!current) return [];

      const price = Number(current.price);
      const low = price * 0.8;
      const high = price * 1.2;

      return products
        .filter(p =>
          p.id !== current.id &&
          p.category === current.category &&
          p.brand !== current.brand &&          // 🚀 NEW: exclude same brand
          Number(p.price) >= low &&
          Number(p.price) <= high
        )
        .slice(0, 6);
    })
  );
}



getMoreFromBrand(excludedIds: string[] = []): Observable<Product[]> {
  return combineLatest([this.currentProduct$, this.products$]).pipe(
    map(([current, products]) => {
      if (!current) return [];

      return products
        .filter(p =>
          p.id !== current.id &&
          p.brand === current.brand &&
          !excludedIds.includes(p.id)  // 🔥 EXCLUDE DUPES
        )
        .slice(0, 6);
    })
  );
}



  updateCurrentProduct(product: Product) {
    this.currentProduct.next(product);
    this.updateCategory(product.category as ProductCategory);
    console.log(product);
    this.route.navigateByUrl('/product-display');
  }

  getCurrentProduct(): Product | null {
    return this.currentProduct.value;
  }


  updateProductFilters(filters: ProductFilters) {
    this.currentProductFilters.next({ ...filters }); 
  }

  getProductsByIds(ids: string[]): Observable<Product[]> {
    return this.products$.pipe(
      map((productArray) =>
        productArray.filter((product) => ids.includes(product.id))
      )
    );
  }
  


}
