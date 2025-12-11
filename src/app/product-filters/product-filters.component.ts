import { Component, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { map, Observable, of } from 'rxjs';

import { ProductsService } from '../products.service';

import {
  DEFAULT_PRODUCT_FILTERS,
  OPTIONS_CRITERIA,
  OPTIONS_DIRECTIONS,
  OPTIONS_STRAINS,
  ProductFilters,
  CriteriaOptions,
  DirectionOptions,
  StrainOptions,
  ProductFilterOptions,
  COMBINED_SORT_OPTIONS,
  MultiSelectFilterField
} from './product-filters.model';

import { AccessibilityService } from '../accessibility.service';

type CollapsibleKey = 'sizes' | 'effects' | 'flavors' | 'subtypes' | 'generals';

@Component({
  selector: 'app-product-filters',
  templateUrl: './product-filters.component.html',
  styleUrls: ['./product-filters.component.scss'],
})
export class ProductFiltersComponent implements OnInit {
  constructor(
    private productService: ProductsService,
    private accessibilityService: AccessibilityService
  ) {
    addIcons({ close });
  }

  isModalOpen = false;
  filters: ProductFilters = JSON.parse(JSON.stringify(DEFAULT_PRODUCT_FILTERS));
  hasDirtyFilters = false;

  criteriaOptions: CriteriaOptions = OPTIONS_CRITERIA;
  directionOptions: DirectionOptions = OPTIONS_DIRECTIONS;
  strainOptions: StrainOptions = OPTIONS_STRAINS;

  dynamicFilterOptions$: Observable<ProductFilterOptions> = of({
    brands: [],
    weights: [],
    sizes: [],
    effects: [],
    flavors: [],
    subtypes: [],
    generals: []
  });

  combinedSortOptions = COMBINED_SORT_OPTIONS;

  previewCount = 8;
  showAllBrands = false;
  brandSearchTerm = '';

  collapsed: Record<CollapsibleKey, boolean> = {
    sizes: true,
    effects: true,
    flavors: true,
    subtypes: true,
    generals: true
  };

  collapsibleSections = [
    { key: 'sizes' as CollapsibleKey, label: 'Sizes' },
    { key: 'effects' as CollapsibleKey, label: 'Effects' },
    { key: 'flavors' as CollapsibleKey, label: 'Flavors' },
    { key: 'subtypes' as CollapsibleKey, label: 'SubTypes' },
    { key: 'generals' as CollapsibleKey, label: 'Generals' }
  ];

  searchableSections: CollapsibleKey[] = [
    'sizes',
    'effects',
    'flavors',
    'subtypes',
    'generals'
  ];

  searchTerms: Partial<Record<CollapsibleKey, string>> = {};


  toggleCollapse(key: CollapsibleKey) {
    this.collapsed[key] = !this.collapsed[key];
  }

  ngOnInit() {
    this.productService.products$.subscribe(() => {
      this.dynamicFilterOptions$ = this.productService
        .getProductFilterOptions()
        .pipe(
          map((options) => ({
            ...options,
            brands: [...options.brands].sort((a, b) =>
              a.label.localeCompare(b.label)
            )
          }))
        );
        console.log(this.dynamicFilterOptions$)
    });
  }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
    this.accessibilityService.announce(
      `Sort and filter options ${isOpen ? 'opened' : 'closed'}.`,
      'polite'
    );
  }

  handleFilterUpdate() {
    this.hasDirtyFilters =
      JSON.stringify(this.filters) !== JSON.stringify(DEFAULT_PRODUCT_FILTERS);

    this.productService.updateProductFilters(this.filters);
    this.accessibilityService.announce('Filters have been updated.', 'polite');
  }

  clearFilters() {
    this.filters = JSON.parse(JSON.stringify(DEFAULT_PRODUCT_FILTERS));
    this.brandSearchTerm = '';
    this.showAllBrands = false;
    this.handleFilterUpdate();
    this.accessibilityService.announce('All filters cleared.', 'polite');
  }

  isChecked(array: any[], value: string): boolean {
    return array.includes(value);
  }

  handleCheckField(
    isChecked: boolean,
    value: string,
    field: MultiSelectFilterField
  ) {
    if (!isChecked) {
      this.filters[field] = this.filters[field].filter(v => v !== value);
      this.accessibilityService.announce(`${value} removed.`, 'polite');
      this.handleFilterUpdate();
      return;
    }

    if (!this.isChecked(this.filters[field], value)) {
      this.filters[field].push(value);
      this.accessibilityService.announce(`${value} added.`, 'polite');
    }

    this.handleFilterUpdate();
  }

  toggleShowAllBrands() {
    this.showAllBrands = !this.showAllBrands;
    this.accessibilityService.announce(
      this.showAllBrands ? 'Showing all brands.' : 'Showing fewer brands.',
      'polite'
    );
  }

  getVisibleBrands(brands: any[]): any[] {
    if (!brands) return [];

    let result = brands;

    if (this.brandSearchTerm.trim()) {
      const term = this.brandSearchTerm.toLowerCase();
      result = result.filter((b: any) =>
        b.label.toLowerCase().includes(term)
      );
    }

    return this.showAllBrands
      ? result
      : result.slice(0, this.previewCount);
  }

  updatePotencyRange(ev: any) {
    const val = ev.detail.value;
    this.filters.potency.lower = val.lower;
    this.filters.potency.upper = val.upper;
    this.handleFilterUpdate();
  }

  updatePriceRange(ev: any) {
    const val = ev.detail.value;
    this.filters.price.min = val.lower;
    this.filters.price.max = val.upper;
    this.handleFilterUpdate();
  }

  getFilteredOptions(
    options: { label: string; value: string }[],
    key: CollapsibleKey
  ) {
    if (!options) return [];

    const term = this.searchTerms[key]?.toLowerCase().trim();
    if (!term) return options;

    return options.filter(opt =>
      opt.label.toLowerCase().includes(term)
    );
  }


}
