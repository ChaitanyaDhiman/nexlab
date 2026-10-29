import { App } from "@/app/types/apps";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { ServiceHealthIndicator } from "@/app/components/apps/ServiceHealthIndicator";
import { getIconComponent } from "@/app/lib/iconUtils";
import { usageTracker } from "@/app/lib/usageTracker";
import { createElement } from "react";

interface AppTileProps {
    app: App;
    tileSize?: 'small' | 'medium' | 'large';
}

export function AppTile({ app, tileSize = 'medium' }: AppTileProps) {
    const IconComponent = getIconComponent(app.icon);
    const isSmall = tileSize === 'small';

    const handleClick = () => {
        usageTracker.trackAppOpen(app.id);
    };

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`glass-card group relative overflow-hidden rounded-xl transition-all h-full ${isSmall ? 'p-3' : 'p-6'
                }`}
        >
            <Link
                href={app.url}
                target="_blank"
                onClick={handleClick}
                className={`block h-full w-full relative ${isSmall ? 'flex items-center gap-3' : ''}`}
            >
                <div className={`rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors ${isSmall ? 'p-2' : 'p-3 mb-4 inline-block'
                    }`}>
                    {createElement(IconComponent, {
                        className: `${isSmall ? 'w-5 h-5' : 'w-8 h-8'} text-[var(--primary)]`
                    })}
                </div>

                <div className={`absolute ${isSmall ? 'right-0 top-1/2 -translate-y-1/2 scale-75 origin-right' : 'top-0 right-0'
                    }`}>
                    <ServiceHealthIndicator serviceId={app.id} />
                </div>

                <div className={`${isSmall ? 'flex-1 min-w-0 pr-6' : 'space-y-2'}`}>
                    <h3 className={`font-semibold text-white group-hover:text-[var(--primary)] transition-colors ${isSmall ? 'text-sm truncate' : 'text-lg'
                        }`}>
                        {app.name}
                    </h3>
                    {!isSmall && (
                        <p className="text-sm text-gray-400 group-hover:text-gray-300 line-clamp-2 pr-6">
                            {app.description}
                        </p>
                    )}
                </div>

                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                </div>

                <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500 -z-10" />
            </Link>
        </motion.div>
    );
}
