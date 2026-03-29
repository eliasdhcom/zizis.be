/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/03/2026
**/

import { Routes } from '@angular/router';
import { ShopListComponent } from './shop-list/shop-list.component';
import { ShopDetailComponent } from './shop-detail/shop-detail.component';
import { ShopCheckoutComponent } from './shop-checkout/shop-checkout.component';

export const SHOP_ROUTES: Routes = [
    { path: '', component: ShopListComponent, data: { title: 'Shop - Zizis' } },
    { path: 'product/:id', component: ShopDetailComponent, data: { title: 'Product - Zizis' } },
    { path: 'checkout', component: ShopCheckoutComponent, data: { title: 'Checkout - Zizis' } },
];