import React, { useEffect, useRef, useState } from 'react';
import { Song, FileInfo } from '../types';
import { Spinner } from './Spinner';
import { DifficultySelector } from './DifficultySelector';
import { FileTable } from './FileTable';
import { AudioPlayerControl } from './AudioPlayerControl';
import { ArrowDownTrayIcon, ChevronDownIcon } from './Icons';
import { useSettings } from '../contexts/SettingsContext';

export interface ExportState {
    type: 'phira' | 'chart' | null;
    progress: number;
}

interface SongWorkspaceProps {
    song: Song | null;
    bgImage: string | null;
    isBgLoaded: boolean;
    audio: HTMLAudioElement | null;
    files: FileInfo[];
    isLoadingFiles: boolean;
    difficulties: string[];
    selectedDifficulty: string | null;
    onSelectDifficulty: (difficulty: string) => void;
    exportState: ExportState;
    onExportChart: () => void;
    onExportAllAssets: () => void;
    onDownloaded: (fileName: string) => void;
}

// How far (px) the file list has to scroll before the illustration is fully dimmed.
const DIM_DISTANCE = 320;
const MAX_DIM = 0.85;
// Max distance (px) the illustration drifts from centre while following the pointer. Must stay below the -inset-6 bleed.
const PARALLAX_SHIFT = 14;

const ProgressBar: React.FC<{ progress: number; className: string }> = ({ progress, className }) => (
    <div className={`absolute bottom-0 left-0 h-[3px] transition-[width] duration-150 ${className}`} style={{ width: `${progress.toFixed(0)}%` }} />
);

export const SongWorkspace: React.FC<SongWorkspaceProps> = ({
    song,
    bgImage,
    isBgLoaded,
    audio,
    files,
    isLoadingFiles,
    difficulties,
    selectedDifficulty,
    onSelectDifficulty,
    exportState,
    onExportChart,
    onExportAllAssets,
    onDownloaded,
}) => {
    const { settings } = useSettings();
    const [scrollTop, setScrollTop] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const parallaxRef = useRef<HTMLDivElement>(null);
    const parallaxEnabled = settings.newUiBackgroundParallax;

    // Jump back to the workspace when switching songs.
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
    }, [song?.id]);

    // Illustration drifts slightly toward the pointer. Mouse/trackpad only; skipped for reduced motion.
    useEffect(() => {
        const el = parallaxRef.current;
        if (!el) return;
        el.style.transform = '';
        if (!parallaxEnabled) return;
        const mql = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
        if (!mql.matches) return;

        let targetX = 0, targetY = 0, x = 0, y = 0, frame = 0;
        const tick = () => {
            x += (targetX - x) * 0.08;
            y += (targetY - y) * 0.08;
            el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
            frame = Math.abs(targetX - x) > 0.05 || Math.abs(targetY - y) > 0.05 ? requestAnimationFrame(tick) : 0;
        };
        const handleMove = (e: PointerEvent) => {
            if (e.pointerType !== 'mouse') return;
            targetX = (e.clientX / window.innerWidth - 0.5) * -2 * PARALLAX_SHIFT;
            targetY = (e.clientY / window.innerHeight - 0.5) * -2 * PARALLAX_SHIFT;
            if (!frame) frame = requestAnimationFrame(tick);
        };
        const handleLeave = () => {
            targetX = targetY = 0;
            if (!frame) frame = requestAnimationFrame(tick);
        };
        window.addEventListener('pointermove', handleMove);
        document.documentElement.addEventListener('pointerleave', handleLeave);
        return () => {
            window.removeEventListener('pointermove', handleMove);
            document.documentElement.removeEventListener('pointerleave', handleLeave);
            cancelAnimationFrame(frame);
        };
    }, [parallaxEnabled]);

    const scrollToFiles = () => {
        const el = scrollRef.current;
        el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    };

    const isExporting = exportState.type !== null;
    const dim = Math.min(scrollTop / DIM_DISTANCE, 1) * MAX_DIM;

    return (
        <div className="relative h-full min-h-0 overflow-hidden bg-[#f3f5f3]">
            {/* Illustration layer with soft JR-paper fade */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,#e9eee9_0_10px,#e2e8e3_10px_20px)]" />
            <div ref={parallaxRef} className="absolute -inset-6 will-change-transform" aria-hidden="true">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-[opacity,transform] duration-700 ease-out"
                    style={{
                        backgroundImage: bgImage ? `url("${bgImage}")` : 'none',
                        opacity: isBgLoaded ? 1 : 0,
                        transform: isBgLoaded ? 'scale(1)' : 'scale(1.04)',
                    }}
                />
            </div>
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(243,245,243,0.18)_10%,rgba(243,245,243,0.78)_48%,#f3f5f3_78%)]" />
            <div className="absolute inset-0 pointer-events-none bg-[#f3f5f3]" style={{ opacity: dim }} />

            <div
                ref={scrollRef}
                onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
                className="absolute inset-0 overflow-y-auto thin-scroll"
            >
                {!song ? (
                    <div className="min-h-full flex flex-col justify-end gap-2 px-5 sm:px-10 pb-12">
                        <span className="font-mono text-[11px] font-semibold tracking-[.14em] text-[#008c3c]">NO SONG SELECTED</span>
                        <span className="text-[32px] sm:text-[52px] font-bold leading-[1.15] tracking-[-0.01em] text-[#16201a]">Pick a song</span>
                        <span className="text-base text-[#4b5c53]">Choose one from the list to see its charts and files.</span>
                    </div>
                ) : (
                    <>
                        <div className="min-h-full flex flex-col justify-end gap-5 px-5 sm:px-10 pt-10">
                            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 lg:gap-6">
                                <div className="flex flex-col gap-1 min-w-0">
                                    <span className="relative z-10 self-start px-2 py-0.5 rounded bg-[#e8f5ee] border border-[#008c3c]/25 font-mono text-[11px] font-semibold tracking-[.1em] text-[#008c3c] break-all select-all cursor-text" title="Song ID">{song.id}</span>
                                    <h2 className="text-[32px] sm:text-[52px] font-bold leading-[1.15] tracking-[-0.01em] text-[#16201a] break-words drop-shadow-[0_1px_12px_rgba(243,245,243,0.9)]">{song.name}</h2>
                                    <span className="text-base font-medium text-[#4b5c53]">{song.composer}</span>
                                </div>
                                {settings.newUiAudioPreview && audio && (
                                    <div className="self-start lg:self-auto">
                                        <AudioPlayerControl audio={audio} />
                                    </div>
                                )}
                            </div>

                            {isLoadingFiles ? (
                                <div className="flex flex-col gap-2.5">
                                    <span className="font-mono text-[10px] font-semibold tracking-[.14em] text-[#4b5c53]">LOADING DIFFICULTIES...</span>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                        {[0, 1, 2, 3].map(i => (
                                            <div key={i} className="h-[56px] rounded-[10px] border border-[#dce3dd] bg-white/70 animate-pulse" />
                                        ))}
                                    </div>
                                </div>
                            ) : difficulties.length > 0 ? (
                                <DifficultySelector
                                    difficulties={difficulties}
                                    selectedDifficulty={selectedDifficulty}
                                    onSelectDifficulty={onSelectDifficulty}
                                    selectedSong={song}
                                    files={files}
                                />
                            ) : (
                                <p className="text-sm text-[#73857b]">No charts were found for this song.</p>
                            )}

                            <div className="flex flex-col sm:flex-row gap-2.5">
                                <button
                                    type="button"
                                    onClick={onExportChart}
                                    disabled={isExporting || !selectedDifficulty}
                                    className="export-glow relative overflow-hidden flex-1 h-[52px] rounded-[10px] bg-[#008c3c] hover:bg-[#007331] text-white flex items-center justify-center gap-2.5 font-bold text-[15px] tracking-[.03em] transition-colors disabled:cursor-not-allowed disabled:bg-[#008c3c]/40 disabled:hover:bg-[#008c3c]/40"
                                >
                                    {exportState.type === 'chart' ? (
                                        <>
                                            <span className="[&_svg]:text-white"><Spinner /></span>
                                            Exporting…
                                        </>
                                    ) : (
                                        <>
                                            <ArrowDownTrayIcon className="w-[18px] h-[18px] [stroke-width:2]" />
                                            Export [{selectedDifficulty ?? ''}] for Phira &amp; RPE
                                        </>
                                    )}
                                    {exportState.type === 'chart' && <ProgressBar progress={exportState.progress} className="bg-white/45" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={onExportAllAssets}
                                    disabled={isExporting || files.length === 0}
                                    className="relative overflow-hidden h-[52px] px-5 rounded-[10px] border border-[#dce3dd] bg-white/90 text-[#16201a] flex items-center justify-center gap-2.5 font-semibold text-sm backdrop-blur-sm hover:bg-white hover:border-[#b7c5ba] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {exportState.type === 'phira' ? <><Spinner />Zipping…</> : 'All assets .zip'}
                                    {exportState.type === 'phira' && <ProgressBar progress={exportState.progress} className="bg-[#008c3c]" />}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={scrollToFiles}
                                className="flex items-center justify-center gap-2 h-12 border-t border-[#dce3dd] text-[13px] font-medium text-[#4b5c53] hover:text-[#008c3c] transition-colors"
                            >
                                <ChevronDownIcon className="w-3.5 h-3.5 [stroke-width:2]" />
                                Scroll down for individual files
                                <ChevronDownIcon className="w-3.5 h-3.5 [stroke-width:2]" />
                            </button>
                        </div>

                        <div className="px-5 sm:px-10 pt-1 pb-10">
                            <FileTable selectedSong={song} files={files} isLoading={isLoadingFiles} onDownloaded={onDownloaded} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
