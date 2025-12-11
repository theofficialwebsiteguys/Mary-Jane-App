export type ProductCategory =
  | 'All'
  | 'Deals'
  | 'Flower'
  | 'Pre-Roll'
  | 'Vapes'
  | 'Concentrates'
  | 'Edibles'
  | 'Beverages'
  | 'Tinctures'
  | 'Topicals'
  | 'Capsules'
  | 'Accessory';


  export interface CategoryWithImage {
    category: ProductCategory;
    imageUrl: string;
  }