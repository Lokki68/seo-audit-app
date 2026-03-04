import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";

export async function GET(
    _req: NextRequest,
    {params}: {params: {id: string}}
) {
    const audit = await prisma.audit.findUnique({
        where: {id: params.id}
    })

    if (!audit) {
        return NextResponse.json({error: "Audit introuvable"}, {status: 404})
    }

    return NextResponse.json(audit)
}

export async function DELETE(
    _req: NextRequest,
    {params}: {params: {id: string}}
) {
    await prisma.audit.delete({
        where: {id: params.id}
    })
    return NextResponse.json({success: true})
}