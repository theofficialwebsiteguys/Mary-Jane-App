import { ProductCategory } from "../product-category/product-category.model";

export type Strain = 'HYBRID' | 'INDICA' | 'SATIVA';

export type Product = {
  [key: string]: any;
  id: string;
  category: ProductCategory; // .cannabisComplianceType OR .cannabisType
  title: string; // .name
  desc: string; // .description
  brand: string;  //.brand.name
  strainType: Strain; //.cannabisStrain
  thc: string; // .description first line - may or may not be there
  cbd: string; // .description first line - may or may not be there
  weight: string; // .weight
  price: string; // .price
  image: string;  // either .image OR .images[0]
  quantity: number;
  unit: string;
};
