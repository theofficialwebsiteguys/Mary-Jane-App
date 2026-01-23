import { Component, OnInit, ViewChild } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { Observable } from 'rxjs';
import { ProductsService } from '../products.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
})
export class ProductsPage implements OnInit {
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  searchQuery: string = '';

  hasActiveFilters$: Observable<boolean>;

  constructor(private productsService: ProductsService) {
    this.hasActiveFilters$ = this.productsService.hasActiveFilters$;
  }

  ngOnInit() {}

  ionViewDidEnter(): void {
    // this.scrollToTop(); // Scroll to top when the page is fully loaded
  }

  scrollToTop() {
    if (this.content) {
      this.content.scrollToTop(300); // Smooth scrolling with animation
    } else {
      console.warn('IonContent is not available.');
    }
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value.trim().toLowerCase();
  }

  get hasSearch(): boolean {
    return !!this.searchQuery?.length;
  }

  clearSearch() {
    this.searchQuery = '';
  }

  clearAll() {
    this.productsService.clearAllFilters();
    this.clearSearch();
  }
}
