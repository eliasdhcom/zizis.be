/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    available: boolean;
}

export interface CartItem {
    id: number;
    quantity: number;
}

export interface CheckoutData {
    items: CartItem[];
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    customerAddress?: string;
}

export interface CheckoutResponse {
    success: boolean;
    sessionId: string;
    checkoutUrl: string;
}

export interface VerifyPaymentResponse {
    success: boolean;
    message: string;
    paymentStatus: string;
}

@Injectable({
    providedIn: 'root'
})

export class ShopService {
    private apiUrl = `${environment.ApiUrl}/api/shop`;

    constructor(private http: HttpClient) {}

    getProducts(): Observable<{ success: boolean; products: Product[]; count: number }> {
        return this.http.get<{ success: boolean; products: Product[]; count: number }>(
            `${this.apiUrl}/products`
        );
    }

    getProduct(id: number): Observable<{ success: boolean; product: Product }> {
        return this.http.get<{ success: boolean; product: Product }>(
            `${this.apiUrl}/products/${id}`
        );
    }

    createCheckout(data: CheckoutData): Observable<CheckoutResponse> {
        return this.http.post<CheckoutResponse>(
            `${this.apiUrl}/checkout`,
            data
        );
    }

    verifyPayment(sessionId: string): Observable<VerifyPaymentResponse> {
        return this.http.post<VerifyPaymentResponse>(
            `${this.apiUrl}/verify-payment`,
            { sessionId }
        );
    }

    getCart(): CartItem[] {
        const cart = localStorage.getItem('shop-cart');
        return cart ? JSON.parse(cart) : [];
    }

    setCart(cart: CartItem[]) {
        localStorage.setItem('shop-cart', JSON.stringify(cart));
    }

    addToCart(productId: number, quantity: number = 1) {
        const cart = this.getCart();
        const item = cart.find(i => i.id === productId);

        if (item && item.quantity + quantity > 5) {
            console.warn('Max 5 per product allowed');
            return;
        }

        const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
        if (totalItems + quantity > 10) {
            console.warn('Max 10 total items allowed');
            return;
        }

        if (item) item.quantity += quantity;
        else cart.push({ id: productId, quantity });

        this.setCart(cart);
    }

    removeFromCart(productId: number) {
        const cart = this.getCart().filter(i => i.id !== productId);
        this.setCart(cart);
    }

    clearCart() {
        localStorage.removeItem('shop-cart');
    }
}