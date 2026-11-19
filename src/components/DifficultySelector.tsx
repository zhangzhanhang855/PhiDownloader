import React from 'react';
import { Song, FileInfo } from '../types';
import { getExtraChart, getExtraCharts } from '../extraCharts';
import { DIFFICULTY_ORDER, getDifficultyColor } from '../utils/difficulty';
import { useSettings } from '../contexts/SettingsContext';
import { estimateExportZipSize, formatEstimate } from '../utils/exportEstimate';

interface DifficultySelectorProps {
    difficulties: string[];
    selectedDifficulty: string | null;
    onSelectDifficulty: (difficulty: string) => void;
    selectedSong: Song;
    files: FileInfo[];
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({ difficulties, selectedDifficulty, onSelectDifficulty, selectedSong, files }) => {
    const { settings } = useSettings();

    if (difficulties.length === 0) {
        return null;
    }

    const slots = [...DIFFICULTY_ORDER, ...getExtraCharts(selectedSong.id).map(e => e.difficulty)];

    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold tracking-[.14em] text-[#4b5c53]">SELECT CLASS / DIFFICULTY</span>
                <span className="font-mono text-[10px] text-[#73857b]">{difficulties.length} AVAILABLE</span>
            </div>
            <div className={`grid grid-cols-2 ${slots.length > 4 ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-3`} role="radiogroup" aria-label="Difficulty">
                {slots.map(diff => {
                    const available = difficulties.includes(diff);
                    const selected = available && diff === selectedDifficulty;
                    const color = getDifficultyColor(diff);
                    const key = diff as keyof Song['charters'];
                    const extra = getExtraChart(selectedSong.id, diff);
                    const level = selectedSong.difficulties?.[key] ?? extra?.level;
                    const charter = selectedSong.charters[key];
                    const tooltip = [extra?.tooltip, settings.advancedInfo && charter ? `Charter: ${charter}` : null].filter(Boolean).join('\n');
                    const estimate = available ? estimateExportZipSize(files, diff, settings.exportIllustrationType) : null;

                    return (
                        <button
                            key={diff}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            disabled={!available}
                            onClick={() => onSelectDifficulty(diff)}
                            title={tooltip || undefined}
                            className={`relative overflow-hidden px-4 py-3.5 rounded-xl border text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                selected
                                    ? 'bg-white border-[#008c3c] ring-2 ring-[#008c3c]/20 shadow-[0_6px_18px_rgba(0,140,60,0.12)]'
                                    : 'bg-white border-[#d7e0d9] hover:border-[#9eb3a5] hover:shadow-xs'
                            }`}
                        >
                            {/* JR Line Color Strip at top of each ticket card */}
                            <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: available ? color : '#cbd5ce' }} />
                            <div className="flex items-baseline justify-between gap-2 pt-0.5">
                                <span className="font-mono font-bold text-sm tracking-[.08em]" style={{ color }}>{diff}</span>
                                <span className={`text-[26px] font-bold leading-none tabular-nums ${selected ? 'text-[#16201a]' : 'text-[#4b5c53]'}`}>
                                    {available ? (level ?? '?') : '—'}
                                </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                                <span className="font-mono text-[11px] text-[#73857b]">
                                    {estimate !== null ? formatEstimate(estimate) : 'Unavailable'}
                                </span>
                                {selected && (
                                    <span className="w-2 h-2 rounded-full bg-[#008c3c]" aria-hidden="true" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
