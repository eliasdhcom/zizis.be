/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ShopService, Product } from '../shop.service';
import { LanguageService } from '../../services/language.service';
import { SeoService } from '../../services/seo.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
    selector: 'app-shop-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, TranslateModule, TranslatePipe, SharedModule],
    templateUrl: './shop-detail.component.html',
    styleUrls: ['./shop-detail.component.css']
})

export class ShopDetailComponent implements OnInit, OnDestroy {
    private shopService = inject(ShopService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private languageService = inject(LanguageService);
    private translateService = inject(TranslateService);
    private seoService = inject(SeoService);

    product: Product | null = null;
    loading = true;
    error: string | null = null;
    quantity: number = 1;
    addedToCart = false;
    cartWarning: string | null = null;
    private readonly MAX_PER_PRODUCT = 5;
    private readonly MAX_TOTAL_ITEMS = 10;

    ngOnInit() {
        this.languageService.checkAndSetLanguage();
        this.route.params.subscribe(params => {
            const id = parseInt(params['id']);
            this.loadProduct(id);
        });
    }

    ngOnDestroy() {
        this.seoService.resetMeta();
    }

    loadProduct(id: number) {
        this.loading = true;
        this.error = null;

        this.shopService.getProduct(id).subscribe({
            next: (response) => {
                if (response.success) {
                    this.product = response.product;
                    this.updateSeoTags();
                } else {
                    this.error = 'SHOP.ERROR';
                }
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading product:', err);
                this.error = 'SHOP.ERROR';
                this.loading = false;
            }
        });
    }

    private updateSeoTags() {
        if (!this.product) return;

        const productUrl = `https://zizis.be/shop/product/${this.product.id}`;
        const imageUrl = this.product.image?.startsWith('http') 
            ? this.product.image 
            : `https://zizis.be${this.product.image}`;

        this.seoService.updateMeta({
            title: `${this.product.name} - Zizis Hair Products`,
            description: this.product.description?.substring(0, 155) || `${this.product.name} - Hair products from Zizis`,
            image: imageUrl,
            url: productUrl,
            type: 'product',
            canonical: productUrl,
            keywords: `${this.product.name}, hair products, Zizis, Boechout, professional`,
            ogTitle: `${this.product.name} - Zizis`,
            ogDescription: this.product.description?.substring(0, 155),
            structuredData: {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": this.product.name,
                "description": this.product.description,
                "image": imageUrl,
                "brand": {
                    "@type": "Brand",
                    "name": "Zizis"
                },
                "offers": {
                    "@type": "Offer",
                    "price": this.product.price,
                    "priceCurrency": "EUR",
                    "availability": this.product.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                    "url": productUrl
                }
            }
        });
    }

    addToCart() {
        if (!this.product || this.quantity <= 0) return;

        this.cartWarning = null;

        const cart = this.shopService.getCart();
        const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const currentProductQuantity = cart.find(i => i.id === this.product!.id)?.quantity || 0;

        if (currentProductQuantity + this.quantity > this.MAX_PER_PRODUCT) {
            this.cartWarning = this.translateService.instant('SHOP.MAX_PER_PRODUCT');
            return;
        }

        if (totalCartItems + this.quantity > this.MAX_TOTAL_ITEMS) {
            this.cartWarning = this.translateService.instant('SHOP.MAX_TOTAL_ITEMS', { count: totalCartItems });
            return;
        }

        this.shopService.addToCart(this.product.id, this.quantity);
        this.addedToCart = true;
        this.quantity = 1;

        setTimeout(() => {
            this.addedToCart = false;
        }, 2000);
    }

    goToCheckout() {
        const cart = this.shopService.getCart();
        if (!cart || cart.length === 0) {
            this.cartWarning = this.translateService.instant('SHOP.NO_PRODUCTS');
            return;
        }
        this.router.navigate(['/shop/checkout']);
    }

    goBack() {
        this.router.navigate(['/shop']);
    }

    getMaxQuantity(): number {
        if (!this.product) return 0;
        const cart = this.shopService.getCart();
        const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const currentProductQuantity = cart.find(i => i.id === this.product!.id)?.quantity || 0;
        const maxPerProduct = this.MAX_PER_PRODUCT - currentProductQuantity;
        const maxTotal = this.MAX_TOTAL_ITEMS - totalCartItems;
        return Math.min(maxPerProduct, maxTotal);
    }
}