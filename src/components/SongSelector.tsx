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
        <div className="relative w-11 h-[26px] flex-none rounded overflow-hidden border border-[#dce3dd] bg-[repeating-linear-gradient(135deg,#e8ede9_0_4px,#dfe6e1_4px_8px)]">
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

    // "/" focuses the search box from anywhere on the page.
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
        estimateSize: () => 50,
        overscan: 6,
    });

    // Keep the selected song in view when it changes from outside the list (e.g. ?song= in the URL).
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
                <div className="flex items-center justify-center gap-3 text-[#4b5c53] text-sm py-10">
                    <Spinner />
                    <span>Loading song list…</span>
                </div>
            );
        }
        if (error) {
            return (
                <div className="flex flex-col items-center gap-2 text-center px-6 py-10">
                    <span className="flex items-center gap-2 text-[#dc2626] text-sm font-semibold"><ErrorIcon className="w-5 h-5" />Failed to load songs</span>
                    <p className="font-mono text-[11px] text-[#73857b] break-all">{error}</p>
                </div>
            );
        }
        if (displayedSongs.length === 0) {
            return <p className="px-4 py-10 text-center text-sm text-[#73857b]">No songs found.</p>;
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
                            className={`absolute left-0 top-0 w-full h-12 flex items-center gap-3 px-2.5 rounded-lg text-left transition-colors ${
                                selected
                                    ? 'bg-[#e8f5ee] border-l-[3px] border-[#008c3c]'
                                    : 'hover:bg-[#f1f4f2] border-l-[3px] border-transparent'
                            }`}
                            style={{ transform: `translateY(${virtualItem.start}px)` }}
                        >
                            <SongThumbnail src={getBlurIllustrationUrl(settings.proxySource, song.id)} />
                            <span className="flex-1 min-w-0 flex flex-col">
                                <span className={`text-sm leading-[1.2] truncate ${selected ? 'text-[#006b2e] font-semibold' : 'text-[#16201a] font-medium'}`}>
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
            <div className="flex-none bg-[#f8faf8] border-b border-[#dce3dd]">
                <div className="p-4 flex flex-col gap-3">
                    <label className="h-[42px] flex items-center gap-2.5 px-3 rounded-[10px] bg-white border border-[#dce3dd] focus-within:border-[#008c3c] focus-within:ring-2 focus-within:ring-[#008c3c]/15 transition-all">
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
                            placeholder="Search songs or artists"
                            aria-label="Search songs, artists or aliases"
                            className="flex-1 min-w-0 bg-transparent text-sm text-[#16201a] placeholder:text-[#8b9a91] focus:outline-none"
                        />
                        {searchTerm ? (
                            <button type="button" onClick={() => setSearchTerm('')} aria-label="Clear search" className="text-[#73857b] hover:text-[#16201a]">
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        ) : (
                            <kbd className="font-mono text-[10px] font-medium text-[#73857b] px-1.5 py-0.5 border border-[#dce3dd] bg-[#f3f5f3] rounded">/</kbd>
                        )}
                    </label>
                </div>

                <div className="px-4 pb-2.5 flex items-center gap-1.5">
                    <span className="flex-1 min-w-0 truncate font-mono text-[10px] font-medium tracking-[.12em] text-[#73857b]">
                        {isLoading ? '— SONGS | ' : `${displayedSongs.length} SONGS | `}
                        {isSuggestion && <span className="text-[#008c3c] font-semibold"> · DID YOU MEAN</span>}
                    </span>
                    <button
                        type="button"
                        aria-pressed={onlyHasAt}
                        onClick={() => setOnlyHasAt(v => !v)}
                        title={onlyHasAt ? 'Showing only songs with an AT chart' : 'Show only songs with an AT chart'}
                        className={`font-mono text-[11px] font-semibold px-2 py-1 rounded-md transition-colors ${onlyHasAt ? 'text-[#008c3c] bg-[#e8f5ee] border border-[#008c3c]/30' : 'text-[#4b5c53] hover:bg-[#eef2ee]'}`}
                    >
                        Has AT
                    </button>
                    <div ref={rangeWrapperRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setIsRangeOpen(o => !o)}
                            aria-expanded={isRangeOpen}
                            title="Filter by difficulty range"
                            className={`font-mono text-[11px] font-medium px-1.5 py-1 rounded-md transition-colors hover:bg-[#eef2ee] ${isRangeActive ? 'text-[#008c3c] font-semibold' : 'text-[#4b5c53] hover:text-[#16201a]'}`}
                        >
                            {rangeLabel}
                        </button>
                        {isRangeOpen && (
                            <div className="motion-dropdown absolute right-0 z-40 mt-2 w-56 p-3 rounded-xl border border-[#dce3dd] bg-white shadow-[0_12px_32px_rgba(22,32,26,0.12)] flex flex-col gap-2.5">
                                <span className="font-mono text-[10px] font-medium tracking-[.14em] text-[#73857b]">DIFFICULTY RANGE</span>
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
                                                className="w-full min-w-0 h-8 rounded-lg bg-[#f8faf8] border border-[#dce3dd] text-center font-mono text-xs text-[#16201a] placeholder:text-[#8b9a91] focus:outline-none focus:border-[#008c3c] disabled:opacity-50"
                                            />
                                        </React.Fragment>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setMinInput(''); setMaxInput(''); }}
                                    disabled={!minInput && !maxInput}
                                    className="self-start text-xs font-semibold text-[#008c3c] hover:text-[#007331] disabled:opacity-40"
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
                        className="flex items-center gap-1 px-1.5 py-1 rounded-md text-xs text-[#4b5c53] hover:text-[#16201a] hover:bg-[#eef2ee] transition-colors"
                    >
                        {SORT_CYCLE[sortIndex].label}
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>
                    </button>
                </div>
            </div>

            <div ref={parentRef} role="listbox" aria-label="Songs" className="flex-1 min-h-0 overflow-y-auto thin-scroll px-2 py-2">
                {renderList()}
            </div>
        </div>
    );
};
