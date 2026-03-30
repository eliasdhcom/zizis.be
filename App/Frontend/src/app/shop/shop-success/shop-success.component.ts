/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 30/03/2026
**/

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
    selector: 'app-shop-success',
    standalone: true,
    imports: [CommonModule, TranslateModule, TranslatePipe, SharedModule],
    templateUrl: './shop-success.component.html',
    styleUrls: ['./shop-success.component.css']
})

export class ShopSuccessComponent implements OnInit {
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private http = inject(HttpClient);
    private languageService = inject(LanguageService);

    ngOnInit(): void {
        this.languageService.checkAndSetLanguage();

        this.route.queryParams.subscribe(params => {
            const sessionId = params['session_id'];
            if (sessionId) {
                this.verifyPayment(sessionId);
            }
        });
    }

    private verifyPayment(sessionId: string): void {
        this.http.post('http://localhost:3000/api/shop/verify-payment', { sessionId }).subscribe();
    }

    continueShop(): void {
        this.router.navigate(['/shop']);
    }

    goHome(): void {
        this.router.navigate(['/']);
    }
}