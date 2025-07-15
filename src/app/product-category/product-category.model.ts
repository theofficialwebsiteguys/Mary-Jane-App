export type ProductCategory =
  | 'Flower'
  | 'Pre-Roll'
  | 'Vape'
  | 'Concentrate'
  | 'Beverages'
  | 'Tincture'
  | 'Orals'
  | 'Edibles'
  | 'Topical'
  | 'Accessories';
  // | 'Apparel';


  export interface CategoryWithImage {
    category: ProductCategory;
    imageUrl: string;
  }