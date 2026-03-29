/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { NgModule } from '@angular/core';
import { ContextMenuComponent } from './contextmenu/contextmenu.component';
import { FooterComponent } from './footer/footer.component';
import { NavbarComponent } from './navbar/navbar.component';

@NgModule({
    imports: [
        ContextMenuComponent,
        FooterComponent,
        NavbarComponent,
    ],
    exports: [
        ContextMenuComponent,
        FooterComponent,
        NavbarComponent,
    ]
})

export class SharedModule {}