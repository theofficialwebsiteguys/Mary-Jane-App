import { Strain } from '../product/product.model';

//
// SORT TYPES
//

export type SortCriterion = 'recent' | 'price' | 'thc' | 'alphabetical';
export type SortDirection = 'ASC' | 'DESC';

export interface SortMethod {
  criterion: SortCriterion;
  direction: SortDirection;
}

//
// OPTION TYPES
//

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export type CriteriaOptions = { label: string; value: SortCriterion }[];
export type DirectionOptions = { label: string; value: SortDirection }[];

export interface StrainOption {
  label: string;
  value: Strain;
}

export type StrainOptions = StrainOption[];

//
// FILTER FIELDS
//

export type ProductFilterField =
  | 'strains'
  | 'brands'
  | 'weights'
  | 'price'
  | 'potency'
  | 'sizes'
  | 'effects'
  | 'flavors'
  | 'subtypes'
  | 'generals';

export type MultiSelectFilterField =
  | 'strains'
  | 'brands'
  | 'weights'
  | 'sizes'
  | 'effects'
  | 'flavors'
  | 'subtypes'
  | 'generals';

//
// FILTER STRUCTURES
//

export interface RangeFilter {
  min: number;
  max: number;
}

export interface PotencyRange {
  lower: number;
  upper: number;
}

export interface ProductFilters {
  strains: string[];
  brands: string[];
  weights: string[];
  sizes: string[];
  effects: string[];
  flavors: string[];
  subtypes: string[];
  generals: string[];
  price: RangeFilter;
  potency: PotencyRange;
  sortMethod: SortMethod;
}

//
// FILTER OPTIONS PAYLOAD
//

export interface ProductFilterOptions {
  brands: FilterOption[];
  weights: FilterOption[];
  sizes: FilterOption[];
  effects: FilterOption[];
  flavors: FilterOption[];
  subtypes: FilterOption[];
  generals: FilterOption[];
}

//
// DEFAULT FILTER STATE
//

export const DEFAULT_PRODUCT_FILTERS: ProductFilters = {
  strains: [],
  brands: [],
  weights: [],
  sizes: [],
  effects: [],
  flavors: [],
  subtypes: [],
  generals: [],
  price: { min: 0, max: 450 },
  potency: { lower: 0, upper: 100 },
  sortMethod: { criterion: 'recent', direction: 'DESC' }
};

//
// UI STATIC OPTIONS
//

export const OPTIONS_STRAINS: StrainOptions = [
  { label: 'Hybrid', value: 'HYBRID' },
  { label: 'Indica', value: 'INDICA' },
  { label: 'Sativa', value: 'SATIVA' },
  { label: 'CBD', value: 'CBD' },
  { label: 'Indica/Sativa', value: 'I/S' },
  { label: 'Sativa/Indica', value: 'S/I' },
  { label: 'None', value: 'NONE' }
];

export const OPTIONS_CRITERIA: CriteriaOptions = [
  { label: 'Recently Added', value: 'recent' },
  { label: 'Price', value: 'price' },
  { label: 'THC', value: 'thc' },
  { label: 'A-Z', value: 'alphabetical' }
];

export const OPTIONS_DIRECTIONS: DirectionOptions = [
  { label: 'High to Low', value: 'DESC' },
  { label: 'Low to High', value: 'ASC' }
];

export const COMBINED_SORT_OPTIONS = [
  { label: 'Price — Low to High', value: { criterion: 'price', direction: 'ASC' } },
  { label: 'Price — High to Low', value: { criterion: 'price', direction: 'DESC' } },

  { label: 'THC — Low to High', value: { criterion: 'thc', direction: 'ASC' } },
  { label: 'THC — High to Low', value: { criterion: 'thc', direction: 'DESC' } },

  { label: 'A → Z', value: { criterion: 'alphabetical', direction: 'ASC' } },
  { label: 'Z → A', value: { criterion: 'alphabetical', direction: 'DESC' } }
];
