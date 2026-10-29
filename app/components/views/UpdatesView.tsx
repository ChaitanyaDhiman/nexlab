"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Download,
    RefreshCw,
    ShieldAlert,
    Package,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    Terminal,
    Search,
    ArrowRight,
    Copy,
    Check,
    AlertTriangle,
    X,
    ChevronDown,
    ChevronUp,
    Trash2,
    CheckCircle
} from "lucide-react";
import { UpdateStatusData } from "@/app/api/updates/route";

export function UpdatesView() {
    const [status, setStatus] = useState<UpdateStatusData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [checking, setChecking] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [rebooting, setRebooting] = useState(false);

    // Terminal / Stream state
    const [logs, setLogs] = useState<string[]>([]);
    const [showTerminal, setShowTerminal] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const [activeStep, setActiveStep] = useState<string>("idle");

    // Filter & Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState<"all" | "security" | "standard">("all");
    const [copiedPkg, setCopiedPkg] = useState<string | null>(null);

    // Modals & messages
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showRebootModal, setShowRebootModal] = useState(false);
    const [actionMessage, setActionMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

    const terminalEndRef = useRef<HTMLDivElement>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    // Fetch update status
    const fetchStatus = useCallback(async (showLoadingSpinner = false) => {
        if (showLoadingSpinner) setLoading(true);
        try {
            const res = await fetch("/api/updates");
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    setStatus(json.data);
                    if (json.data.job?.status === "running") {
                        setUpdating(true);
                        setShowTerminal(true);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to fetch update status:", err);
        } finally {
            if (showLoadingSpinner) setLoading(false);
        }
    }, []);

    // Connect to SSE Stream
    const connectStream = useCallback(() => {
        if (eventSourceRef.current && eventSourceRef.current.readyState !== EventSource.CLOSED) {
            return;
        }

        const es = new EventSource("/api/updates/stream");
        eventSourceRef.current = es;

        es.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.type === "log") {
                    setLogs((prev) => [...prev, payload.data]);
                    // Auto-expand terminal whenever logs arrive
                    setShowTerminal(true);
                } else if (payload.type === "step") {
                    setActiveStep(payload.data.step || "running");
                    if (payload.data.message) {
                        setActionMessage({ type: "info", text: payload.data.message });
                    }
                    setShowTerminal(true);
                } else if (payload.type === "status") {
                    if (payload.data.status === "running") {
                        setUpdating(true);
                        setShowTerminal(true);
                    }
                } else if (payload.type === "done") {
                    setUpdating(false);
                    setRefreshing(false);
                    setChecking(false);
                    if (payload.data.success) {
                        setActionMessage({ type: "success", text: "Operation completed successfully." });
                        setActiveStep("completed");
                    } else {
                        setActionMessage({ type: "error", text: payload.data.error || "Operation encountered errors." });
                        setActiveStep("failed");
                    }
                    fetchStatus(false);
                }
            } catch {
                if (event.data) {
                    setLogs((prev) => [...prev, event.data]);
                    setShowTerminal(true);
                }
            }
        };

        es.onerror = () => {
            // Browser automatically attempts reconnect
        };
    }, [fetchStatus]);

    useEffect(() => {
        fetchStatus(true);
        const interval = setInterval(() => fetchStatus(false), 30000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    // Clean up SSE stream on unmount
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    // Autoscroll terminal
    useEffect(() => {
        if (autoScroll && terminalEndRef.current && showTerminal) {
            terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs, autoScroll, showTerminal]);

    // Handle "Check Updates" (live output)
    const handleCheckUpdates = async () => {
        setChecking(true);
        setActionMessage(null);
        setShowTerminal(true);
        connectStream();

        try {
            const res = await fetch("/api/updates/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh: false, stream: true }),
            });
            const data = await res.json();
            if (data.success) {
                setActionMessage({ type: "success", text: "Update check completed." });
                await fetchStatus(false);
            } else {
                setActionMessage({ type: "error", text: data.error || "Failed to check updates." });
            }
        } catch {
            setActionMessage({ type: "error", text: "Failed to connect to update service." });
        } finally {
            setChecking(false);
        }
    };

    // Handle "Refresh Cache" (apt update live output)
    const handleRefreshRepositories = async () => {
        setRefreshing(true);
        setActionMessage(null);
        setShowTerminal(true);
        connectStream();

        try {
            const res = await fetch("/api/updates/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh: true, stream: true }),
            });
            const data = await res.json();
            if (data.success) {
                setActionMessage({ type: "success", text: "Package cache refreshed successfully." });
                await fetchStatus(false);
            } else {
                setActionMessage({ type: "error", text: data.error || "Failed to refresh cache." });
            }
        } catch {
            setActionMessage({ type: "error", text: "Failed to connect to update service." });
        } finally {
            setRefreshing(false);
        }
    };

    // Handle "Update System Now"
    const handleStartUpdate = async () => {
        setShowConfirmModal(false);
        setUpdating(true);
        setShowTerminal(true);
        setLogs([]);
        setActiveStep("starting");
        setActionMessage({ type: "info", text: "Starting system update sequence..." });
        connectStream();

        try {
            const res = await fetch("/api/updates/apply", { method: "POST" });
            const data = await res.json();
            if (!data.success && res.status !== 409) {
                setActionMessage({ type: "error", text: data.error || data.message || "Failed to trigger update." });
                setUpdating(false);
            }
        } catch {
            setActionMessage({ type: "error", text: "Failed to trigger update job." });
            setUpdating(false);
        }
    };

    // Handle Reboot
    const handleReboot = async () => {
        setShowRebootModal(false);
        setRebooting(true);
        try {
            const res = await fetch("/api/updates/reboot", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                setActionMessage({ type: "success", text: "Host system reboot initiated. Dashboard will reconnect shortly." });
            } else {
                setActionMessage({ type: "error", text: data.error || "Failed to trigger reboot." });
            }
        } catch {
            setActionMessage({ type: "error", text: "Failed to send reboot request." });
        } finally {
            setRebooting(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedPkg(text);
        setTimeout(() => setCopiedPkg(null), 2000);
    };

    const allPackages = status?.packageDetails || [];
    const filteredPackages = allPackages.filter((pkg) => {
        const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (pkg.newVersion && pkg.newVersion.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;
        if (filterCategory === "security") return pkg.isSecurity;
        if (filterCategory === "standard") return !pkg.isSecurity;
        return true;
    });

    const totalCount = status?.updatesAvailable || 0;
    const securityCount = status?.securityUpdates || 0;
    const standardCount = Math.max(0, totalCount - securityCount);
    const rebootRequired = status?.rebootRequired || false;

    return (
        <div className="flex flex-col min-h-full py-6 animate-in fade-in duration-500 max-w-6xl space-y-8">
            {/* Standard Header matching other views */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">System Updates</h1>
                    <p className="text-gray-400">Monitor and install host operating system updates.</p>
                </div>

                {/* Primary Action Buttons matching standard layout */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Check Updates */}
                    <button
                        onClick={handleCheckUpdates}
                        disabled={checking || refreshing || updating}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors flex items-center gap-2 border border-white/10 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Check package list (apt list --upgradable)"
                    >
                        <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin text-primary" : ""}`} />
                        <span>Check Updates</span>
                    </button>

                    {/* Refresh Cache */}
                    <button
                        onClick={handleRefreshRepositories}
                        disabled={checking || refreshing || updating}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors flex items-center gap-2 border border-white/10 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Run apt update to fetch fresh package lists"
                    >
                        <RotateCcw className={`w-4 h-4 ${refreshing ? "animate-spin text-primary" : ""}`} />
                        <span>Refresh Cache</span>
                    </button>

                    {/* Update System */}
                    <button
                        onClick={() => setShowConfirmModal(true)}
                        disabled={updating || totalCount === 0}
                        className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
                            totalCount > 0 && !updating
                                ? "bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 shadow-sm shadow-primary/20"
                                : "bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed"
                        }`}
                        title="Upgrade all available packages"
                    >
                        <Download className={`w-4 h-4 ${updating ? "animate-bounce" : ""}`} />
                        <span>{updating ? "Updating..." : "Update System"}</span>
                    </button>
                </div>
            </header>

            {/* Notification / Alert Message Banner */}
            <AnimatePresence>
                {actionMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm ${
                            actionMessage.type === "success"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                                : actionMessage.type === "error"
                                ? "bg-red-500/10 border-red-500/20 text-red-300"
                                : "bg-primary/10 border-primary/20 text-primary"
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            {actionMessage.type === "success" && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                            {actionMessage.type === "error" && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                            {actionMessage.type === "info" && <RefreshCw className="w-4 h-4 text-primary animate-spin shrink-0" />}
                            <span>{actionMessage.text}</span>
                        </div>
                        <button
                            onClick={() => setActionMessage(null)}
                            className="p-1 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reboot Required Alert Banner */}
            {rebootRequired && (
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start md:items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                            <AlertTriangle className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-amber-300">System Reboot Required</h3>
                            <p className="text-xs text-amber-300/80 mt-0.5">
                                A kernel or core system library update has been installed. Restart your host laptop to apply the changes.
                                {status?.rebootReasons && status.rebootReasons.length > 0 && (
                                    <span className="block mt-1 font-mono text-[11px] text-amber-400/90 truncate max-w-xl">
                                        Triggered by: {status.rebootReasons.join(", ")}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowRebootModal(true)}
                        disabled={rebooting}
                        className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-medium text-xs rounded-lg transition-colors flex items-center gap-2 self-start md:self-auto shrink-0"
                    >
                        <RotateCcw className={`w-3.5 h-3.5 ${rebooting ? "animate-spin" : ""}`} />
                        <span>Reboot Laptop</span>
                    </button>
                </div>
            )}

            {/* Overview Metric Cards matching SettingsView / AppTile style */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Updates */}
                <div className="bg-surface/50 border border-white/5 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-gray-400">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Updates</span>
                        <Download className="w-4 h-4 text-primary" />
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{totalCount}</span>
                        <span className="text-xs text-gray-400">packages</span>
                    </div>
                </div>

                {/* Security Updates */}
                <div className="bg-surface/50 border border-white/5 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-gray-400">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Security Patches</span>
                        <ShieldAlert className={`w-4 h-4 ${securityCount > 0 ? "text-red-400" : "text-gray-500"}`} />
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                        <span className={`text-3xl font-bold ${securityCount > 0 ? "text-red-400" : "text-white"}`}>
                            {securityCount}
                        </span>
                        {securityCount > 0 && (
                            <span className="text-xs font-semibold bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
                                Urgent
                            </span>
                        )}
                    </div>
                </div>

                {/* Standard Updates */}
                <div className="bg-surface/50 border border-white/5 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-gray-400">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Standard Updates</span>
                        <Package className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{standardCount}</span>
                        <span className="text-xs text-gray-400">packages</span>
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-surface/50 border border-white/5 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between text-gray-400">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">System Status</span>
                        {totalCount === 0 ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                        )}
                    </div>
                    <div className="mt-4">
                        <span className={`text-sm font-semibold ${totalCount === 0 ? "text-emerald-400" : "text-amber-400"}`}>
                            {totalCount === 0 ? "Up to Date" : `${totalCount} Pending`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Upgradable Packages Section */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    {/* Tab Navigation matching SettingsView style */}
                    <div className="flex gap-2 overflow-x-auto">
                        <button
                            onClick={() => setFilterCategory("all")}
                            className={`px-3 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                                filterCategory === "all" ? "text-primary" : "text-gray-400 hover:text-white"
                            }`}
                        >
                            All ({totalCount})
                            {filterCategory === "all" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                        </button>
                        <button
                            onClick={() => setFilterCategory("security")}
                            className={`px-3 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                                filterCategory === "security" ? "text-red-400" : "text-gray-400 hover:text-white"
                            }`}
                        >
                            Security ({securityCount})
                            {filterCategory === "security" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-400" />}
                        </button>
                        <button
                            onClick={() => setFilterCategory("standard")}
                            className={`px-3 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
                                filterCategory === "standard" ? "text-primary" : "text-gray-400 hover:text-white"
                            }`}
                        >
                            Standard ({standardCount})
                            {filterCategory === "standard" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search packages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 pr-3 py-1.5 rounded-lg bg-surface border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 w-full md:w-60"
                        />
                    </div>
                </div>

                {/* Package Cards Display */}
                {loading ? (
                    <div className="flex items-center justify-center p-16 bg-surface/30 rounded-2xl border border-white/5">
                        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : filteredPackages.length === 0 ? (
                    <div className="p-16 text-center bg-surface/30 rounded-2xl border border-white/5">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400/80 mx-auto mb-3" />
                        <h3 className="text-base font-semibold text-white">No pending updates found</h3>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                            {searchQuery ? "No packages match your search query." : "All system packages are currently up to date on your host machine."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {filteredPackages.map((pkg, i) => (
                            <div
                                key={`${pkg.name}-${pkg.arch || i}`}
                                className="bg-surface/50 border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all flex flex-col justify-between gap-3 group backdrop-blur-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-white font-mono truncate group-hover:text-primary transition-colors">
                                                {pkg.name}
                                            </span>
                                            {pkg.arch && (
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
                                                    {pkg.arch}
                                                </span>
                                            )}
                                        </div>
                                        {pkg.suite && (
                                            <p className="text-[11px] text-gray-500 truncate font-mono">
                                                {pkg.suite}
                                            </p>
                                        )}
                                    </div>

                                    {/* Urgency Badge */}
                                    <div className="shrink-0 flex items-center gap-1.5">
                                        {pkg.isSecurity ? (
                                            <span className="text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <ShieldAlert className="w-3 h-3" />
                                                Security
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                                                Update
                                            </span>
                                        )}
                                        <button
                                            onClick={() => copyToClipboard(pkg.name)}
                                            className="p-1 rounded text-gray-500 hover:text-white transition-colors"
                                            title="Copy package name"
                                        >
                                            {copiedPkg === pkg.name ? (
                                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            ) : (
                                                <Copy className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Version Comparison Row */}
                                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                                    <span className="text-gray-400 truncate max-w-[45%]">
                                        {pkg.currentVersion ? `v${pkg.currentVersion}` : "installed"}
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                                    <span className="text-emerald-400 font-semibold truncate max-w-[45%] text-right">
                                        v{pkg.newVersion}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* LIVE EXECUTION CONSOLE / TERMINAL (Placed at the BOTTOM of the page) */}
            <div className="rounded-2xl border border-white/10 bg-[#070b13] overflow-hidden shadow-2xl mt-8">
                {/* Terminal Header */}
                <div
                    onClick={() => setShowTerminal(!showTerminal)}
                    className="px-4 py-3 bg-white/[0.03] border-b border-white/5 flex items-center justify-between gap-4 cursor-pointer select-none hover:bg-white/[0.05] transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono text-gray-300">
                            <Terminal className="w-4 h-4 text-primary" />
                            <span className="font-semibold">Live Execution Console</span>
                            <span className="text-gray-500 text-[11px]">({logs.length} lines)</span>
                            {updating && (
                                <span className="flex items-center gap-1 text-[11px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 ml-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                                    Active: {activeStep}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setAutoScroll(!autoScroll)}
                            className={`text-[11px] px-2 py-0.5 rounded transition-colors border ${
                                autoScroll
                                    ? "text-primary border-primary/30 bg-primary/10"
                                    : "text-gray-400 border-white/5 hover:text-white"
                            }`}
                            title="Toggle autoscroll"
                        >
                            Scroll: {autoScroll ? "ON" : "OFF"}
                        </button>
                        {logs.length > 0 && (
                            <button
                                onClick={() => setLogs([])}
                                className="text-xs text-gray-400 hover:text-white px-2.5 py-1 rounded hover:bg-white/5 transition-colors flex items-center gap-1.5"
                                title="Clear console output"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Clear</span>
                            </button>
                        )}
                        <button
                            onClick={() => setShowTerminal(!showTerminal)}
                            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            title={showTerminal ? "Collapse Terminal" : "Expand Terminal"}
                        >
                            {showTerminal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Terminal Body with auto-scroll and step progress */}
                {showTerminal && (
                    <div className="p-4 font-mono text-xs text-gray-300 max-h-96 overflow-y-auto space-y-1 custom-scrollbar bg-[#05080f]/95 select-text">
                        {/* Step progression pill bar */}
                        {updating && (
                            <div className="mb-3 p-3 rounded-lg bg-surface/80 border border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                                <span className={activeStep === "refreshing" ? "text-primary font-semibold" : ""}>1. apt update</span>
                                <ArrowRight className="w-3 h-3 text-gray-600" />
                                <span className={activeStep === "installing" ? "text-primary font-semibold" : ""}>2. apt upgrade</span>
                                <ArrowRight className="w-3 h-3 text-gray-600" />
                                <span className={activeStep === "cleaning" ? "text-primary font-semibold" : ""}>3. autoremove</span>
                                <ArrowRight className="w-3 h-3 text-gray-600" />
                                <span className={activeStep === "completed" ? "text-emerald-400 font-semibold" : ""}>4. Done</span>
                            </div>
                        )}

                        {logs.length === 0 ? (
                            <div className="text-gray-500 py-8 text-center text-xs">
                                Console is idle. Running Check Updates, Refresh Cache, or Update System will stream live output here.
                            </div>
                        ) : (
                            logs.map((line, i) => (
                                <div key={i} className="leading-relaxed hover:bg-white/[0.02] px-1 rounded break-all whitespace-pre-wrap">
                                    {line}
                                </div>
                            ))
                        )}
                        <div ref={terminalEndRef} />
                    </div>
                )}
            </div>

            {/* Confirmation Modal for Update System */}
            <AnimatePresence>
                {showConfirmModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md rounded-2xl bg-surface border border-white/10 p-6 shadow-2xl space-y-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                                    <Download className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Confirm System Update</h3>
                                    <p className="text-xs text-gray-400">Host Laptop Package Upgrade</p>
                                </div>
                            </div>

                            <p className="text-sm text-gray-300 leading-relaxed">
                                You are about to update <span className="text-white font-semibold">{totalCount} packages</span> on your host system
                                {securityCount > 0 && (
                                    <> including <span className="text-red-400 font-semibold">{securityCount} critical security patches</span></>
                                )}.
                            </p>

                            <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-gray-400 font-mono space-y-1">
                                <div>Command to execute:</div>
                                <div className="text-primary truncate">
                                    sudo apt update && sudo apt upgrade -y && sudo apt autoremove -y
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleStartUpdate}
                                    className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 rounded-lg transition-colors text-sm font-medium"
                                >
                                    Proceed & Update
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Confirmation Modal for Host Reboot */}
            <AnimatePresence>
                {showRebootModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md rounded-2xl bg-surface border border-amber-500/30 p-6 shadow-2xl space-y-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                    <RotateCcw className="w-5 h-5 animate-spin-slow" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Reboot Host Laptop</h3>
                                    <p className="text-xs text-amber-400/80">Restart system to apply updates</p>
                                </div>
                            </div>

                            <p className="text-sm text-gray-300 leading-relaxed">
                                Are you sure you want to reboot the host machine? All running docker services and active sessions will be temporarily restarted.
                            </p>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    onClick={() => setShowRebootModal(false)}
                                    className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReboot}
                                    className="px-4 py-2 rounded-lg text-sm bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-medium transition-all"
                                >
                                    Confirm Reboot
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
