/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 01/01/2025
**/

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.css'],
    standalone: true,
    imports: [CommonModule]
})

export class FooterComponent implements OnInit {
    footerContent: SafeHtml | null = null;
    currentYear: number;

    constructor(
        private http: HttpClient,
        private sanitizer: DomSanitizer
    ) {
        this.currentYear = new Date().getFullYear();
    }

    ngOnInit(): void {
        this.loadFooter();
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
}