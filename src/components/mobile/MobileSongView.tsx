import React, { useEffect, useRef, useState } from 'react';
import { Song, FileInfo } from '../../types';
import { Spinner } from '../Spinner';
import { FileTable } from '../FileTable';
import { AudioPlayerControl } from '../AudioPlayerControl';
import { ArrowDownTrayIcon, ChevronDownIcon } from '../Icons';
import { ExportState } from '../SongWorkspace';
import { useSettings } from '../../contexts/SettingsContext';
import { getExtraChart, getExtraCharts } from '../../extraCharts';
import { DIFFICULTY_ORDER, getDifficultyColor, floorLevel } from '../../utils/difficulty';
import { getResourceUrl, hasPerDifficultyIllustrations } from '../../utils/resourceUrls';

interface MobileSongViewProps {
    open: boolean;
    onBack: () => void;
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

const BAR_FADE_START = 140;
const BAR_FADE_LENGTH = 60;

const ProgressBar: React.FC<{ progress: number; className: string }> = ({ progress, className }) => (
    <div className={`absolute bottom-0 left-0 h-[3px] transition-[width] duration-150 ${className}`} style={{ width: `${progress.toFixed(0)}%` }} />
);

const DifficultyTiles: React.FC<{
    song: Song;
    difficulties: string[];
    selectedDifficulty: string | null;
    onSelectDifficulty: (difficulty: string) => void;
}> = ({ song, difficulties, selectedDifficulty, onSelectDifficulty }) => {
    const { settings } = useSettings();
    const slots = [...DIFFICULTY_ORDER, ...getExtraCharts(song.id).map(e => e.difficulty)];

    return (
        <div className="flex flex-col gap-2.5">
            <span className="font-mono text-[10px] font-semibold tracking-[.14em] text-[#4b5c53]">SELECT CLASS / DIFFICULTY</span>
            <div className={`grid ${slots.length > 4 ? 'grid-cols-5' : 'grid-cols-4'} gap-2`} role="radiogroup" aria-label="Difficulty">
                {slots.map(diff => {
                    const available = difficulties.includes(diff);
                    const selected = available && diff === selectedDifficulty;
                    const color = getDifficultyColor(diff);
                    const key = diff as keyof Song['charters'];
                    const extra = getExtraChart(song.id, diff);
                    const level = song.difficulties?.[key] ?? extra?.level;
                    const charter = song.charters[key];
                    const tooltip = [extra?.tooltip, settings.advancedInfo && charter ? `Charter: ${charter}` : null].filter(Boolean).join('\n');

                    return (
                        <button
                            key={diff}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            disabled={!available}
                            onClick={() => onSelectDifficulty(diff)}
                            title={tooltip || undefined}
                            className={`relative overflow-hidden h-[70px] px-3 py-2.5 rounded-xl border flex flex-col items-start justify-between disabled:opacity-40 disabled:cursor-not-allowed ${
                                selected
                                    ? 'bg-white border-[#008c3c] ring-2 ring-[#008c3c]/20 shadow-sm'
                                    : 'bg-white border-[#d7e0d9]'
                            }`}
                        >
                            <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: available ? color : '#cbd5ce' }} />
                            <span className="font-mono font-bold text-xs tracking-[.08em] pt-0.5" style={{ color }}>{diff}</span>
                            <span className={`text-[22px] font-bold leading-none tabular-nums ${selected ? 'text-[#16201a]' : 'text-[#4b5c53]'}`}>
                                {available ? floorLevel(level ?? '?') : '—'}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export const MobileSongView: React.FC<MobileSongViewProps> = ({
    open,
    onBack,
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
    const [filesOpen, setFilesOpen] = useState(false);
    const [scrollTop, setScrollTop] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const filesToggleRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        scrollRef.current?.scrollTo({ top: 0 });
        setScrollTop(0);
        setFilesOpen(false);
    }, [open, song?.id]);

    const toggleFiles = () => {
        const next = !filesOpen;
        setFilesOpen(next);
        if (next) {
            requestAnimationFrame(() => {
                const toggle = filesToggleRef.current;
                if (toggle) scrollRef.current?.scrollTo({ top: toggle.offsetTop - 72, behavior: 'smooth' });
            });
        }
    };

    const isExporting = exportState.type !== null;
    const barOpacity = Math.max(0, Math.min(1, (scrollTop - BAR_FADE_START) / BAR_FADE_LENGTH));

    const lowResUrl = song && !hasPerDifficultyIllustrations(song.id)
        ? getResourceUrl(settings.proxySource, 'illustrationLowRes', `${song.id}.png`)
        : null;

    return (
        <div
            aria-hidden={!open}
            className={`absolute inset-0 z-10 jr-station-bg shadow-[-20px_0_60px_rgba(18,28,22,0.16)] transition-[transform,visibility] duration-[340ms] ease-[cubic-bezier(.16,1,.3,1)] ${open ? 'translate-x-0 visible' : 'translate-x-[105%] invisible'}`}
        >
            <div
                ref={scrollRef}
                onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
                className="absolute inset-0 overflow-y-auto px-4 pt-16 pb-[130px]"
            >
                {song && (
                    <div className="flex flex-col gap-5">
                        {/* JR Station Signboard Card */}
                        <div className="rounded-2xl border border-[#d7e0d9] bg-white shadow-[0_4px_16px_rgba(18,28,22,0.06)] overflow-hidden">
                            <div className="relative h-44 overflow-hidden bg-[repeating-linear-gradient(135deg,#e9eee9_0_10px,#dfe6e1_10px_20px)]">
                                <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{ backgroundImage: lowResUrl ? `url("${lowResUrl}")` : 'none' }}
                                    aria-hidden="true"
                                />
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-opacity duration-[600ms] ease-out"
                                    style={{ backgroundImage: bgImage ? `url("${bgImage}")` : 'none', opacity: isBgLoaded ? 1 : 0 }}
                                    aria-hidden="true"
                                />
                            </div>
                            <div className="p-4 flex flex-col gap-2">
                                <span className="self-start px-2 py-0.5 rounded bg-[#e9f5ee] border border-[#008c3c]/25 font-mono text-[10px] font-semibold tracking-[.1em] text-[#008c3c] break-all select-all">
                                    {song.id}
                                </span>
                                <h2 className="text-2xl font-bold leading-[1.15] text-[#16201a] break-words text-balance">{song.name}</h2>
                                <span className="text-sm font-medium text-[#4b5c53]">{song.composer}</span>
                                {settings.newUiAudioPreview && audio && (
                                    <div className="pt-2">
                                        <AudioPlayerControl audio={audio} variant="mobile" />
                                    </div>
                                )}
                            </div>
                            <div className="h-1.5 w-full bg-[#008c3c]" />
                        </div>

                        {isLoadingFiles ? (
                            <div className="flex flex-col gap-2.5">
                                <span className="font-mono text-[10px] font-semibold tracking-[.14em] text-[#4b5c53]">LOADING DIFFICULTIES…</span>
                                <div className="grid grid-cols-4 gap-2">
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} className="h-[70px] rounded-xl border border-[#d7e0d9] bg-white animate-pulse" />
                                    ))}
                                </div>
                            </div>
                        ) : difficulties.length > 0 ? (
                            <DifficultyTiles
                                song={song}
                                difficulties={difficulties}
                                selectedDifficulty={selectedDifficulty}
                                onSelectDifficulty={onSelectDifficulty}
                            />
                        ) : (
                            <p className="text-sm text-[#73857b]">No charts were found for this song.</p>
                        )}

                        <div className="flex flex-col rounded-xl border border-[#d7e0d9] bg-white px-4">
                            <button
                                ref={filesToggleRef}
                                type="button"
                                onClick={toggleFiles}
                                aria-expanded={filesOpen}
                                className="h-[52px] flex items-center justify-between"
                            >
                                <span className="flex items-center gap-2 text-sm font-semibold text-[#16201a]">
                                    <ChevronDownIcon className={`w-3.5 h-3.5 [stroke-width:2] transition-transform duration-200 ${filesOpen ? '' : '-rotate-90'}`} />
                                    Asset Manifest
                                    <span className="font-mono text-[11px] font-medium text-[#73857b]">· {isLoadingFiles ? '…' : files.length}</span>
                                </span>
                                <span className="font-mono text-[10px] font-semibold tracking-[.12em] text-[#008c3c]">{filesOpen ? 'HIDE' : 'SHOW'}</span>
                            </button>
                            {filesOpen && (
                                <div className="pb-4 pt-1 border-t border-[#e6ece7]">
                                    <FileTable selectedSong={song} files={files} isLoading={isLoadingFiles} onDownloaded={onDownloaded} variant="mobile" />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Compact sticky top bar */}
            <div
                className="absolute inset-x-0 top-0 h-14 px-16 flex items-center justify-center bg-white/95 backdrop-blur-[12px] border-b border-[#d7e0d9] pointer-events-none"
                style={{ opacity: barOpacity }}
                aria-hidden="true"
            >
                <span className="text-[15px] font-bold text-[#16201a] truncate">{song?.name}</span>
            </div>
            <button
                type="button"
                onClick={onBack}
                aria-label="Back"
                className="absolute top-2 left-3 w-10 h-10 rounded-full border border-[#d7e0d9] bg-white/95 backdrop-blur-[8px] text-[#16201a] shadow-sm flex items-center justify-center"
            >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>

            {/* Thumb-reach export bar */}
            <div className="absolute inset-x-0 bottom-0 flex gap-2.5 px-4 pt-5 pb-[calc(16px+env(safe-area-inset-bottom))] bg-[linear-gradient(to_top,#f4f6f4_68%,rgba(244,246,244,0))]">
                <button
                    type="button"
                    onClick={onExportChart}
                    disabled={isExporting || !selectedDifficulty}
                    className="export-glow relative overflow-hidden flex-1 min-w-0 h-[54px] rounded-xl bg-[#008c3c] text-white flex items-center justify-center gap-[9px] font-bold text-[15px] tracking-[.03em] whitespace-nowrap disabled:cursor-not-allowed disabled:bg-[#008c3c]/40"
                >
                    {exportState.type === 'chart' ? (
                        <>
                            <span className="[&_svg]:text-white [&_svg]:w-[18px] [&_svg]:h-[18px]"><Spinner /></span>
                            Exporting…
                        </>
                    ) : (
                        <>
                            <ArrowDownTrayIcon className="w-[18px] h-[18px] flex-none [stroke-width:2]" />
                            <span className="truncate">Export [{selectedDifficulty ?? ''}] for Phira &amp; RPE</span>
                        </>
                    )}
                    {exportState.type === 'chart' && <ProgressBar progress={exportState.progress} className="bg-white/45" />}
                </button>
                <button
                    type="button"
                    onClick={onExportAllAssets}
                    disabled={isExporting || files.length === 0}
                    aria-label="Export all assets as .zip"
                    className="relative overflow-hidden flex-none w-[72px] h-[54px] rounded-xl border border-[#d7e0d9] bg-white text-[#16201a] flex flex-col items-center justify-center gap-px shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {exportState.type === 'phira'
                        ? <span className="[&_svg]:w-[18px] [&_svg]:h-[18px]"><Spinner /></span>
                        : <span className="font-mono text-[13px] font-bold tracking-[.06em]">.zip</span>}
                    <span className="text-[10px] leading-none text-[#4b5c53]">All assets</span>
                    {exportState.type === 'phira' && <ProgressBar progress={exportState.progress} className="bg-[#008c3c]" />}
                </button>
            </div>
        </div>
    );
};
