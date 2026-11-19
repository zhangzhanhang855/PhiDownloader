import React, { useEffect, useRef } from 'react';
import { Song, FileInfo } from '../types';
import { Spinner } from './Spinner';
import { DifficultySelector } from './DifficultySelector';
import { FileTable } from './FileTable';
import { AudioPlayerControl } from './AudioPlayerControl';
import { ArrowDownTrayIcon } from './Icons';
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

const PARALLAX_SHIFT = 10;

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
    const scrollRef = useRef<HTMLDivElement>(null);
    const parallaxRef = useRef<HTMLDivElement>(null);
    const parallaxEnabled = settings.newUiBackgroundParallax;

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
    }, [song?.id]);

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

    const isExporting = exportState.type !== null;

    if (!song) {
        return (
            <div className="h-full jr-station-bg flex items-center justify-center p-6 sm:p-10">
                <div className="w-full max-w-lg rounded-2xl border border-[#d7e0d9] bg-white p-8 shadow-[0_6px_24px_rgba(18,28,22,0.05)] flex flex-col gap-4">
                    <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded bg-[#008c3c] font-mono text-[11px] font-bold text-white">JR</span>
                        <span className="font-mono text-[11px] font-semibold tracking-[.14em] text-[#008c3c]">PLATFORM STANDBY</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#16201a]">Select a track to begin</h2>
                    <p className="text-sm leading-relaxed text-[#4b5c53]">
                        Choose any song from the timetable on the left to inspect its difficulties, preview its audio, and export playable chart packages for Phira or Re:PhiEdit.
                    </p>
                    <div className="h-1.5 w-full rounded-full bg-[#e9f5ee] overflow-hidden mt-1">
                        <div className="h-full w-1/3 rounded-full bg-[#008c3c]" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div ref={scrollRef} className="h-full min-h-0 overflow-y-auto thin-scroll jr-station-bg">
            <div className="max-w-5xl mx-auto px-5 sm:px-8 py-6 sm:py-8 flex flex-col gap-6">
                {/* JR Station Signboard Hero Card */}
                <div className="rounded-2xl border border-[#d7e0d9] bg-white shadow-[0_4px_20px_rgba(18,28,22,0.05)] overflow-hidden">
                    <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)]">
                        {/* Framed Illustration */}
                        <div className="relative h-48 xl:h-auto min-h-[196px] overflow-hidden bg-[repeating-linear-gradient(135deg,#e9eee9_0_10px,#dfe6e1_10px_20px)] border-b xl:border-b-0 xl:border-r border-[#e6ece7]">
                            <div ref={parallaxRef} className="absolute -inset-4 will-change-transform" aria-hidden="true">
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-[opacity,transform] duration-500 ease-out"
                                    style={{
                                        backgroundImage: bgImage ? `url("${bgImage}")` : 'none',
                                        opacity: isBgLoaded ? 1 : 0,
                                        transform: isBgLoaded ? 'scale(1)' : 'scale(1.04)',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Station Nameplate Info */}
                        <div className="p-5 sm:p-6 flex flex-col justify-between gap-4">
                            <div className="flex flex-col gap-1.5 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-[#e9f5ee] border border-[#008c3c]/25 font-mono text-[11px] font-semibold tracking-[.08em] text-[#008c3c] select-all" title="Song ID">
                                        {song.id}
                                    </span>
                                    {selectedDifficulty && (
                                        <span className="px-2 py-0.5 rounded bg-[#f4f6f4] border border-[#d7e0d9] font-mono text-[11px] font-semibold text-[#4b5c53]">
                                            CLASS · {selectedDifficulty}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-2xl sm:text-[34px] font-bold leading-[1.18] tracking-[-0.01em] text-[#16201a] break-words">
                                    {song.name}
                                </h2>
                                <span className="text-sm sm:text-base font-medium text-[#4b5c53]">{song.composer}</span>
                            </div>

                            {settings.newUiAudioPreview && audio && (
                                <AudioPlayerControl audio={audio} />
                            )}
                        </div>
                    </div>
                    {/* Iconic JR East Green Station Line Bar */}
                    <div className="h-1.5 w-full bg-[#008c3c]" />
                </div>

                {/* Difficulty / Class Selector */}
                {isLoadingFiles ? (
                    <div className="flex flex-col gap-2.5">
                        <span className="font-mono text-[10px] font-semibold tracking-[.14em] text-[#4b5c53]">LOADING DIFFICULTIES…</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className="h-[78px] rounded-xl border border-[#d7e0d9] bg-white animate-pulse" />
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

                {/* Export Ticket Action Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={onExportChart}
                        disabled={isExporting || !selectedDifficulty}
                        className="export-glow relative overflow-hidden flex-1 h-[52px] rounded-xl bg-[#008c3c] hover:bg-[#007331] text-white flex items-center justify-center gap-2.5 font-bold text-[15px] tracking-[.03em] transition-colors disabled:cursor-not-allowed disabled:bg-[#008c3c]/40 disabled:hover:bg-[#008c3c]/40"
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
                        className="relative overflow-hidden h-[52px] px-5 rounded-xl border border-[#d7e0d9] bg-white text-[#16201a] flex items-center justify-center gap-2.5 font-semibold text-sm hover:bg-[#f8faf8] hover:border-[#9eb3a5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {exportState.type === 'phira' ? <><Spinner />Zipping…</> : 'All assets .zip'}
                        {exportState.type === 'phira' && <ProgressBar progress={exportState.progress} className="bg-[#008c3c]" />}
                    </button>
                </div>

                {/* Individual Asset Manifest */}
                <div className="pt-2 border-t border-[#d7e0d9]">
                    <FileTable selectedSong={song} files={files} isLoading={isLoadingFiles} onDownloaded={onDownloaded} />
                </div>
            </div>
        </div>
    );
};
