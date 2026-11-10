"use client";

import { useState, useEffect } from "react";
import { App } from "@/app/types/apps";
import { X, Search, Link as LinkIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";
import Image from "next/image";
import { NexLabIcon } from "@/app/components/icons/NexLabIcon";
import { OllamaIcon } from "@/app/components/icons/OllamaIcon";

interface AppEditorProps {
    app: App | null;
    onSave: (app: App) => void;
    onCancel: () => void;
}

// Get all Lucide icons dynamically
const getAllLucideIcons = () => {
    return Object.keys(LucideIcons)
        .filter(
            key =>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                typeof (LucideIcons as any)[key] === 'object' &&
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (LucideIcons as any)[key].$$typeof &&
                !key.startsWith('create') &&
                !key.startsWith('Icon')
        )
        .sort();
};

// Custom icons from components/icons folder
const CUSTOM_ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
    NexLabIcon,
    OllamaIcon,
};
const CUSTOM_ICONS = Object.keys(CUSTOM_ICON_COMPONENTS);

export function AppEditor({ app, onSave, onCancel }: AppEditorProps) {
    const [id, setId] = useState(app?.id || "");
    const [name, setName] = useState(app?.name || "");
    const [description, setDescription] = useState(app?.description || "");
    const [url, setUrl] = useState(app?.url || "");
    const [icon, setIcon] = useState(app?.icon || "Box");
    const [healthCheckUrl, setHealthCheckUrl] = useState(app?.healthCheckUrl || "");
    const [isFavorite, setIsFavorite] = useState(app?.isFavorite || false);
    const [iconSearch, setIconSearch] = useState("");
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [iconMode, setIconMode] = useState<'lucide' | 'custom' | 'url'>('lucide');
    const [iconUrl, setIconUrl] = useState("");
    const [allLucideIcons] = useState(getAllLucideIcons());

    useEffect(() => {
        if (app) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setId(app.id);
            setName(app.name);
            setDescription(app.description);
            setUrl(app.url);
            setIcon(app.icon);
            setHealthCheckUrl(app.healthCheckUrl || "");
            setIsFavorite(app.isFavorite || false);

            // Detect icon type
            if (app.icon.startsWith('http://') ||
                app.icon.startsWith('https://') ||
                app.icon.startsWith('/') ||
                app.icon.startsWith('data:') ||
                app.icon.trim().startsWith('<svg')) {
                setIconMode('url');
                setIconUrl(app.icon);
            } else if (CUSTOM_ICONS.includes(app.icon)) {
                setIconMode('custom');
            } else {
                setIconMode('lucide');
            }
        }
    }, [app]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!id || !name || !url) {
            alert("Please fill in all required fields");
            return;
        }

        // Use iconUrl if in URL mode, otherwise use icon name
        const finalIcon = iconMode === 'url' ? iconUrl : icon;

        if (iconMode === 'url' && !iconUrl) {
            alert("Please provide an icon URL");
            return;
        }

        onSave({
            id,
            name,
            description,
            url,
            icon: finalIcon,
            healthCheckUrl: healthCheckUrl || undefined,
            isFavorite,
        });
    };

    const filteredLucideIcons = allLucideIcons.filter(iconName =>
        iconName.toLowerCase().includes(iconSearch.toLowerCase())
    );

    const filteredCustomIcons = CUSTOM_ICONS.filter(iconName =>
        iconName.toLowerCase().includes(iconSearch.toLowerCase())
    );



    // Render icon preview
    const renderIconPreview = () => {
        if (iconMode === 'url' && iconUrl) {
            let src = iconUrl;
            if (iconUrl.trim().startsWith('<svg')) {
                src = `data:image/svg+xml;utf8,${encodeURIComponent(iconUrl)}`;
            }
            return (
                <div className="w-5 h-5 relative">
                    <Image src={src} alt="Icon" fill className="object-contain" unoptimized />
                </div>
            );
        }

        if (CUSTOM_ICON_COMPONENTS[icon]) {
            const IconComponent = CUSTOM_ICON_COMPONENTS[icon];
            return <IconComponent className="w-5 h-5" />;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const IconComponent = (LucideIcons as any)[icon] || LucideIcons.Box;
        return <IconComponent className="w-5 h-5" />;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-surface rounded-lg max-w-2xl w-full p-6 space-y-4 my-8">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">
                        {app ? "Edit App" : "Add App"}
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
                                disabled={!!app}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary disabled:opacity-50"
                                placeholder="e.g., jellyfin, plex"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                                placeholder="e.g., Jellyfin"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                            placeholder="Brief description of the app"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            URL <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary font-mono text-sm"
                            placeholder="https://app.example.com or ${NEXT_PUBLIC_SERVICE_NAME_URL}"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Use ${"{VAR_NAME}"} for environment variables
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Health Check URL
                        </label>
                        <input
                            type="text"
                            value={healthCheckUrl}
                            onChange={(e) => setHealthCheckUrl(e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary font-mono text-sm"
                            placeholder="Optional - defaults to URL"
                        />
                    </div>

                    {/* Favorite Toggle */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="favorite-toggle"
                            checked={isFavorite}
                            onChange={(e) => setIsFavorite(e.target.checked)}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer"
                        />
                        <label htmlFor="favorite-toggle" className="text-sm text-gray-300 cursor-pointer select-none">
                            Mark as Favorite
                        </label>
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
                                {renderIconPreview()}
                                <span className="truncate">{iconMode === 'url' ? iconUrl || 'Select URL' : icon}</span>
                            </button>

                            {showIconPicker && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-white/10 rounded-lg p-4 shadow-xl z-10 max-h-96 overflow-y-auto">
                                    {/* Icon Mode Tabs */}
                                    <div className="flex gap-2 mb-4 border-b border-white/10 pb-2">
                                        <button
                                            type="button"
                                            onClick={() => setIconMode('lucide')}
                                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${iconMode === 'lucide'
                                                ? 'bg-primary text-white'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                }`}
                                        >
                                            Lucide Icons
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIconMode('custom')}
                                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${iconMode === 'custom'
                                                ? 'bg-primary text-white'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                }`}
                                        >
                                            Custom Icons
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIconMode('url')}
                                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${iconMode === 'url'
                                                ? 'bg-primary text-white'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                }`}
                                        >
                                            URL
                                        </button>
                                    </div>

                                    {/* URL Input Mode */}
                                    {iconMode === 'url' && (
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input
                                                    type="text"
                                                    value={iconUrl}
                                                    onChange={(e) => setIconUrl(e.target.value)}
                                                    className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary text-sm font-mono"
                                                    placeholder="https://... or /icons/..."
                                                />
                                            </div>
                                            {iconUrl && (
                                                <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                                                    <div className="w-8 h-8 relative">
                                                        <Image
                                                            src={iconUrl.trim().startsWith('<svg') ? `data:image/svg+xml;utf8,${encodeURIComponent(iconUrl)}` : iconUrl}
                                                            alt="Preview"
                                                            fill
                                                            className="object-contain"
                                                            unoptimized
                                                        />
                                                    </div>
                                                    <span className="text-sm text-gray-400">Preview</span>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (iconUrl) {
                                                        setIcon(iconUrl);
                                                        setShowIconPicker(false);
                                                    }
                                                }}
                                                className="w-full px-4 py-2 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                                            >
                                                Use This URL
                                            </button>
                                        </div>
                                    )}

                                    {/* Icon Picker Mode */}
                                    {(iconMode === 'lucide' || iconMode === 'custom') && (
                                        <>
                                            <div className="mb-3">
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

                                            {iconMode === 'lucide' && (
                                                <div className="grid grid-cols-8 gap-2">
                                                    {filteredLucideIcons.slice(0, 200).map((iconName) => {
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
                                            )}

                                            {iconMode === 'custom' && (
                                                <div className="grid grid-cols-6 gap-2">
                                                    {filteredCustomIcons.map((iconName) => (
                                                        <button
                                                            key={iconName}
                                                            type="button"
                                                            onClick={() => {
                                                                setIcon(iconName);
                                                                setShowIconPicker(false);
                                                                setIconSearch("");
                                                            }}
                                                            className={`p-3 rounded-lg hover:bg-white/10 transition-colors flex flex-col items-center gap-1 ${icon === iconName ? 'bg-primary/20 border border-primary' : 'border border-transparent'
                                                                }`}
                                                        >
                                                            <span className="text-xs text-gray-400">{iconName}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {iconMode === 'lucide' && filteredLucideIcons.length > 200 && (
                                                <p className="text-xs text-gray-500 mt-2 text-center">
                                                    Showing first 200 results. Use search to find more.
                                                </p>
                                            )}
                                        </>
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
                            {app ? "Update" : "Add"} App
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
