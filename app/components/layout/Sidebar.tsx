"use client";

import { Home, LayoutGrid, BarChart2, Settings, Menu, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { NexLabIcon } from "@/app/components/icons/NexLabIcon";

export type TabId = 'home' | 'apps' | 'analytics' | 'updates' | 'settings';

interface SidebarProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
}

export function Sidebar({ activeTab, onTabChange, isExpanded, onToggleExpand }: SidebarProps) {
    // Auto-collapse on mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768 && isExpanded) {
                onToggleExpand();
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isExpanded, onToggleExpand]);

    // Check for app updates (GitHub release)
    const [updateAvailable, setUpdateAvailable] = useState(false);
    useEffect(() => {
        const checkUpdates = async () => {
            try {
                const res = await fetch('/api/check-update');
                const data = await res.json();
                if (data.updateAvailable) {
                    setUpdateAvailable(true);
                }
            } catch (err) {
                console.error('Failed to check for updates:', err);
            }
        };

        // Check on mount
        checkUpdates();

        // Re-check every hour
        const interval = setInterval(checkUpdates, 3600000);
        return () => clearInterval(interval);
    }, []);

    // Check for host OS system updates
    const [systemUpdates, setSystemUpdates] = useState<{ total: number; security: number; reboot: boolean }>({
        total: 0,
        security: 0,
        reboot: false,
    });

    useEffect(() => {
        const fetchSystemUpdates = async () => {
            try {
                const res = await fetch('/api/updates');
                const json = await res.json();
                if (json.success && json.data) {
                    setSystemUpdates({
                        total: json.data.updatesAvailable || 0,
                        security: json.data.securityUpdates || 0,
                        reboot: json.data.rebootRequired || false,
                    });
                }
            } catch {
                // ignore
            }
        };

        fetchSystemUpdates();
        const interval = setInterval(fetchSystemUpdates, 60000); // 1 min poll
        return () => clearInterval(interval);
    }, []);

    const navItems = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'apps', label: 'Apps', icon: LayoutGrid },
        { id: 'analytics', label: 'Analytics', icon: BarChart2 },
        { id: 'updates', label: 'Updates', icon: RefreshCw },
        { id: 'settings', label: 'Settings', icon: Settings },
    ] as const;

    return (
        <motion.div
            initial={false}
            animate={{ width: isExpanded ? 240 : 64 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative h-screen bg-background flex flex-col z-50 border-r border-white/5"
        >
            {/* Toggle / Header */}
            <motion.div layout className={`h-16 flex items-center ${isExpanded ? 'justify-between px-4' : 'justify-center'} mb-2 overflow-hidden`}>
                <AnimatePresence mode="wait">
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center gap-3 whitespace-nowrap overflow-hidden"
                        >
                            <NexLabIcon className="w-8 h-8 text-primary shrink-0" />
                            <span className="text-xl font-bold text-white">NexLab</span>
                        </motion.div>
                    )}
                </AnimatePresence>
                <motion.button
                    layout
                    onClick={onToggleExpand}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </motion.button>
            </motion.div>

            {/* Navigation */}
            <div className="flex-1 flex flex-col gap-1 px-2">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                        <div key={item.id} className="relative">
                            <motion.button
                                layout
                                onClick={() => onTabChange(item.id)}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className={`
                                    relative w-full flex items-center py-3 rounded-lg transition-colors duration-200 group overflow-hidden
                                    ${isExpanded ? 'pl-[14px] pr-3' : 'pl-[14px]'} 
                                    ${isActive
                                        ? 'bg-surface-highlight text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }
                                `}
                            >
                                <motion.div layout className="relative flex items-center justify-center shrink-0">
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''} transition-colors`} />
                                    {!isExpanded && item.id === 'updates' && systemUpdates.total > 0 && (
                                        <span className={`w-2 h-2 rounded-full absolute -top-1 -right-1 ${systemUpdates.security > 0 ? 'bg-red-400' : 'bg-primary'} animate-pulse`} />
                                    )}
                                </motion.div>

                                <AnimatePresence mode="wait">
                                    {isExpanded && (
                                        <motion.span
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: "auto" }}
                                            exit={{ opacity: 0, width: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="ml-3 font-medium whitespace-nowrap overflow-hidden"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>

                                {isExpanded && item.id === 'updates' && systemUpdates.total > 0 && (
                                    <motion.span
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                            systemUpdates.security > 0
                                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                : 'bg-primary/20 text-primary border border-primary/30'
                                        }`}
                                    >
                                        {systemUpdates.total}
                                    </motion.span>
                                )}

                                {!isExpanded && (
                                    <div className="absolute left-full ml-2 px-3 py-1.5 bg-surface-highlight rounded-md text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-lg">
                                        {item.label}
                                        {item.id === 'updates' && systemUpdates.total > 0 && ` (${systemUpdates.total})`}
                                    </div>
                                )}
                            </motion.button>
                        </div>
                    );
                })}
            </div>

            {/* Version / Updates Footer */}
            <div className="p-3 border-t border-white/5">
                <div className={`flex items-center ${isExpanded ? 'justify-between px-2' : 'justify-center'} text-xs text-gray-500`}>
                    <AnimatePresence mode="wait">
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col"
                            >
                                <span className="font-medium">Version {process.env.NEXT_PUBLIC_APP_VERSION}</span>
                                {updateAvailable && (
                                    <a
                                        href={process.env.NEXT_PUBLIC_GIT_URL + '/releases'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline flex items-center gap-1 mt-0.5"
                                    >
                                        Update Available
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    </a>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!isExpanded && updateAvailable && (
                        <div className="relative">
                            <span className="w-2 h-2 rounded-full bg-primary absolute -top-1 -right-1 animate-pulse" />
                            <Settings className="w-4 h-4" />
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
