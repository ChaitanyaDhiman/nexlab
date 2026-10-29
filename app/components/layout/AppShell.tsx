"use client";

import { useState } from "react";
import { Sidebar, TabId } from "./Sidebar";
import { HomeView } from "@/app/components/views/HomeView";
import { AppsView } from "@/app/components/views/AppsView";
import { AnalyticsView } from "@/app/components/views/AnalyticsView";
import { UpdatesView } from "@/app/components/views/UpdatesView";
import { SettingsView } from "@/app/components/views/SettingsView";
import { motion, AnimatePresence } from "framer-motion";

export function AppShell() {
    const [activeTab, setActiveTab] = useState<TabId>('home');
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [settingsTab, setSettingsTab] = useState<'appearance' | 'apps'>('appearance');

    const navigateToAppsManagement = () => {
        setSettingsTab('apps');
        setActiveTab('settings');
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
            <Sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isExpanded={isSidebarExpanded}
                onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
            />

            <main className="flex-1 overflow-auto relative w-full bg-surface">
                <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {activeTab === 'home' && <HomeView />}
                            {activeTab === 'apps' && <AppsView onNavigateToSettings={navigateToAppsManagement} />}
                            {activeTab === 'analytics' && <AnalyticsView />}
                            {activeTab === 'updates' && <UpdatesView />}
                            {activeTab === 'settings' && <SettingsView initialTab={settingsTab} />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
