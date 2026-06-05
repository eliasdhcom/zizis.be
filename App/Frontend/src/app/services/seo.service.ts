/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 06/04/2026
**/

import { Injectable, inject, Inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

export interface SeoMeta {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
    canonical?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    structuredData?: any;
}

@Injectable({
    providedIn: 'root'
})
export class SeoService {
    private titleService = inject(Title);
    private metaService = inject(Meta);

    constructor(@Inject(DOCUMENT) private document: Document) {}

    updateMeta(meta: SeoMeta): void {
        if (meta.title) {
            this.titleService.setTitle(meta.title);
            this.metaService.updateTag({ property: 'og:title', content: meta.ogTitle || meta.title });
        }

        if (meta.description) {
            this.metaService.updateTag({ name: 'description', content: meta.description });
            this.metaService.updateTag({ property: 'og:description', content: meta.description });
        }

        if (meta.image) {
            this.metaService.updateTag({ property: 'og:image', content: meta.image });
            this.metaService.updateTag({ property: 'og:image:alt', content: meta.title || 'Product image' });
        }

        if (meta.url) {
            this.metaService.updateTag({ property: 'og:url', content: meta.url });
        }

        if (meta.type) {
            this.metaService.updateTag({ property: 'og:type', content: meta.type });
        }

        if (meta.canonical) {
            this.updateCanonicalURL(meta.canonical);
        }

        if (meta.keywords) {
            this.metaService.updateTag({ name: 'keywords', content: meta.keywords });
        }

        if (meta.structuredData) {
            this.updateStructuredData(meta.structuredData);
        }
    }

    private updateCanonicalURL(url: string): void {
        let canonical = this.document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = this.document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            this.document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', url);
    }

    private updateStructuredData(data: any): void {
        let script = this.document.querySelector('script[type="application/ld+json"]');
        if (!script) {
            script = this.document.createElement('script');
            script.setAttribute('type', 'application/ld+json');
            this.document.head.appendChild(script);
        }
        script.textContent = JSON.stringify(data);
    }

    resetMeta(): void {
        this.titleService.setTitle('Zizis');
        this.metaService.updateTag({ name: 'description', content: 'Zizis - Your hairdresser in the heart of Boechout' });
    }
}