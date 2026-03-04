import {prisma} from "@/lib/prisma";
import {NextRequest, NextResponse} from "next/server";
import {runFullAudit} from "@/lib/runner";

export async function GET() {
    try {
        const audits = await prisma.audit.findMany({
            orderBy: {createdAt: "desc"},
            select: {
                id: true,
                url: true,
                domain: true,
                globalScore: true,
                status: true,
                technicalScore: true,
                contentScore: true,
                performanceScore: true,
                totalIssues: true,
                criticalIssues: true,
                warnings: true,
                createdAt: true
            },
        })

        return NextResponse.json(audits)
    } catch {
        return NextResponse.json({error: 'Erreur server'}, {status: 500})
    }
}

export async function POST(req: NextRequest) {
    try {
        const {url} = await req.json()

        if (!url) {
            return NextResponse.json({error: "URL requise"}, {status: 400})
        }

        const normalizedUrl = url.startsWith("http") ? url : `http://${url}`
        const domain = new URL(normalizedUrl).hostname.replace('www.', '')

        const audit = await prisma.audit.create({
            data: {url: normalizedUrl, domain, globalScore: 0, status: 'running'}
        })

        //Todo: remove comment after implement
        runFullAudit(audit.id, normalizedUrl).catch(async (err: unknown) => {
            await prisma.audit.update({
                where: {id: audit.id},
                data: {status: 'error'}
            })
            console.log("Audit error: ", err instanceof Error ? err.message : 'Erreur server')
        })

        return NextResponse.json(audit, {status: 201})
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue'
        return NextResponse.json({error: message}, {status: 500})
    }
}