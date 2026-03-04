import axios from "axios";
import {auditTechnical} from "@/audits/technical";
import {auditContent} from "@/audits/content";
import {auditPerformance} from "@/audits/performance";

export async function runFullAudit(auditId: string, url: string) {
    const response = await axios.get(url, {
        headers: {"User-Agent": "Mozilla/5.0 (compatible; SEOAuditBot/1.0"},
        timeout: 5000,
    })

    const html = response.data as string
    const headers = response.headers as Record<string, string>

    const [technical, content] = await Promise.all([
        auditTechnical(html, url, headers),
        auditContent(html)
    ])

    const performance = await auditPerformance(url)

    const globalScore = Math.round(
        (technical.score.score + content.score.score + performance.score.score) / 3
    )

    const allIssues = [
        ...technical.issues,
        ...content.issues,
        ...performance.issues
    ]

    const reportData = {
        url,
        data: new Date().toISOString(),
        globalScore,
        sections: {technical, content, performance},
        summary: {
            totalIssues: allIssues.length,
            criticalIssues: allIssues.filter((i) => i.type === 'error').length,
            warnnings: allIssues.filter((i) => i.type === 'warning').length,
        }
    }
}