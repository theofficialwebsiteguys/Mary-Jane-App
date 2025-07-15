import { Injectable } from '@angular/core';
import { Product } from './product/product.model';
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

  private currentCategory = new BehaviorSubject<ProductCategory>('Flower');
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

 fetchProducts(): Observable<Product[]> {
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
    url: `${environment.apiUrl}/dutchie/inventory`,
    headers: {
      'Content-Type': 'application/json',
      'x-auth-api-key': environment.db_api_key,
    },
  };

  return new Observable<Product[]>((observer) => {
    CapacitorHttp.get(options)
      .then((response) => {
        if (response.status === 200) {
          const sortedProducts = this.sortProducts(response.data.products);
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
    return this.products$.pipe(
      filter((productArray) => productArray.length > 0),
      map((productArray) => {
        const {
          sortMethod: { criterion, direction },
        } = this.currentProductFilters.getValue();

  
        return productArray
          .filter(({ category, title, brand, strainType, weight, thc }) => {
            const {
              brands,
              strains,
              weights,
              potency: { thc: thcRange },
            } = this.currentProductFilters.getValue();
  
            const isEmpty = (arr: any) => {
              return arr.length < 1;
            };
  
            const isInRange = (value: number, range: PotencyRange): boolean => {
              const { lower, upper } = range;
              return value >= lower && value <= upper;
            };
  
            // Default THC to 100 if null or undefined
            const defaultThc = thc ?? '100% THC';

            const isMatchingSearch = searchQuery.trim() === '' || title.toLowerCase().includes(searchQuery.toLowerCase());

            const isMatchingCategory =
                searchQuery.trim() !== '' || category === this.currentCategory.value;
  
            return (
              isMatchingSearch && 
              isMatchingCategory &&
              (isEmpty(brands) || brands.includes(brand)) &&
              (!strainType ||
                isEmpty(strains) ||
                strains.some((s) =>
                  strainType.toUpperCase().split(' ').includes(s)
                )) &&
              (!weight || isEmpty(weights) || weights.includes(weight)) 
              // (!defaultThc || isInRange(Number(defaultThc.split('%')[0]), thcRange))
            );
          })
          .sort(
            (
              { posProductId: posProductIdA, price: priceA, thc: thcA, title: titleA },
              { posProductId: posProductIdB, price: priceB, thc: thcB, title: titleB }
            ) => {
              let result = 0;
  
              // Default THC to 100 if null or undefined for sorting
              const defaultThcA = thcA ?? '100';
              const defaultThcB = thcB ?? '100';
  
              switch (criterion) {
                case 'RECENT': {
                  if (direction === 'ASC') result = Number(posProductIdA) - Number(posProductIdB);
                  else if (direction === 'DESC') result = Number(posProductIdB) - Number(posProductIdA);
                
                  break;
                }
                case 'PRICE': {
                  if (direction === 'ASC')
                    result = Number(priceA) - Number(priceB);
                  else if (direction === 'DESC')
                    result = Number(priceB) - Number(priceA);
                  break;
                }
                case 'THC': {
                  // Extract THC percentage, ensuring null/undefined default to 100
                  const extractThcValue = (thc: string | null | undefined): number => {
                    return thc ? Number(thc.replace('% THC', '')) : 0;
                  };
                
                  const thcValueA = extractThcValue(thcA);
                  const thcValueB = extractThcValue(thcB);
                
                  if (direction === 'ASC') result = thcValueA - thcValueB;
                  else if (direction === 'DESC') result = thcValueB - thcValueA;
                
                  break;
                } 
                case 'ALPHABETICAL': {
                  if (direction === 'ASC')
                    result = titleA.localeCompare(titleB);
                  else if (direction === 'DESC')
                    result = titleB.localeCompare(titleA);
                  break;
                }
                default: {
                  break;
                }
              }
  
              return result;
            }
          );
      }),
      tap((filteredProducts) => console.log('🟢 Filtered Products:', filteredProducts)),
      filter((filteredProducts) => filteredProducts.length > 0) // ✅ Ensure it only emits if there are filtered products
    );
  }
  
  

  getProductFilterOptions(): Observable<ProductFilterOptions> {
    return this.products$.pipe(
      map((productArray) => {
        const fields = ['brand', 'weight'];

        let options: { [key: string]: any } = {};
        options = fields.reduce((acc, field) => {
          acc[`${field}s`] = new Set();
          return acc;
        }, options);

        productArray.forEach((product) => {
          if (product.category === this.currentCategory.value) { // Filter by currentCategory
            fields.forEach((field) => {
              if (!!product[field]) {
                options[`${field}s`].add(product[field]);
              }
            });
          }
        });

        let result: ProductFilterOptions = { brands: [], weights: [] };
        result = fields.reduce((acc, field) => {
          acc[`${field}s`] = Array.from(options[`${field}s`]).map((o) => ({
            label: o,
            value: o,
          }));
          return acc;
        }, result);

        return result;
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
      { category: 'Flower', imageUrl: 'assets/icons/flower.png' },
      { category: 'Pre-Roll', imageUrl: 'assets/icons/prerolls.png' },
      { category: 'Edibles', imageUrl: 'assets/icons/edibles.png' },
      { category: 'Concentrate', imageUrl: 'assets/icons/concentrates.png' },
      { category: 'Beverages', imageUrl: 'assets/icons/beverages.png' },
      { category: 'Tincture', imageUrl: 'assets/icons/tinctures.png' },
      { category: 'Orals', imageUrl: 'assets/icons/orals.png' },
      { category: 'Topical', imageUrl: 'assets/icons/topicals.png' },
      { category: 'Accessories', imageUrl: 'assets/icons/accessories.png' },
      // { category: 'Apparel', imageUrl: 'assets/icons/apparel.png' },
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


  updateCurrentProduct(product: Product) {
    this.currentProduct.next(product);
    this.updateCategory(product.category)
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
