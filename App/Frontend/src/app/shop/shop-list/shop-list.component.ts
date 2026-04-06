/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { ShopService, Product } from '../shop.service';
import { LanguageService } from '../../services/language.service';
import { SeoService } from '../../services/seo.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
    selector: 'app-shop-list',
    standalone: true,
    imports: [CommonModule, RouterModule, TranslateModule, TranslatePipe, SharedModule],
    templateUrl: './shop-list.component.html',
    styleUrls: ['./shop-list.component.css']
})

export class ShopListComponent implements OnInit, OnDestroy {
    private shopService = inject(ShopService);
    private languageService = inject(LanguageService);
    private seoService = inject(SeoService);

    products: Product[] = [];
    loading = true;
    error: string | null = null;

    ngOnInit() {
        this.languageService.checkAndSetLanguage();
        this.updateSeoTags();
        this.loadProducts();
    }

    ngOnDestroy() {
        this.seoService.resetMeta();
    }

    private updateSeoTags() {
        this.seoService.updateMeta({
            title: 'Zizis Shop - Professional Hair Products',
            description: 'Discover our selection of professional hair products and styling tools. Quality and expertise for hairdressers and enthusiasts.',
            image: 'https://zizis.be/assets/media/images/icon-512x512.png',
            url: 'https://zizis.be/shop',
            type: 'website',
            canonical: 'https://zizis.be/shop',
            keywords: 'hair products, Zizis, professional, shop, Boechout',
            ogTitle: 'Zizis Shop - Professional Hair Products',
            ogDescription: 'Discover our selection of hair products and styling tools',
            structuredData: {
                "@context": "https://schema.org",
                "@type": "CollectionPage",
                "name": "Zizis Shop",
                "description": "Professional hair products and styling tools",
                "url": "https://zizis.be/shop",
                "image": "https://zizis.be/assets/media/images/icon-512x512.png",
                "publisher": {
                    "@type": "Organization",
                    "name": "Zizis",
                    "url": "https://zizis.be"
                }
            }
        });
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