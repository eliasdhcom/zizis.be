/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Routes } from '@angular/router';
import { IndexComponent } from './index/index.component';
import { ShopListComponent } from './shop/shop-list/shop-list.component';
import { ShopDetailComponent } from './shop/shop-detail/shop-detail.component';
import { ShopCheckoutComponent } from './shop/shop-checkout/shop-checkout.component';

export const routes: Routes = [
    { path: '', component: IndexComponent, data: { title: 'Zizis' } },
    { 
        path: 'shop', 
        children: [
            { path: '', component: ShopListComponent, data: { title: 'Zizis - Shop' } },
            { path: 'product/:id', component: ShopDetailComponent, data: { title: 'Zizis - Product' } },
            { path: 'checkout', component: ShopCheckoutComponent, data: { title: 'Zizis - Checkout' } },
        ]
    },
];