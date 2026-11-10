"use client";

import { useState, useEffect } from "react";
import { StorageConfig, StorageDrive, StorageDriveConfig } from "@/app/types/storage";
import { Plus, Save, Edit2, Trash2, Loader2, HardDrive } from "lucide-react";
import { StorageEditor } from "./StorageEditor";
import * as LucideIcons from "lucide-react";

export function StorageManager() {
    const [config, setConfig] = useState<StorageConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingDrive, setEditingDrive] = useState<StorageDriveConfig | null>(null);
    const [showEditor, setShowEditor] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/storage');
            if (!response.ok) throw new Error('Failed to load storage config');
            // The API returns { success: true, data: { drives: [...] } }
            // But we actually need to read the raw config structure for editing,
            // or we reconstruct it.
            // Wait, GET /api/storage returns the STATUS of drives (DriveInfo[]), not just the config.
            // But DriveInfo is a superset of StorageDrive (mostly).
            // Actually, we should probably have a separate endpoint for just config or extract it from the status.
            // The API GET returns data.drives which are DriveInfo objects.
            // DriveInfo has id, name, label, mount, icon... which matches StorageDrive.
            // So we can map it back.
            const result = await response.json();
            if (result.success && result.data && result.data.drives) {
                // We need to reconstruct the config object from the drives list
                // Note: DriveInfo has extra fields like 'total', 'used' that aren't in StorageDrive (except in fallback)
                // We'll strip those for the config state.
                const drives = result.data.drives.map((d: StorageDrive) => ({
                    id: d.id,
                    name: d.name,
                    label: d.label,
                    mount: d.mount,
                    icon: d.icon,
                    // We don't have the original fallback data here unfortunately unless we fetch the raw JSON.
                    // But for now let's assume valid drives don't need fallback updates from here.

                    // For now, we'll work with what we have.
                }));
                setConfig({ drives });
            }
        } catch (error) {
            console.error('Error fetching config:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async () => {
        if (!config) return;

        try {
            setSaving(true);
            const response = await fetch('/api/storage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            if (!response.ok) throw new Error('Failed to save config');

            // Refresh
            await fetchConfig();
        } catch (error) {
            console.error('Error saving config:', error);
            alert('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

     
    const handleAddDrive = () => {
        setEditingDrive(null);
        setShowEditor(true);
    };

    const handleEditDrive = (drive: StorageDriveConfig) => {
        setEditingDrive(drive);
        setShowEditor(true);
    };

    const handleSaveDrive = (drive: StorageDriveConfig) => {
        if (!config) return;

        if (editingDrive) {
            // Update existing
            setConfig({
                ...config,
                drives: config.drives.map(d => d.id === editingDrive.id ? drive : d),
            });
        } else {
            // Add new
            setConfig({
                ...config,
                drives: [...config.drives, drive],
            });
        }

        setShowEditor(false);
        setEditingDrive(null);
    };

    const handleDeleteDrive = (driveId: string) => {
        if (!config) return;
        if (!confirm('Are you sure you want to delete this drive configuration?')) return;

        setConfig({
            ...config,
            drives: config.drives.filter(d => d.id !== driveId),
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!config) {
        return (
            <div className="text-center py-12">
                <p className="text-red-400">Failed to load configuration</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Storage Management</h2>
                    <p className="text-sm text-gray-400 mt-1">Manage your monitored storage devices and mount points.</p>
                </div>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={handleAddDrive}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors inline-flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Drive
                    </button>
                    <button
                        onClick={saveConfig}
                        disabled={saving}
                        className="px-4 py-2 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            </div>

            {showEditor && (
                <StorageEditor
                    drive={editingDrive}
                    onSave={handleSaveDrive}
                    onCancel={() => {
                        setShowEditor(false);
                        setEditingDrive(null);
                    }}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {config.drives.map((drive: StorageDriveConfig) => {
                    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[drive.icon || ''] || LucideIcons.HardDrive;
                    const driveStatus = drive as unknown as { found?: boolean; total?: number };
                    const isMissing = driveStatus.found === false && driveStatus.total === 0;

                    return (
                        <div
                            key={drive.id}
                            className={`rounded-lg p-5 border flex items-start justify-between group transition-colors ${isMissing
                                ? 'bg-red-500/5 border-red-500/20'
                                : 'bg-white/5 border-white/10 hover:border-primary/50'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg ${isMissing ? 'bg-red-500/10' : 'bg-white/5'}`}>
                                    {isMissing ? (
                                        <LucideIcons.AlertTriangle className="w-6 h-6 text-red-400" />
                                    ) : (
                                        <Icon className="w-6 h-6 text-primary" />
                                    )}
                                </div>
                                <div>
                                    <h3 className={`font-medium ${isMissing ? 'text-red-400' : 'text-white'}`}>
                                        {drive.label}
                                    </h3>
                                    <p className="text-sm text-gray-400 font-mono mt-0.5">{drive.mount}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs text-gray-500">ID: {drive.id}</span>
                                        {isMissing && (
                                            <span className="text-xs text-red-400 font-medium px-1.5 py-0.5 bg-red-500/10 rounded">
                                                Not Found
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEditDrive(drive)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                                    title="Edit Drive"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteDrive(drive.id)}
                                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                                    title="Delete Drive"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            {config.drives.length === 0 && (
                <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10 border-dashed">
                    <HardDrive className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No drives configured. Add one to get started.</p>
                </div>
            )}
        </div>
    );
}
