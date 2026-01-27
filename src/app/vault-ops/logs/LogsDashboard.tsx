
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ShieldAlert, Smartphone, Server, ShieldCheck, LogOut, AlertCircle, CheckCircle, AlertTriangle, Info, Calendar, Cpu, Globe, Tag } from "lucide-react";

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

function Badge({ children }: { children: React.ReactNode }) {
    return (
        <span className="px-2 py-0.5 rounded-full bg-black/[.05] dark:bg-white/[.1] border border-black/[.05] text-[10px] font-medium font-[family-name:var(--font-geist-mono)]">
            {children}
        </span>
    );
}

interface LogsDashboardProps {
    logs: any[];
    pagination: {
        currentPage: number;
        totalPages: number;
        limit: number;
    };
}

export default function LogsDashboard(props: LogsDashboardProps) {
    const { logs } = props;
    const router = useRouter();
    const searchParams = useSearchParams();
    const tab = searchParams.get("tab") || "apps";

    // Stealth Modal State
    const [showStealthModal, setShowStealthModal] = useState(false);
    const [step, setStep] = useState<"LOGIN" | "WIPE">("LOGIN");

    // Login Form State
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [pin, setPin] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Crash Modal State
    const [selectedLog, setSelectedLog] = useState<any>(null);

    // Session Heartbeat
    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch('/api/sys-monitor/status');
                if (res.ok) {
                    const data = await res.json();
                    if (!data.valid) window.location.reload();
                }
            } catch (e) { }
        };
        const interval = setInterval(checkSession, 5000);
        return () => clearInterval(interval);
    }, []);

    // Hotkey Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && (e.key === "U" || e.key === "u")) {
                e.preventDefault();
                setShowStealthModal(true);
                setStep("LOGIN");
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const res = await fetch("/api/vault-ops/danger-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, pin }),
            });
            if (res.ok) {
                setStep("WIPE");
            } else {
                const msg = await res.text();
                setError(msg || "Access Denied");
            }
        } catch (err) {
            setError("Connection Error.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleWipe = async () => {
        if (!confirm("Are you sure you want to perform this action?")) return;
        try {
            const res = await fetch("/api/vault-ops/wipe", { method: "POST" });
            if (res.ok) {
                alert("Operation Successful.");
                setShowStealthModal(false);
                router.refresh();
            } else {
                if (res.status === 401 || res.status === 403 || res.status === 404) {
                    window.location.reload();
                    return;
                }
                alert("Operation Failed: " + res.statusText);
            }
        } catch (e) {
            alert("Error");
        }
    };

    const handleDisconnect = async () => {
        try {
            await fetch("/api/sys-monitor/logout", { method: "POST" });
            window.location.href = "/";
        } catch (e) {
            console.error("Logout failed", e);
        }
    };

    const PaginationControls = () => {
        if (!props.pagination || props.pagination.totalPages <= 1) return null;
        const { currentPage, totalPages } = props.pagination;

        return (
            <div className="flex items-center justify-center gap-4 mt-8 border-t border-black/[.08] dark:border-white/[.08] pt-6">
                <button
                    disabled={currentPage <= 1}
                    onClick={() => router.push(`/vault-ops/logs?page=${currentPage - 1}`)}
                    className="px-4 py-2 rounded-md bg-black/[.05] dark:bg-white/[.05] disabled:opacity-30 hover:bg-black/[.1] dark:hover:bg-white/[.1] transition-colors text-sm font-medium"
                >
                    Previous
                </button>
                <span className="text-sm font-[family-name:var(--font-geist-mono)] text-foreground/60">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    disabled={currentPage >= totalPages}
                    onClick={() => router.push(`/vault-ops/logs?page=${currentPage + 1}`)}
                    className="px-4 py-2 rounded-md bg-black/[.05] dark:bg-white/[.05] disabled:opacity-30 hover:bg-black/[.1] dark:hover:bg-white/[.1] transition-colors text-sm font-medium"
                >
                    Next
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen p-4 md:p-8 pb-20 font-[family-name:var(--font-geist-sans)] max-w-6xl mx-auto">

            {/* --- CRASH DETAILS MODAL --- */}
            {selectedLog && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-background border border-black/[.08] dark:border-white/[.145] rounded-xl shadow-xl p-8 max-w-2xl w-full relative max-h-[90vh] flex flex-col">
                        <button
                            onClick={() => setSelectedLog(null)}
                            className="absolute top-4 right-4 text-foreground/50 hover:text-foreground transition-colors"
                        >✕</button>

                        <div className="flex items-center gap-3 mb-2">
                            {selectedLog.message?.startsWith('CRASH:') ?
                                <span className="flex items-center gap-2 text-sm font-bold text-red-500 tracking-wider">
                                    <AlertCircle className="w-5 h-5" /> CRASH
                                </span> :
                                selectedLog.level === 'ERROR' ?
                                    <span className="flex items-center gap-2 text-sm font-bold text-red-500 tracking-wider">
                                        <AlertCircle className="w-5 h-5" /> ERROR
                                    </span> :
                                    selectedLog.status === 'SUCCESS' ?
                                        <span className="flex items-center gap-2 text-sm font-bold text-green-500 tracking-wider">
                                            <CheckCircle className="w-5 h-5" /> SUCCESS
                                        </span> :
                                        selectedLog.status === 'WARNING' || selectedLog.level === 'WARN' ?
                                            <span className="flex items-center gap-2 text-sm font-bold text-orange-500 tracking-wider">
                                                <AlertTriangle className="w-5 h-5" /> WARNING
                                            </span> :
                                            <span className="flex items-center gap-2 text-sm font-bold text-blue-500 tracking-wider">
                                                <Info className="w-5 h-5" /> INFO
                                            </span>}

                            <div className="h-4 w-px bg-black/[.1] dark:bg-white/[.1]"></div>

                            <h2 className="text-lg font-semibold text-foreground tracking-tight line-clamp-1">
                                {selectedLog.exception || selectedLog.action || selectedLog.message || "Log Details"}
                            </h2>
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-foreground/60 mb-6 font-[family-name:var(--font-geist-mono)] border-b border-black/[.05] pb-4 uppercase tracking-wider">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(selectedLog.timestamp || selectedLog.created_at).toLocaleString()}
                            </span>
                            {selectedLog.device && selectedLog.device !== 'Unknown' && selectedLog.device !== 'UNKNOWN' && <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> {selectedLog.device}</span>}
                            {selectedLog.os_version && selectedLog.os_version !== 'Unknown' && <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> {selectedLog.os_version}</span>}
                            {selectedLog.app_version && <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> {selectedLog.app_version}</span>}
                            {selectedLog.actor_ip && selectedLog.actor_ip !== 'Unknown' && selectedLog.actor_ip !== 'UNKNOWN' && <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> {selectedLog.actor_ip}</span>}
                        </div>

                        <div className="flex-1 overflow-auto bg-black/[.03] dark:bg-white/[.03] rounded-lg p-4 border border-black/[.05]">
                            {(() => {
                                // Smart Stack Extraction & Message Simplification
                                let finalStack = selectedLog.stacktrace;
                                let metaObj = selectedLog.metadata;
                                let simpleMessage = selectedLog.exception || selectedLog.message;

                                // Parse stringified metadata
                                if (typeof metaObj === 'string') {
                                    try {
                                        metaObj = JSON.parse(metaObj);
                                    } catch (e) { }
                                }

                                // If metadata has a specific 'error' field, use that as the Simple Message
                                if (metaObj && metaObj.error) {
                                    simpleMessage = typeof metaObj.error === 'string' ? metaObj.error : JSON.stringify(metaObj.error);
                                }
                                // If stack exists, the first line is usually the Error Message
                                else if (finalStack) {
                                    const firstLine = finalStack.split('\n')[0];
                                    if (firstLine.length < 200) simpleMessage = firstLine;
                                }

                                // Fallback for pure stack in metadata
                                if (!finalStack && metaObj && metaObj.stack) {
                                    finalStack = metaObj.stack;
                                    if (!simpleMessage) simpleMessage = finalStack.split('\n')[0];
                                }

                                return (
                                    <div className="space-y-6">
                                        {/* 1. SIMPLIFIED DIAGNOSIS (What User Wants) */}
                                        <div className="bg-red-500/5 dark:bg-red-500/10 p-5 rounded-lg border border-red-500/20">
                                            <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" />
                                                Diagnosis
                                            </h3>
                                            <p className="text-base font-medium text-foreground/90 leading-relaxed font-[family-name:var(--font-geist-mono)] break-all whitespace-pre-wrap">
                                                {simpleMessage}
                                            </p>
                                        </div>

                                        {/* 2. OPTIONAL CONTEXT */}
                                        {metaObj && metaObj.component && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3 bg-black/[.03] dark:bg-white/[.03] rounded-md border border-black/[.05]">
                                                    <div className="text-[10px] uppercase text-foreground/50 font-bold tracking-widest mb-1">Component</div>
                                                    <div className="text-sm font-medium">{metaObj.component}</div>
                                                </div>
                                                {metaObj.latency && (
                                                    <div className="p-3 bg-black/[.03] dark:bg-white/[.03] rounded-md border border-black/[.05]">
                                                        <div className="text-[10px] uppercase text-foreground/50 font-bold tracking-widest mb-1">Latency</div>
                                                        <div className="text-sm font-medium">{metaObj.latency}</div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* 3. TECHNICAL DETAILS (Collapsed) - Hide if redundant */}
                                        {/* Only show if Stack is defined AND different from simple message */}
                                        {(finalStack && finalStack.trim() !== simpleMessage?.trim()) && (
                                            <details className="group">
                                                <summary className="cursor-pointer text-xs font-medium text-foreground/50 hover:text-foreground/80 transition-colors uppercase tracking-widest flex items-center gap-2 select-none">
                                                    <span>▶ Show Raw Technical Data</span>
                                                </summary>
                                                <div className="mt-4 p-4 bg-black/[.8] text-white/90 rounded-lg overflow-x-auto border border-black/[.1] shadow-inner text-xs font-[family-name:var(--font-geist-mono)] leading-relaxed">
                                                    {finalStack ? (
                                                        <pre className="whitespace-pre-wrap">{finalStack}</pre>
                                                    ) : (
                                                        <pre className="whitespace-pre-wrap">
                                                            {JSON.stringify(metaObj || selectedLog.metadata, null, 2)}
                                                        </pre>
                                                    )}
                                                </div>
                                            </details>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-6 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- STEALTH MODAL (GATE 2) --- */}
            {showStealthModal && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-background border border-black/[.08] dark:border-white/[.145] rounded-xl shadow-xl p-8 max-w-sm w-full relative">
                        <button
                            onClick={() => setShowStealthModal(false)}
                            className="absolute top-4 right-4 text-foreground/50 hover:text-foreground transition-colors"
                        >✕</button>

                        <h2 className="text-lg font-semibold mb-6 text-foreground tracking-tight">
                            {step === "LOGIN" ? "Authentication Required" : "System Operations"}
                        </h2>

                        {step === "LOGIN" && (
                            <form onSubmit={handleLogin} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-foreground/60 mb-2 font-[family-name:var(--font-geist-mono)]">USERNAME</label>
                                    <input value={username} onChange={e => setUsername(e.target.value)} autoFocus className="w-full bg-transparent border border-black/[.1] dark:border-white/[.1] rounded-lg p-2.5 text-sm font-[family-name:var(--font-geist-mono)] outline-none focus:ring-1 focus:ring-foreground transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-foreground/60 mb-2 font-[family-name:var(--font-geist-mono)]">PASSWORD</label>
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-transparent border border-black/[.1] dark:border-white/[.1] rounded-lg p-2.5 text-sm font-[family-name:var(--font-geist-mono)] outline-none focus:ring-1 focus:ring-foreground transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-foreground/60 mb-2 font-[family-name:var(--font-geist-mono)]">CODE</label>
                                    <input value={pin} onChange={e => setPin(e.target.value)} maxLength={6} className="w-full bg-transparent border border-black/[.1] dark:border-white/[.1] rounded-lg p-2.5 text-sm font-[family-name:var(--font-geist-mono)] text-center tracking-widest outline-none focus:ring-1 focus:ring-foreground transition-all" />
                                </div>
                                <button type="submit" disabled={isLoading} className="rounded-full bg-foreground text-background text-sm h-12 px-5 font-medium mt-4 hover:opacity-90 transition-opacity">
                                    {isLoading ? "Verifying..." : "Access"}
                                </button>
                                {error && <div className="text-xs text-red-500 text-center mt-2 font-[family-name:var(--font-geist-mono)]">{error}</div>}
                            </form>
                        )}

                        {step === "WIPE" && (
                            <div className="space-y-6">
                                <p className="text-sm text-foreground/70">
                                    Authorized access granted. Internal storage cleanup available.
                                    <br /><br />
                                    <strong>Warning:</strong> This action is irreversible.
                                </p>
                                <button onClick={handleWipe} className="w-full rounded-full border border-red-500/50 text-red-500 hover:bg-red-500/10 text-sm h-12 font-medium transition-colors uppercase tracking-widest">
                                    Execute Cleanup
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )
            }


            <header className="mb-8 md:mb-12 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-black/[.08] dark:border-white/[.08] pb-4 gap-4">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-foreground/80" />
                    <span>Security War Room</span>
                </h1>

                <div className="flex flex-wrap gap-2 text-sm items-center w-full md:w-auto">
                    <button onClick={() => router.push("/vault-ops/logs?tab=apps")}
                        className={cn("flex items-center gap-2 px-4 py-1.5 rounded-full transition-colors font-medium border border-transparent", tab === 'apps' ? "bg-foreground text-background" : "hover:bg-black/[.05] dark:hover:bg-white/[.05] text-foreground/60 hover:text-foreground")}>
                        <Smartphone className="w-4 h-4" />
                        Apps
                    </button>
                    <button onClick={() => router.push("/vault-ops/logs?tab=backend")}
                        className={cn("flex items-center gap-2 px-4 py-1.5 rounded-full transition-colors font-medium border border-transparent", tab === 'backend' ? "bg-foreground text-background" : "hover:bg-black/[.05] dark:hover:bg-white/[.05] text-foreground/60 hover:text-foreground")}>
                        <Server className="w-4 h-4" />
                        Backend
                    </button>
                    <button onClick={() => router.push("/vault-ops/logs?tab=security")}
                        className={cn("flex items-center gap-2 px-4 py-1.5 rounded-full transition-colors font-medium border border-transparent", tab === 'security' ? "bg-foreground text-background" : "hover:bg-black/[.05] dark:hover:bg-white/[.05] text-foreground/60 hover:text-foreground")}>
                        <ShieldCheck className="w-4 h-4" />
                        Security
                    </button>

                    <div className="hidden md:block h-4 w-px bg-black/[.1] dark:bg-white/[.1] mx-2"></div>

                    {/* DISCONNECT BUTTON */}
                    <button onClick={handleDisconnect} className="text-red-500 hover:text-red-600 transition-colors font-medium text-xs uppercase tracking-wider ml-auto md:ml-0 flex items-center gap-1.5">
                        <LogOut className="w-3.5 h-3.5" />
                        Disconnect
                    </button>
                </div>
            </header>

            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left text-sm">
                    <thead className="text-foreground/50 border-b border-black/[.08] dark:border-white/[.08]">
                        <tr>
                            <th className="p-4 font-normal">Timestamp</th>
                            <th className="p-4 font-normal">Type</th>
                            <th className="p-4 font-normal">Details</th>
                            <th className="p-4 font-normal">Source</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[.08] dark:divide-white/[.08]">
                        {(props.logs || []).map((log: any) => (
                            <tr
                                key={log.id}
                                onClick={() => setSelectedLog(log)}
                                className="group hover:bg-black/[.02] dark:hover:bg-white/[.02] cursor-pointer transition-colors"
                            >
                                <td className="p-4 font-[family-name:var(--font-geist-mono)] text-xs text-foreground/70 whitespace-nowrap">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="p-4">
                                    {log.message?.startsWith('CRASH:') ? <Badge>CRASH</Badge> :
                                        log.level === 'ERROR' ? <Badge>ERROR</Badge> :
                                            log.action?.includes('BLOCKED') ? <Badge>ATTACK</Badge> :
                                                log.action === 'LOGIN_FAILED' ? <Badge>AUTH</Badge> :
                                                    <Badge>WARNING</Badge>}
                                </td>
                                <td className="p-4 font-medium text-foreground max-w-md truncate text-sm">
                                    {log.exception || log.message}
                                </td>
                                <td className="p-4 text-xs font-[family-name:var(--font-geist-mono)] text-foreground/50">
                                    {log.device || log.actor_ip || "System"}
                                </td>
                            </tr>
                        ))}
                        {(!props.logs || props.logs.length === 0) && (
                            <tr><td colSpan={4} className="p-12 text-center text-foreground/40 text-sm">
                                No active issues in this category.
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <PaginationControls />
        </div >
    );
}
