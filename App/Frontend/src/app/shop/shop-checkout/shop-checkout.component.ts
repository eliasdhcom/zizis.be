/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ShopService, CartItem, Product } from '../shop.service';
import { LanguageService } from '../../services/language.service';
import { SharedModule } from '../../shared/shared.module';

declare var Stripe: any;

@Component({
    selector: 'app-shop-checkout',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, TranslateModule, TranslatePipe, SharedModule],
    templateUrl: './shop-checkout.component.html',
    styleUrls: ['./shop-checkout.component.css']
})

export class ShopCheckoutComponent implements OnInit {
    private shopService = inject(ShopService);
    router = inject(Router);
    private route = inject(ActivatedRoute);
    private languageService = inject(LanguageService);
    private translateService = inject(TranslateService);

    cartItems: CartItem[] = [];
    products: Product[] = [];
    cartProducts: any[] = [];
    cartTotal = 0;

    customerFirstName = '';
    customerLastName = '';
    customerEmail = '';
    customerPhone = '';
    customerAddress = '';
    agreeToPrivacy = false;
    agreeToLegal = false;

    loading = false;
    processing = false;
    error: string | null = null;
    success = false;
    paymentStatus = '';

    ngOnInit() {
        this.languageService.checkAndSetLanguage();

        const cart = this.shopService.getCart();
        if (!cart || cart.length === 0) {
            this.router.navigate(['/shop']);
            return;
        }

        this.loadCart();
        this.checkPaymentStatus();
    }

    loadCart() {
        this.cartItems = this.shopService.getCart();

        if (this.cartItems.length === 0) {
            this.router.navigate(['/shop']);
            return;
        }

        this.loading = true;
        this.shopService.getProducts().subscribe({
            next: (response) => {
                if (response.success) {
                    this.products = response.products;
                    this.calculateCartTotal();
                }
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading products:', err);
                this.error = 'SHOP.ERROR';
                this.loading = false;
            }
        });
    }

    calculateCartTotal() {
        this.cartProducts = this.cartItems.map(cartItem => {
            const product = this.products.find(p => p.id === cartItem.id);
            return {
                id: cartItem.id,
                name: product?.name || 'Unknown',
                price: product?.price || 0,
                quantity: cartItem.quantity,
                subtotal: (product?.price || 0) * cartItem.quantity
            };
        }).filter(item => item.price > 0);

        this.cartTotal = this.cartProducts.reduce((sum, item) => sum + item.subtotal, 0);
    }

    removeFromCart(productId: number) {
        this.shopService.removeFromCart(productId);
        this.loadCart();
    }

    async checkout() {
        if (!this.customerFirstName || !this.customerLastName || !this.customerEmail || !this.customerPhone) {
            this.error = 'SHOP.ERROR';
            return;
        }

        if (!this.agreeToPrivacy || !this.agreeToLegal) {
            this.error = 'SHOP.ERROR';
            return;
        }

        if (this.cartProducts.length === 0) {
            this.error = 'SHOP.NO_PRODUCTS';
            return;
        }

        const totalItems = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
        if (totalItems > 10) {
            this.error = this.translateService.instant('SHOP.MAX_CART_ERROR');
            return;
        }

        this.processing = true;
        this.error = null;

        const checkoutData = {
            items: this.cartItems,
            customerName: (this.customerFirstName + ' ' + this.customerLastName).trim(),
            customerEmail: this.customerEmail.trim(),
            customerPhone: this.customerPhone.trim(),
            customerAddress: this.customerAddress.trim()
        };

        this.shopService.createCheckout(checkoutData).subscribe({
            next: (response) => {
                if (response.success && response.checkoutUrl) window.location.href = response.checkoutUrl;
                else {
                    this.error = 'SHOP.ERROR';
                    this.processing = false;
                }
            },
            error: (err) => {
                console.error('Checkout error:', err);
                this.error = 'SHOP.ERROR';
                this.processing = false;
            }
        });
    }

    checkPaymentStatus() {
        this.route.queryParams.subscribe(params => {
            const status = params['status'];
            const sessionId = params['session_id'];

            if (status === 'success' && sessionId) this.verifyPayment(sessionId);
            else if (status === 'cancelled') this.paymentStatus = 'cancelled';
        });
    }

    verifyPayment(sessionId: string) {
        this.processing = true;

        this.shopService.verifyPayment(sessionId).subscribe({
            next: (response) => {
                if (response.success) {
                    this.success = true;
                    this.paymentStatus = 'success';
                    this.shopService.clearCart();
                    this.cartItems = [];
                    this.cartProducts = [];
                    this.cartTotal = 0;
                } else {
                    this.paymentStatus = 'failed';
                    this.error = 'SHOP.ERROR';
                }
                this.processing = false;
            },
            error: (err) => {
                console.error('Payment verification error:', err);
                this.paymentStatus = 'failed';
                this.error = 'SHOP.ERROR';
                this.processing = false;
            }
        });
    }

    continueShopping() {
        this.router.navigate(['/shop']);
    }

    getProductImage(productId: number): string {
        const product = this.products.find(p => p.id === productId);
        return product?.image || '/assets/media/images/placeholder.png';
    }

    clearForm() {
        this.customerFirstName = '';
        this.customerLastName = '';
        this.customerEmail = '';
        this.customerPhone = '';
        this.customerAddress = '';
        this.agreeToPrivacy = false;
        this.agreeToLegal = false;
        this.error = null;
    }
}