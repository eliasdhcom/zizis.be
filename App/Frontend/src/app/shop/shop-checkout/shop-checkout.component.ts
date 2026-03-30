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

    touched = {
        firstName: false,
        lastName: false,
        email: false,
        phone: false,
        privacy: false,
        legal: false
    };

    fieldErrors = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        privacy: '',
        legal: ''
    };

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

    isValidFirstName(): boolean {
        return this.customerFirstName.trim().length >= 2;
    }

    isValidLastName(): boolean {
        return this.customerLastName.trim().length >= 2;
    }

    isValidEmail(): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(this.customerEmail.trim());
    }

    isValidPhone(): boolean {
        const phone = this.customerPhone.trim().replace(/\s/g, '');
        const belg = /^(\+32|0)[1-9]\d{7,8}$/;
        const nld = /^(\+31|0)[1-9]\d{7,8}$/;
        const fra = /^(\+33|0)[1-9]\d{8}$/;
        const deu = /^(\+49|0)[1-9]\d{7,9}$/;
        const lux = /^(\+352)[1-9]\d{6,7}$/;

        return belg.test(phone) || nld.test(phone) || fra.test(phone) || deu.test(phone) || lux.test(phone);
    }

    validateField(fieldName: string) {
        this.touched[fieldName as keyof typeof this.touched] = true;
        this.fieldErrors[fieldName as keyof typeof this.fieldErrors] = '';

        switch (fieldName) {
            case 'firstName':
                if (!this.customerFirstName.trim()) this.fieldErrors.firstName = 'SHOP.FIELD_REQUIRED';
                else if (!this.isValidFirstName()) this.fieldErrors.firstName = 'SHOP.FIRST_NAME_ERROR';
                break;
            case 'lastName':
                if (!this.customerLastName.trim()) this.fieldErrors.lastName = 'SHOP.FIELD_REQUIRED';
                else if (!this.isValidLastName()) this.fieldErrors.lastName = 'SHOP.LAST_NAME_ERROR';
                break;
            case 'email':
                if (!this.customerEmail.trim()) this.fieldErrors.email = 'SHOP.FIELD_REQUIRED';
                else if (!this.isValidEmail()) this.fieldErrors.email = 'SHOP.EMAIL_ERROR';
                break;
            case 'phone':
                if (!this.customerPhone.trim()) this.fieldErrors.phone = 'SHOP.FIELD_REQUIRED';
                else if (!this.isValidPhone()) this.fieldErrors.phone = 'SHOP.PHONE_ERROR';
                break;
            case 'privacy':
                if (!this.agreeToPrivacy) this.fieldErrors.privacy = 'SHOP.PRIVACY_REQUIRED';
                break;
            case 'legal':
                if (!this.agreeToLegal) this.fieldErrors.legal = 'SHOP.LEGAL_REQUIRED';
                break;
        }
    }

    validateAllFields(): boolean {
        this.validateField('firstName');
        this.validateField('lastName');
        this.validateField('email');
        this.validateField('phone');
        this.validateField('privacy');
        this.validateField('legal');

        return (
            this.isValidFirstName() &&
            this.isValidLastName() &&
            this.isValidEmail() &&
            this.isValidPhone() &&
            this.agreeToPrivacy &&
            this.agreeToLegal
        );
    }

    async checkout() {
        if (!this.validateAllFields()) {
            this.error = null;
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
        this.touched = {
            firstName: false,
            lastName: false,
            email: false,
            phone: false,
            privacy: false,
            legal: false
        };
        this.fieldErrors = {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            privacy: '',
            legal: ''
        };
    }
}