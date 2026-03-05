import { prisma } from "@/lib/prisma";
import { ReportView } from "@/components/ReportView";
import { ReportData } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function AuditPage({
                                            params,
                                        }: {
    params: { id: string };
}) {
    const audit = await prisma.audit.findUnique({
        where: { id: params.id },
    });

    if (!audit || audit.status !== "done") notFound();

    const report = audit.reportData as unknown as ReportData;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-slate-900 text-white sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
                        >
                            <ArrowLeft size={16} /> Retour
                        </Link>
                        <div className="h-4 w-px bg-slate-700" />
                        <div>
                            <p className="font-semibold">{audit.domain}</p>
                            <p className="text-xs text-slate-400">
                                {format(new Date(audit.createdAt), "d MMMM yyyy à HH:mm", { locale: fr })}
                            </p>
                        </div>
                    </div>
                    <a
                        href={`/api/audits/${audit.id}/export`}
                        className="flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                    >
                        <Download size={15} /> Exporter HTML
                    </a>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                <ReportView report={report} />
            </main>
        </div>
    );
}
