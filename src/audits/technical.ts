import * as cheerio from "cheerio";
import {AuditSection, Issue} from "@/types";

export async function auditTechnical(
    html: string,
    url: string,
    headers: Record<string, string>,
): Promise<AuditSection> {
    const $ = cheerio.load(html)
    const issues: Issue[] = []
    const data: Record<string, any> = {}

    // ─── Meta Title ─────────────────────────────────
    const title = $('title').text().trim()
    data.title = title

    if (!title) {
        issues.push({
            type: 'error',
            category: 'Meta Tags',
            title: "Balise <title> manquante",
            description: "Aucune balise title trouvée sur la page",
            recommendation: "Ajouter une balise <title> unique et descriptive entre 50-60 caractères",
            impact: "high"
        })
    } else if (title.length < 30 || title.length > 60) {
        issues.push({
            type: 'warning',
            category: 'Meta Tags',
            title: `Longueur du title non optimale (${title.length} caractères)`,
            description: `Le title fait ${title.length} caractères. L'idéal est entre 50 et 60 caractères.`,
            recommendation:
                title.length < 30
                    ? "Enrichissez votre title avec des mots-clés pertinents."
                    : "Réduisez votre title pour éviter la troncature dans les SERPs."
            ,
            impact: "medium",
            element: `<title>${title}</title>`
        })
    }

    // ─── Meta Description ─────────────────────────────────
    const metaDesc = $('meta[name="description"]').attr("content") || "";
    data.metaDescription = metaDesc;

    if (!metaDesc) {
        issues.push({
            type: "error",
            category: "Meta Tags",
            title: "Meta description manquante",
            description: "Aucune meta description trouvée.",
            recommendation:
                "Ajoutez une meta description unique de 150-160 caractères avec un appel à l'action.",
            impact: "high",
        });
    } else if (metaDesc.length < 120 || metaDesc.length > 160) {
        issues.push({
            type: "warning",
            category: "Meta Tags",
            title: `Meta description non optimale (${metaDesc.length} caractères)`,
            description: `La meta description fait ${metaDesc.length} caractères.`,
            recommendation: "Visez 150-160 caractères pour une visibilité optimale.",
            impact: "medium",
            element: `<meta name="description" content="${metaDesc}" />`,
        });
    }

    // ─── Canonical ────────────────────────────────────────
    const canonical = $('link[rel="canonical"]').attr("href") || "";
    data.canonical = canonical;

    if (!canonical) {
        issues.push({
            type: "warning",
            category: "Technique",
            title: "URL Canonique manquante",
            description: "Pas de balise canonical détectée.",
            recommendation: `Ajoutez <link rel="canonical" href="${url}" /> dans le <head>.`,
            impact: "medium",
        });
    }

    // ─── Robots Meta ──────────────────────────────────────
    const robots = $('meta[name="robots"]').attr("content") || "";
    data.robots = robots;

    if (robots.includes("noindex")) {
        issues.push({
            type: "error",
            category: "Indexation",
            title: "Page bloquée à l'indexation (noindex)",
            description: "La meta robots contient 'noindex'.",
            recommendation:
                "Vérifiez si cette page doit être indexée et supprimez le noindex si nécessaire.",
            impact: "high",
            element: `<meta name="robots" content="${robots}" />`,
        });
    }

    // ─── Open Graph ───────────────────────────────────────
    const ogTitle = $('meta[property="og:title"]').attr("content") || "";
    const ogDesc = $('meta[property="og:description"]').attr("content") || "";
    const ogImage = $('meta[property="og:image"]').attr("content") || "";
    data.openGraph = { ogTitle, ogDesc, ogImage };

    if (!ogTitle || !ogDesc || !ogImage) {
        const missing = [];
        if (!ogTitle) missing.push("og:title");
        if (!ogDesc) missing.push("og:description");
        if (!ogImage) missing.push("og:image");

        issues.push({
            type: "warning",
            category: "Réseaux Sociaux",
            title: `Balises Open Graph incomplètes`,
            description: `Les balises suivantes sont manquantes : ${missing.join(", ")}`,
            recommendation:
                "Complétez les balises Open Graph pour améliorer le partage sur les réseaux sociaux.",
            impact: "low",
        });
    }

    // ─── HTTPS ────────────────────────────────────────────
    data.isHttps = url.startsWith("https://");
    if (!data.isHttps) {
        issues.push({
            type: "error",
            category: "Sécurité",
            title: "Site non sécurisé (HTTP)",
            description: "Le site n'utilise pas HTTPS.",
            recommendation:
                "Migrez vers HTTPS avec un certificat SSL valide. C'est un facteur de classement Google.",
            impact: "high",
        });
    }

    // ─── Viewport ─────────────────────────────────────────
    const viewport = $('meta[name="viewport"]').attr("content") || "";
    data.viewport = viewport;

    if (!viewport) {
        issues.push({
            type: "error",
            category: "Mobile",
            title: "Meta viewport manquante",
            description: "Aucune balise viewport détectée.",
            recommendation:
                'Ajoutez <meta name="viewport" content="width=device-width, initial-scale=1"> pour le responsive.',
            impact: "high",
        });
    }

    // ─── Lang Attribute ───────────────────────────────────
    const lang = $("html").attr("lang") || "";
    data.lang = lang;

    if (!lang) {
        issues.push({
            type: "warning",
            category: "Internationalisation",
            title: "Attribut lang manquant sur <html>",
            description: "La langue de la page n'est pas définie.",
            recommendation: 'Ajoutez lang="fr" (ou autre) à la balise <html>.',
            impact: "medium",
        });
    }

    // ─── Score Calculation ────────────────────────────────
    const errorCount = issues.filter((i) => i.type === "error").length;
    const warningCount = issues.filter((i) => i.type === "warning").length;
    const score = Math.max(0, 100 - errorCount * 15 - warningCount * 5);

    return {
        name: "Technique",
        score: {
            score,
            status: score >= 80 ? "good" : score >= 50 ? "warning" : "error",
            label: score >= 80 ? "Bon" : score >= 50 ? "À améliorer" : "Critique",
        },
        issues,
        data,
    };


}