/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 06/04/2026
**/

import { Injectable } from '@angular/core';

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

    updateMeta(meta: SeoMeta): void {
        if (meta.title) {
            document.title = meta.title;
            this.updateMetaTag('property', 'og:title', meta.ogTitle || meta.title);
        }

        if (meta.description) {
            this.updateMetaTag('name', 'description', meta.description);
            this.updateMetaTag('property', 'og:description', meta.description);
        }

        if (meta.image) {
            this.updateMetaTag('property', 'og:image', meta.image);
            this.updateMetaTag('property', 'og:image:alt', meta.title || 'Product image');
        }

        if (meta.url) {
            this.updateMetaTag('property', 'og:url', meta.url);
        }

        if (meta.type) {
            this.updateMetaTag('property', 'og:type', meta.type);
        }

        if (meta.canonical) {
            this.updateCanonicalURL(meta.canonical);
        }

        if (meta.keywords) {
            this.updateMetaTag('name', 'keywords', meta.keywords);
        }

        if (meta.structuredData) {
            this.updateStructuredData(meta.structuredData);
        }
    }

    private updateMetaTag(attributeName: string, attributeValue: string, content: string): void {
        let tag = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
        if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute(attributeName, attributeValue);
            document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
    }

    private updateCanonicalURL(url: string): void {
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', url);
    }

    private updateStructuredData(data: any): void {
        let script = document.querySelector('script[type="application/ld+json"]');
        if (!script) {
            script = document.createElement('script');
            script.setAttribute('type', 'application/ld+json');
            document.head.appendChild(script);
        }
        script.textContent = JSON.stringify(data);
    }

    resetMeta(): void {
        document.title = 'Zizis';
        this.updateMetaTag('name', 'description', 'Zizis - Your hairdresser in the heart of Boechout');
    }
}