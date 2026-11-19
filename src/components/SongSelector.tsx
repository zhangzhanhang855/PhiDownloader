import React, { useState, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Spinner } from './Spinner';
import { useSettings } from '../contexts/SettingsContext';
import { Song, SortConfig } from '../types';
import { ErrorIcon, MagnifyingGlassIcon } from './Icons';
import { getBlurIllustrationUrl } from '../utils/resourceUrls';
import { useSongFilter, SORT_CYCLE, getSortIndex } from '../hooks/useSongFilter';

interface SongSelectorProps {
  isLoading: boolean;
  error: string | null;
  songs: Song[];
  selectedSong: Song | null;
  onSongSelect: (song: Song | null) => void;
  sortConfig: SortConfig;
  onSortConfigChange: (config: SortConfig) => void;
}

const SongThumbnail: React.FC<{ src: string }> = ({ src }) => {
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);
    return (
        <div className="relative w-12 h-7 flex-none rounded-md overflow-hidden border border-[#d7e0d9] bg-[repeating-linear-gradient(135deg,#e9eee9_0_4px,#dfe6e1_4px_8px)]">
            {!failed && (
                <img
                    src={src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onLoad={() => setLoaded(true)}
                    onError={() => setFailed(true)}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                />
            )}
        </div>
    );
};

export const SongSelector: React.FC<SongSelectorProps> = ({ isLoading, error, songs, selectedSong, onSongSelect, sortConfig, onSortConfigChange }) => {
    const { settings } = useSettings();
    const [isRangeOpen, setIsRangeOpen] = useState(false);
    const {
        searchTerm, setSearchTerm,
        minInput, setMinInput,
        maxInput, setMaxInput,
        onlyHasAt, setOnlyHasAt,
        difficultyBounds, isRangeActive, rangeLabel,
        displayedSongs, isSuggestion,
    } = useSongFilter(songs);
    const rangeWrapperRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const parentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
            e.preventDefault();
            searchInputRef.current?.focus();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (rangeWrapperRef.current && !rangeWrapperRef.current.contains(event.target as Node)) {
                setIsRangeOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const rowVirtualizer = useVirtualizer({
        count: displayedSongs.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 56,
        overscan: 6,
    });

    useEffect(() => {
        if (!selectedSong) return;
        const index = displayedSongs.findIndex(s => s.id === selectedSong.id);
        if (index >= 0) rowVirtualizer.scrollToIndex(index, { align: 'auto' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSong]);

    const sortIndex = getSortIndex(sortConfig);
    const cycleSort = () => onSortConfigChange(SORT_CYCLE[(sortIndex + 1) % SORT_CYCLE.length].config);

    const renderList = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center gap-3 text-[#4b5c53] text-sm py-12">
                    <Spinner />
                    <span>Loading timetable…</span>
                </div>
            );
        }
        if (error) {
            return (
                <div className="flex flex-col items-center gap-2 text-center px-6 py-12">
                    <span className="flex items-center gap-2 text-[#dc2626] text-sm font-semibold"><ErrorIcon className="w-5 h-5" />Failed to load songs</span>
                    <p className="font-mono text-[11px] text-[#73857b] break-all">{error}</p>
                </div>
            );
        }
        if (displayedSongs.length === 0) {
            return <p className="px-4 py-12 text-center text-sm text-[#73857b]">No matching tracks found.</p>;
        }
        return (
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                {rowVirtualizer.getVirtualItems().map(virtualItem => {
                    const song = displayedSongs[virtualItem.index];
                    const selected = selectedSong?.id === song.id;
                    return (
                        <button
                            key={song.id}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => onSongSelect(song)}
                            className={`absolute left-0 top-0 w-full h-[52px] flex items-center gap-3 px-3 rounded-xl text-left transition-all ${
                                selected
                                    ? 'bg-[#e9f5ee] border border-[#008c3c]/35 shadow-xs'
                                    : 'border border-transparent hover:bg-[#f4f6f4]'
                            }`}
                            style={{ transform: `translateY(${virtualItem.start}px)` }}
                        >
                            <span className={`w-1 h-6 rounded-full flex-none transition-colors ${selected ? 'bg-[#008c3c]' : 'bg-transparent'}`} />
                            <SongThumbnail src={getBlurIllustrationUrl(settings.proxySource, song.id)} />
                            <span className="flex-1 min-w-0 flex flex-col">
                                <span className={`text-[13.5px] leading-[1.25] truncate ${selected ? 'text-[#00682c] font-bold' : 'text-[#16201a] font-medium'}`}>
                                    {song.name}
                                </span>
                                <span className="text-[11px] leading-[1.3] text-[#73857b] truncate">{song.composer}</span>
                            </span>
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col min-h-0 h-full bg-white">
            <div className="flex-none bg-[#fafbfa] border-b border-[#d7e0d9] p-3.5 flex flex-col gap-3">
                <label className="h-10 flex items-center gap-2.5 px-3 rounded-xl bg-white border border-[#d7e0d9] focus-within:border-[#008c3c] focus-within:ring-2 focus-within:ring-[#008c3c]/15 transition-all">
                    <MagnifyingGlassIcon className="w-4 h-4 text-[#73857b] flex-none" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && displayedSongs.length > 0) onSongSelect(displayedSongs[0]);
                            if (e.key === 'Escape') { setSearchTerm(''); e.currentTarget.blur(); }
                        }}
                        placeholder="Search tracks, artists or aliases"
                        aria-label="Search songs, artists or aliases"
                        className="flex-1 min-w-0 bg-transparent text-[13.5px] text-[#16201a] placeholder:text-[#8b9a91] focus:outline-none"
                    />
                    {searchTerm ? (
                        <button type="button" onClick={() => setSearchTerm('')} aria-label="Clear search" className="text-[#73857b] hover:text-[#16201a]">
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    ) : (
                        <kbd className="font-mono text-[10px] font-semibold text-[#73857b] px-1.5 py-0.5 border border-[#d7e0d9] bg-[#f4f6f4] rounded">/</kbd>
                    )}
                </label>

                <div className="flex items-center gap-1.5">
                    <span className="flex-1 min-w-0 truncate font-mono text-[10px] font-semibold tracking-[.12em] text-[#73857b]">
                        {isLoading ? '— TRACKS' : `${displayedSongs.length} TRACKS`}
                        {isSuggestion && <span className="text-[#008c3c]"> · SUGGESTED</span>}
                    </span>

                    <button
                        type="button"
                        aria-pressed={onlyHasAt}
                        onClick={() => setOnlyHasAt(v => !v)}
                        title={onlyHasAt ? 'Showing only songs with an AT chart' : 'Show only songs with an AT chart'}
                        className={`font-mono text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                            onlyHasAt
                                ? 'text-[#008c3c] bg-[#e9f5ee] border-[#008c3c]/35'
                                : 'text-[#4b5c53] bg-white border-[#d7e0d9] hover:border-[#9eb3a5]'
                        }`}
                    >
                        AT
                    </button>

                    <div ref={rangeWrapperRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setIsRangeOpen(o => !o)}
                            aria-expanded={isRangeOpen}
                            title="Filter by difficulty range"
                            className={`font-mono text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                                isRangeActive
                                    ? 'text-[#008c3c] bg-[#e9f5ee] border-[#008c3c]/35'
                                    : 'text-[#4b5c53] bg-white border-[#d7e0d9] hover:border-[#9eb3a5]'
                            }`}
                        >
                            {rangeLabel}
                        </button>
                        {isRangeOpen && (
                            <div className="motion-dropdown absolute right-0 z-40 mt-2 w-56 p-3.5 rounded-xl border border-[#d7e0d9] bg-white shadow-[0_12px_32px_rgba(18,28,22,0.14)] flex flex-col gap-2.5">
                                <span className="font-mono text-[10px] font-semibold tracking-[.14em] text-[#4b5c53]">DIFFICULTY RANGE</span>
                                <div className="flex items-center gap-2">
                                    {[
                                        { value: minInput, set: setMinInput, placeholder: difficultyBounds?.min, label: 'Minimum difficulty' },
                                        { value: maxInput, set: setMaxInput, placeholder: difficultyBounds?.max, label: 'Maximum difficulty' },
                                    ].map((field, i) => (
                                        <React.Fragment key={field.label}>
                                            {i === 1 && <span className="text-[#8b9a91]">–</span>}
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                step={0.1}
                                                min={difficultyBounds?.min}
                                                max={difficultyBounds?.max}
                                                placeholder={field.placeholder !== undefined ? String(field.placeholder) : ''}
                                                value={field.value}
                                                onChange={e => field.set(e.target.value)}
                                                disabled={!difficultyBounds}
                                                aria-label={field.label}
                                                className="w-full min-w-0 h-8 rounded-lg bg-[#f4f6f4] border border-[#d7e0d9] text-center font-mono text-xs text-[#16201a] placeholder:text-[#8b9a91] focus:outline-none focus:border-[#008c3c] disabled:opacity-50"
                                            />
                                        </React.Fragment>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setMinInput(''); setMaxInput(''); }}
                                    disabled={!minInput && !maxInput}
                                    className="self-start text-xs font-semibold text-[#008c3c] hover:text-[#00682c] disabled:opacity-40"
                                >
                                    Reset range
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={cycleSort}
                        title="Change sort order"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#d7e0d9] bg-white text-[11px] font-semibold text-[#4b5c53] hover:border-[#9eb3a5] hover:text-[#16201a] transition-colors"
                    >
                        {SORT_CYCLE[sortIndex].label}
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>
                    </button>
                </div>
            </div>

            <div ref={parentRef} role="listbox" aria-label="Songs" className="flex-1 min-h-0 overflow-y-auto thin-scroll p-2.5">
                {renderList()}
            </div>
        </div>
    );
};
