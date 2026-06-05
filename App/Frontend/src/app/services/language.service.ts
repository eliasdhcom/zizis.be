/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2026
**/

import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
    providedIn: 'root'
})

export class LanguageService {
    constructor(
        private translate: TranslateService,
        @Inject(PLATFORM_ID) private platformId: object
    ) {}

    checkAndSetLanguage(): void {
        const storedLang = isPlatformBrowser(this.platformId) ? localStorage.getItem('language') : null;
        const languageToUse = storedLang || 'nl';

        this.translate.setDefaultLang(languageToUse);
        this.translate.use(languageToUse);

        if (isPlatformBrowser(this.platformId)) {
            this.translate.onLangChange.subscribe((event) => {
                localStorage.setItem('language', event.lang);
            });
        }
    }
}