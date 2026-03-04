// src/audits/performance.ts
import puppeteer from "puppeteer";
import { AuditSection, Issue } from "../types";

export async function auditPerformance(url: string): Promise<AuditSection> {
    const issues: Issue[] = [];
    const data: Record<string, any> = {};

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // ─── Mesure du temps de chargement ───────────────────
    const startTime = Date.now();

    const resources: { url: string; type: string; size: number }[] = [];
    page.on("response", async (response) => {
        const req = response.request();
        const headers = response.headers();
        const size = parseInt(headers["content-length"] || "0");
        resources.push({
            url: req.url(),
            type: req.resourceType(),
            size,
        });
    });

    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    const loadTime = Date.now() - startTime;
    data.loadTime = loadTime;

    // ─── Core Web Vitals via CDP ──────────────────────────
    const metrics = await page.evaluate(() => {
        return new Promise<Record<string, number>>((resolve) => {
            let lcp = 0;
            let cls = 0;

            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                lcp = entries[entries.length - 1]?.startTime || 0;
            }).observe({ type: "largest-contentful-paint", buffered: true });

            new PerformanceObserver((list) => {
                list.getEntries().forEach((entry: any) => {
                    cls += entry.value;
                });
            }).observe({ type: "layout-shift", buffered: true });

            setTimeout(() => {
                const navigation = performance.getEntriesByType("navigation")[0] as any;
                resolve({
                    lcp: Math.round(lcp),
                    cls: parseFloat(cls.toFixed(3)),
                    fcp: Math.round(
                        performance
                            .getEntriesByName("first-contentful-paint")[0]
                            ?.startTime || 0
                    ),
                    ttfb: Math.round(navigation?.responseStart || 0),
                    domInteractive: Math.round(navigation?.domInteractive || 0),
                });
            }, 3000);
        });
    });

    data.coreWebVitals = metrics;

    // ─── Analyse des ressources ───────────────────────────
    const totalSize = resources.reduce((acc, r) => acc + r.size, 0);
    const images = resources.filter((r) => r.type === "image");
    const scripts = resources.filter((r) => r.type === "script");
    const stylesheets = resources.filter((r) => r.type === "stylesheet");

    data.resources = {
        total: resources.length,
        totalSize: Math.round(totalSize / 1024),
        images: images.length,
        scripts: scripts.length,
        stylesheets: stylesheets.length,
    };

    await browser.close();

    // ─── Évaluation LCP ───────────────────────────────────
    if (metrics.lcp > 4000) {
        issues.push({
            type: "error",
            category: "Core Web Vitals",
            title: `LCP trop élevé : ${(metrics.lcp / 1000).toFixed(2)}s`,
            description: "Largest Contentful Paint > 4s. L'expérience utilisateur est mauvaise.",
            recommendation:
                "Optimisez les images, utilisez un CDN, préchargez les ressources critiques avec <link rel='preload'>.",
            impact: "high",
        });
    } else if (metrics.lcp > 2500) {
        issues.push({
            type: "warning",
            category: "Core Web Vitals",
            title: `LCP à améliorer : ${(metrics.lcp / 1000).toFixed(2)}s`,
            description: "LCP entre 2.5s et 4s. À optimiser pour atteindre < 2.5s.",
            recommendation: "Optimisez le chemin critique de rendu et les images above-the-fold.",
            impact: "medium",
        });
    }

    // ─── Évaluation CLS ───────────────────────────────────
    if (metrics.cls > 0.25) {
        issues.push({
            type: "error",
            category: "Core Web Vitals",
            title: `CLS trop élevé : ${metrics.cls}`,
            description: "Cumulative Layout Shift > 0.25. Des éléments bougent au chargement.",
            recommendation:
                "Définissez des dimensions explicites (width/height) sur les images et iframes. Évitez les contenus insérés dynamiquement.",
            impact: "high",
        });
    } else if (metrics.cls > 0.1) {
        issues.push({
            type: "warning",
            category: "Core Web Vitals",
            title: `CLS à améliorer : ${metrics.cls}`,
            description: "CLS entre 0.1 et 0.25.",
            recommendation: "Reservez l'espace pour les éléments dynamiques (ads, images).",
            impact: "medium",
        });
    }

    // ─── Temps de chargement global ───────────────────────
    if (loadTime > 5000) {
        issues.push({
            type: "error",
            category: "Performance",
            title: `Temps de chargement trop long : ${(loadTime / 1000).toFixed(2)}s`,
            description: "Le site met plus de 5s à charger.",
            recommendation:
                "Activez la mise en cache, compressez les ressources (gzip/brotli), utilisez un CDN.",
            impact: "high",
        });
    }

    // ─── Poids des ressources ─────────────────────────────
    if (data.resources.totalSize > 3000) {
        issues.push({
            type: "warning",
            category: "Performance",
            title: `Poids total élevé : ${data.resources.totalSize} Ko`,
            description: "Le poids total dépasse 3 Mo.",
            recommendation:
                "Compressez les images (WebP), minifiez JS/CSS, supprimez les ressources inutilisées.",
            impact: "medium",
        });
    }

    if (scripts.length > 15) {
        issues.push({
            type: "warning",
            category: "Performance",
            title: `Trop de fichiers JavaScript : ${scripts.length}`,
            description: "Un grand nombre de fichiers JS ralentit le chargement.",
            recommendation: "Bundlez et minifiez vos scripts JavaScript. Utilisez le code splitting.",
            impact: "medium",
        });
    }

    const errorCount = issues.filter((i) => i.type === "error").length;
    const warningCount = issues.filter((i) => i.type === "warning").length;
    const score = Math.max(0, 100 - errorCount * 15 - warningCount * 5);

    return {
        name: "Performance",
        score: {
            score,
            status: score >= 80 ? "good" : score >= 50 ? "warning" : "error",
            label: score >= 80 ? "Bon" : score >= 50 ? "À améliorer" : "Critique",
        },
        issues,
        data,
    };
}
