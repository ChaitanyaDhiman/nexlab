
"use client";

import { Github, Shield, Code2, FileCode, Server } from 'lucide-react';
import Link from 'next/link';
import { metadata } from '@/app/config/metadata';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface UpdateInfo {
    updateAvailable: boolean;
    currentVersion: string;
    latestVersion: string;
    url?: string;
    error?: string;
}

export function AboutSection() {
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkUpdates = async () => {
            try {
                const res = await fetch('/api/check-update');
                const data = await res.json();
                setUpdateInfo(data);
            } catch (err) {
                console.error('Failed to check for updates:', err);
                setUpdateInfo({
                    updateAvailable: false,
                    currentVersion: metadata.version || 'Unknown',
                    latestVersion: metadata.version || 'Unknown',
                    error: 'Failed to check'
                });
            } finally {
                setChecking(false);
            }
        };

        checkUpdates();
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-4xl mx-auto space-y-8 pb-10"
        >
            {/* Header Section */}
            <motion.div variants={item} className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between border-b border-white/5 pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                            <Server className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white tracking-tight">{metadata.appName}</h2>
                            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                <span>v{metadata.version}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-600" />
                                <span className="uppercase tracking-wider text-xs font-medium bg-secondary/10 text-secondary px-2 py-0.5 rounded-full border border-secondary/20">Stable</span>

                                {!checking && updateInfo && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                                        {updateInfo.updateAvailable ? (
                                            <Link
                                                href={updateInfo.url || metadata.links.github || '#'}
                                                target="_blank"
                                                className="uppercase tracking-wider text-xs font-medium bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 hover:bg-amber-500/20 transition-colors flex items-center gap-1"
                                            >
                                                Out of date
                                                <span className="opacity-75 normal-case ml-1">({updateInfo.latestVersion})</span>
                                            </Link>
                                        ) : (
                                            <span className="uppercase tracking-wider text-xs font-medium bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20">Latest</span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {metadata.links.github && (
                        <Link
                            href={metadata.links.github}
                            target="_blank"
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-sm font-medium text-gray-300 hover:text-white"
                        >
                            <Github className="w-4 h-4" />
                            GitHub
                        </Link>
                    )}
                    <Link
                        href={metadata.links.documentation || '#'}
                        target="_blank"
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-colors text-sm font-medium text-primary"
                    >
                        <FileCode className="w-4 h-4" />
                        Documentation
                    </Link>
                </div>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column - Description & Tech */}
                <motion.div variants={item} className="md:col-span-2 space-y-8">
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-400" />
                            Project Overview
                        </h3>
                        <p className="text-gray-400 leading-relaxed text-base">
                            {metadata.description}
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Code2 className="w-5 h-5 text-blue-400" />
                            Tech Stack
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {metadata.techStack.map((tech) => (
                                <Link
                                    key={tech.name}
                                    href={tech.url}
                                    target="_blank"
                                    className="px-3 py-1.5 bg-surface/50 border border-white/5 hover:border-white/10 rounded-md text-sm text-gray-400 hover:text-white transition-colors"
                                >
                                    {tech.name}
                                </Link>
                            ))}
                        </div>
                    </section>
                </motion.div>

                {/* Right Column - Stats & Info */}
                <motion.div variants={item} className="space-y-6">
                    <div className="bg-surface/30 border border-white/5 rounded-2xl p-6 space-y-6 backdrop-blur-sm">

                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">License</span>
                            <div className="flex items-center gap-2 text-gray-200">
                                <span className="font-medium">{metadata.license}</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Author</span>
                            <div className="flex items-center gap-2">
                                <Link href={metadata.author.url} className="text-primary hover:underline font-medium">
                                    {metadata.author.name}
                                </Link>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>© {metadata.year}</span>
                                <span>All rights reserved</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
