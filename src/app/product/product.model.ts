import { ProductCategory } from "../product-category/product-category.model";

export type Strain = 'HYBRID' | 'INDICA' | 'SATIVA' | 'CBD' | 'I/S' | 'S/I' | 'NONE';

export interface ProductAttributes {
  general?: string[];
  flavors?: string[];
  effects?: string[];
}

export interface ProductDiscountCondition {
  type: string;     // "Schedule", "Fulfillment Type", etc.
  value: string;
}

export interface ProductDiscount {
  id: string;
  title: string;
  amount: number;
  method: 'PERCENT' | 'DOLLAR' | string;
  stackable: boolean;
  conditions?: ProductDiscountCondition[];
}

export type Product = {
  [key: string]: any;

  /** EXISTING FIELDS YOU ALREADY USE */
  id: string;
  category: ProductCategory;
  masterCategory?: string;
  title: string;
  desc: string;          // your system uses desc
  brand: string;
  strainType: Strain;
  thc: string;
  thcMG: string;
  cbd: string;
  weight: string;
  price: string;
  image: string;
  quantity: number;
  unit: string;

  sale?: {
    discountId: number;
    discountName: string;
    discountValue: number;     // percentage (e.g. 0.3)
    discountedPrice: number;
    menuDisplay?: any;
  };

  isDeal?: boolean;
  isFeatured?: boolean;

  /** ---- NEW TREEZ-BASED OPTIONAL FIELDS ---- */

  /** Treez uses this field - longer detailed description */
  description?: string;

  /** Strain subtype (INFUSED, LIQUID DIAMONDS, etc.) */
  subtype?: string;

  /** Unit of measure (GRAMS, EACH, ML, etc.) */
  uom?: string;

  /** Full gallery of images */
  gallery?: string[];

  /** Unified attribute model from Treez */
  attributes?: ProductAttributes;

  /** Direct flattened values (Treez sometimes duplicates them) */
  effects?: string[];
  flavors?: string[];

  /** Full discount objects from API */
  discounts?: ProductDiscount[];

  /** Active / threshold flags */
  active?: boolean;
  aboveThreshold?: boolean;

  /** Back-office timestamp */
  updatedAt?: string;
};
