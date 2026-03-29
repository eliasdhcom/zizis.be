/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, RouterModule, TranslatePipe],
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css']
})

export class NavbarComponent {
    private translate = inject(TranslateService);
    dropdownOpen: boolean = false;
    currentLanguage: string = 'nl';

    settingsConfig = {
        languages: [
            { code: 'nl', name: 'Nederlands' },
            { code: 'fr', name: 'Français' },
            { code: 'en', name: 'English' },
            { code: 'de', name: 'Deutsch' }
        ]
    };

    toggleDropdown() {
        this.dropdownOpen = !this.dropdownOpen;
    }

    changeLanguage(languageCode: string) {
        this.translate.use(languageCode);
        localStorage.setItem('language', languageCode);
        this.currentLanguage = languageCode;
        this.dropdownOpen = false;
    }
}