"use client";

import { useState, useEffect } from "react";
import { StorageDrive, StorageDriveConfig } from "@/app/types/storage";
import { X, Search } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface StorageEditorProps {
    drive: StorageDrive | StorageDriveConfig | null;
    onSave: (drive: StorageDriveConfig) => void;
    onCancel: () => void;
}

// Get all Lucide icons dynamically
const getAllLucideIcons = () => {
    const icons = LucideIcons as unknown as Record<string, { $$typeof?: unknown }>;
    return Object.keys(icons)
        .filter(
            key =>
                typeof icons[key] === 'object' &&
                icons[key] !== null &&
                Boolean(icons[key].$$typeof) &&
                !key.startsWith('create') &&
                !key.startsWith('Icon')
        )
        .sort();
};

export function StorageEditor({ drive, onSave, onCancel }: StorageEditorProps) {
    const [id, setId] = useState(drive?.id || "");
    const [name, setName] = useState(drive?.name || "");
    const [label, setLabel] = useState(drive?.label || "");
    const [mount, setMount] = useState(drive?.mount || "");
    const [icon, setIcon] = useState(drive?.icon || "HardDrive");
    const [iconSearch, setIconSearch] = useState("");
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [allLucideIcons] = useState(getAllLucideIcons());

    useEffect(() => {
        if (drive) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setId(drive.id);
            setName(drive.name);
            setLabel(drive.label);
            setMount(drive.mount);
            setIcon(drive.icon || "HardDrive");
        }
    }, [drive]);

     
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!id || !name || !label || !mount) {
            alert("Please fill in all required fields");
            return;
        }

        onSave({
            id,
            name,
            label,
            mount,
            icon,
            // Preserve fallback if it exists, though UI doesn't edit it currently
            fallback: drive?.fallback,
        });
    };

    const filteredIcons = allLucideIcons.filter(iconName =>
        iconName.toLowerCase().includes(iconSearch.toLowerCase())
    );

    const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[icon] || LucideIcons.HardDrive;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-surface rounded-lg max-w-2xl w-full p-6 space-y-4 my-8">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">
                        {drive ? "Edit Drive" : "Add Drive"}
                    </h3>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                ID <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={id}
                                onChange={(e) => setId(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                disabled={!!drive}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary disabled:opacity-50"
                                placeholder="e.g., main, backup"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Name/Key <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                                placeholder="e.g., main"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Label (Display Name) <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                            placeholder="e.g., Main Storage"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Mount Point <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={mount}
                            onChange={(e) => setMount(e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary font-mono text-sm"
                            placeholder="e.g., / or /mnt/data"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Icon <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowIconPicker(!showIconPicker)}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                            >
                                <IconComponent className="w-5 h-5" />
                                <span className="truncate">{icon}</span>
                            </button>

                            {showIconPicker && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-white/10 rounded-lg p-4 shadow-xl z-10 max-h-64 overflow-y-auto">
                                    <div className="mb-3 sticky top-0 bg-surface pb-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="text"
                                                value={iconSearch}
                                                onChange={(e) => setIconSearch(e.target.value)}
                                                className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary text-sm"
                                                placeholder="Search icons..."
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-8 gap-2">
                                        {filteredIcons.slice(0, 200).map((iconName) => {
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            const Icon = (LucideIcons as any)[iconName];
                                            return (
                                                <button
                                                    key={iconName}
                                                    type="button"
                                                    onClick={() => {
                                                        setIcon(iconName);
                                                        setShowIconPicker(false);
                                                        setIconSearch("");
                                                    }}
                                                    className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${icon === iconName ? 'bg-primary/20 border border-primary' : 'border border-transparent'
                                                        }`}
                                                    title={iconName}
                                                >
                                                    <Icon className="w-5 h-5" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {filteredIcons.length > 200 && (
                                        <p className="text-xs text-gray-500 mt-2 text-center">
                                            Showing first 200 results. Use search to find more.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                        >
                            {drive ? "Update" : "Add"} Drive
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
