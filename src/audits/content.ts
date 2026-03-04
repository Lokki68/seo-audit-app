import * as cheerio from "cheerio";
import { AuditSection, Issue } from "@/types";

export async function auditContent(html: string): Promise<AuditSection> {
    const $ = cheerio.load(html);
    const issues: Issue[] = [];
    const data: Record<string, any> = {};

    // ─── Structure H1 ─────────────────────────────────────
    const h1Tags = $("h1");
    const h1Count = h1Tags.length;
    data.h1 = { count: h1Count, texts: h1Tags.map((_, el) => $(el).text()).get() };

    if (h1Count === 0) {
        issues.push({
            type: "error",
            category: "Contenu",
            title: "Balise H1 manquante",
            description: "Aucune balise H1 sur la page.",
            recommendation: "Ajoutez une balise H1 unique avec votre mot-clé principal.",
            impact: "high",
        });
    } else if (h1Count > 1) {
        issues.push({
            type: "warning",
            category: "Contenu",
            title: `${h1Count} balises H1 détectées`,
            description: "Une seule balise H1 est recommandée par page.",
            recommendation: "Conservez uniquement le H1 principal et convertissez les autres en H2.",
            impact: "medium",
            element: data.h1.texts.map((t: string) => `<h1>${t}</h1>`).join("\n"),
        });
    }

    // ─── Hiérarchie des titres ────────────────────────────
    const headings: { tag: string; text: string }[] = [];
    $("h1, h2, h3, h4, h5, h6").each((_, el) => {
        headings.push({ tag: el.tagName, text: $(el).text().trim() });
    });
    data.headings = headings;

    // ─── Images sans Alt ──────────────────────────────────
    const images = $("img");
    const imagesWithoutAlt: string[] = [];
    const imagesWithEmptyAlt: string[] = [];

    images.each((_, el) => {
        const alt = $(el).attr("alt");
        const src = $(el).attr("src") || "";
        if (alt === undefined) {
            imagesWithoutAlt.push(src);
        } else if (alt.trim() === "") {
            imagesWithEmptyAlt.push(src);
        }
    });

    data.images = {
        total: images.length,
        withoutAlt: imagesWithoutAlt.length,
        withEmptyAlt: imagesWithEmptyAlt.length,
    };

    if (imagesWithoutAlt.length > 0) {
        issues.push({
            type: "error",
            category: "Images",
            title: `${imagesWithoutAlt.length} image(s) sans attribut alt`,
            description: "Des images n'ont pas d'attribut alt du tout.",
            recommendation:
                "Ajoutez un attribut alt descriptif à chaque image. Utilisez alt='' pour les images décoratives.",
            impact: "high",
            element: imagesWithoutAlt.slice(0, 3).join("\n"),
        });
    }

    if (imagesWithEmptyAlt.length > 0) {
        issues.push({
            type: "warning",
            category: "Images",
            title: `${imagesWithEmptyAlt.length} image(s) avec alt vide`,
            description: "Ces images ont un alt vide. Acceptable si décoratif, sinon à corriger.",
            recommendation: "Vérifiez si ces images sont décoratives ou si elles nécessitent une description.",
            impact: "low",
        });
    }

    // ─── Liens internes / externes ────────────────────────
    const links = $("a[href]");
    let internalLinks = 0;
    let externalLinks = 0;
    const brokenAnchors: string[] = [];

    links.each((_, el) => {
        const href = $(el).attr("href") || "";
        if (href.startsWith("http") || href.startsWith("//")) {
            externalLinks++;
        } else if (href.startsWith("#") || href === "") {
            brokenAnchors.push(href);
        } else {
            internalLinks++;
        }
    });

    data.links = { total: links.length, internal: internalLinks, external: externalLinks };

    if (internalLinks < 3) {
        issues.push({
            type: "warning",
            category: "Maillage Interne",
            title: "Peu de liens internes",
            description: `Seulement ${internalLinks} lien(s) interne(s) détecté(s).`,
            recommendation:
                "Ajoutez des liens vers d'autres pages pertinentes de votre site pour améliorer le maillage interne.",
            impact: "medium",
        });
    }

    // ─── Densité de contenu ───────────────────────────────
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
    const wordCount = bodyText.split(" ").filter((w) => w.length > 2).length;
    data.wordCount = wordCount;

    if (wordCount < 300) {
        issues.push({
            type: "warning",
            category: "Contenu",
            title: `Contenu insuffisant (${wordCount} mots)`,
            description: "La page contient moins de 300 mots.",
            recommendation:
                "Enrichissez le contenu de la page. Visez minimum 500 mots pour les pages importantes.",
            impact: "medium",
        });
    }

    const errorCount = issues.filter((i) => i.type === "error").length;
    const warningCount = issues.filter((i) => i.type === "warning").length;
    const score = Math.max(0, 100 - errorCount * 15 - warningCount * 5);

    return {
        name: "Contenu",
        score: {
            score,
            status: score >= 80 ? "good" : score >= 50 ? "warning" : "error",
            label: score >= 80 ? "Bon" : score >= 50 ? "À améliorer" : "Critique",
        },
        issues,
        data,
    };
}
