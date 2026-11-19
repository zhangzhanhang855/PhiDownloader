import React from 'react';
import { Song } from '../types';
import { getExtraChart, getExtraCharts } from '../extraCharts';
import { DIFFICULTY_ORDER, getDifficultyColor } from '../utils/difficulty';
import { useSettings } from '../contexts/SettingsContext';
import { FileInfo } from '../types';
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

    // Always show the four standard slots (a missing chart is disabled), plus any extra charts such as SP.
    const slots = [...DIFFICULTY_ORDER, ...getExtraCharts(selectedSong.id).map(e => e.difficulty)];

    return (
        <div className="flex flex-col gap-2.5">
            <span className="font-mono text-[10px] font-semibold tracking-[.14em] text-[#4b5c53]">AVAILABLE DIFFICULTIES</span>
            <div className={`grid grid-cols-2 ${slots.length > 4 ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-2.5`} role="radiogroup" aria-label="Difficulty">
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
                            className={`px-4 py-3.5 rounded-[10px] border backdrop-blur-sm flex flex-wrap items-baseline justify-between transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                selected
                                    ? 'bg-white border-[#008c3c] ring-2 ring-[#008c3c]/20 shadow-[0_4px_14px_rgba(0,140,60,0.10)]'
                                    : 'bg-white/85 border-[#dce3dd] hover:bg-white hover:border-[#b7c5ba]'
                            }`}
                        >
                            <span className="font-bold text-[15px] tracking-[.08em]" style={{ color }}>{diff}</span>
                            <span className={`text-[26px] font-semibold leading-none ${selected ? 'text-[#16201a]' : 'text-[#4b5c53]'}`}>{available ? (level ?? '?') : 'N/A'}</span>
                            {estimate !== null && (
                                <span className="basis-full mt-1.5 font-mono text-[11px] text-[#73857b] text-left" title="Estimated size of the exported .zip (chart + illustration + audio)">{formatEstimate(estimate)}</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
