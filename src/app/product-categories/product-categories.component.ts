import { AfterViewInit, Component, OnInit } from '@angular/core';

import { ProductsService } from '../products.service';

import { CategoryWithImage } from '../product-category/product-category.model';

@Component({
  selector: 'app-product-categories',
  templateUrl: './product-categories.component.html',
  styleUrls: ['./product-categories.component.scss'],
})
export class ProductCategoriesComponent implements OnInit, AfterViewInit {
  showLeftArrow = false;
  showRightArrow = false;

  notScrolled = true;

  constructor(private productService: ProductsService) {}

  categories: CategoryWithImage[] = [];

  ngOnInit() {
    this.categories = this.productService.getCategories();
  }

  ngAfterViewInit() {
    // Check initial state after rendering
    const el = document.querySelector('.categories') as HTMLElement;
    if (el) {
      this.updateArrows(el);
    }
  }

  onScroll(event: Event) {
    this.notScrolled = false;
    const target = event.target as HTMLElement;
    this.updateArrows(target);
  }

  private updateArrows(target: HTMLElement) {
    const atStart = target.scrollLeft <= 5;
    const atEnd = target.scrollLeft + target.clientWidth >= target.scrollWidth - 5;

    this.showLeftArrow = !atStart;
    this.showRightArrow = this.notScrolled ? true : !atEnd;
  }
}
