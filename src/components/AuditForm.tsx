"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { AuditRecord } from "@/types";

interface Props {
    onAuditCreated: (audit: AuditRecord) => void;
}

export function AuditForm({ onAuditCreated }: Props) {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/audits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: url.trim() }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Erreur lors du lancement");
            }

            const audit = await res.json();
            onAuditCreated(audit);
            setUrl("");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://exemple.com"
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl
              focus:outline-none focus:ring-2 focus:ring-slate-900
              text-slate-800 placeholder-slate-400 bg-white"
                        disabled={loading}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !url.trim()}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3
            rounded-xl font-medium hover:bg-slate-700 disabled:opacity-50
            disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? (
                        <><Loader2 size={18} className="animate-spin" /> Analyse...</>
                    ) : (
                        "Lancer l'audit"
                    )}
                </button>
            </div>
            {error && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    ⚠️ {error}
                </p>
            )}
        </form>
    );
}
