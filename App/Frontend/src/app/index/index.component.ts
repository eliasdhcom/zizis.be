/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, OnInit } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../services/language.service';
import { SharedModule } from '../shared/shared.module';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
    selector: 'app-index',
    templateUrl: './index.component.html',
    styleUrls: ['./index.component.css'],
    imports: [TranslatePipe, CommonModule, SharedModule],
    standalone: true
})

export class IndexComponent implements OnInit {
    dropdownOpen: boolean = false;
    currentLanguage: string = 'nl';
    currentTheme: string = 'light';
    footerContent: SafeHtml | null = null;
    currentYear: number;
    isLoading: boolean = true;

    settingsConfig = {
        languages: [
            { code: 'nl', name: 'Nederlands' },
            { code: 'fr', name: 'Français' },
            { code: 'en', name: 'English' },
            { code: 'de', name: 'Deutsch' }
        ]
    };

    galleryPhotos: string[] = [
        'assets/media/images/gallery/photo1.png',
        'assets/media/images/gallery/photo2.png',
        'assets/media/images/gallery/photo3.png',
        'assets/media/images/gallery/photo4.png',
        'assets/media/images/gallery/photo5.png'
    ];

    constructor(
        private languageService: LanguageService,
        private translate: TranslateService,
        private http: HttpClient,
        private sanitizer: DomSanitizer
    ) {
        this.currentYear = new Date().getFullYear();
    }

    ngOnInit(): void {
        this.languageService.checkAndSetLanguage();
        this.translate.setDefaultLang('nl');
        this.setTheme(this.currentTheme);
        this.loadFooter();
        setTimeout(() => this.isLoading = false, 1000); // Simulate loading for animation
    }

    loadFooter() {
        const footerUrl = 'https://eliasdh.com/assets/includes/external-footer.html';
        this.http.get(footerUrl, { responseType: 'text' }).subscribe({
            next: (data) => {
                const updatedFooter = data.replace('{{ currentYear }}', this.currentYear.toString());
                this.footerContent = this.sanitizer.bypassSecurityTrustHtml(updatedFooter);
            },
            error: (err) => {
                this.footerContent = this.sanitizer.bypassSecurityTrustHtml(
                    '<p>Failed to load footer content. Please try again later.</p>'
                );
            }
        });
    }

    changeLanguage(languageCode: string) {
        this.translate.use(languageCode);
        localStorage.setItem('language', languageCode);
        this.currentLanguage = languageCode;
        this.dropdownOpen = false;
    }

    toggleDropdown() {
        this.dropdownOpen = !this.dropdownOpen;
    }

    isToday(day: string): boolean {
        const today = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return day === days[today.getDay()];
    }

    setTheme(theme: string) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    toggleTheme() {
        this.setTheme(this.currentTheme === 'light' ? 'dark' : 'light');
    }

    scrollToSection(section: string) {
        document.querySelector(`.${section}`)?.scrollIntoView({ behavior: 'smooth' });
    }
}