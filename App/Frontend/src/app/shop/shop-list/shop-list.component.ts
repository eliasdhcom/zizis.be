/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { ShopService, Product } from '../shop.service';
import { LanguageService } from '../../services/language.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
    selector: 'app-shop-list',
    standalone: true,
    imports: [CommonModule, RouterModule, TranslateModule, TranslatePipe, SharedModule],
    templateUrl: './shop-list.component.html',
    styleUrls: ['./shop-list.component.css']
})

export class ShopListComponent implements OnInit {
    private shopService = inject(ShopService);
    private languageService = inject(LanguageService);

    products: Product[] = [];
    loading = true;
    error: string | null = null;

    ngOnInit() {
        this.languageService.checkAndSetLanguage();
        this.loadProducts();
    }

    loadProducts() {
        this.loading = true;
        this.error = null;

        this.shopService.getProducts().subscribe({
            next: (response) => {
                if (response.success) {
                    this.products = response.products;
                    this.sortProducts();
                }
                else this.error = 'SHOP.ERROR';
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading products:', err);
                this.error = 'SHOP.ERROR';
                this.loading = false;
            }
        });
    }

    sortProducts() {
        this.products.sort((a, b) => {
            if (a.available !== b.available) return a.available ? -1 : 1;
            return a.id - b.id;
        });
    }
}