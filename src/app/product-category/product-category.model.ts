export type ProductCategory =
  | 'Flower'
  | 'Pre-Roll'
  | 'Vape'
  | 'Concentrates'
  | 'Beverages'
  | 'Tinctures'
  | 'Vapes'
  | 'CBD'
  | 'Edibles'
  | 'Topicals'
  | 'Accessories'
  | 'Apparel';


  export interface CategoryWithImage {
    category: ProductCategory;
    imageUrl: string;
  }