import React from 'react';
import { Button, NoticeDialog, WrenchGlyph } from './ui/Dialog';
import { getDifficultyColor } from '../utils/difficulty';

interface PatchedChartPopupProps {
    isOpen: boolean;
    onCancel: () => void;
    onDownloadOriginal: () => void;
    onDownloadPatched: () => void;
    reason?: string;
    songName?: string;
    difficulty?: string;
}

export const PatchedChartPopup: React.FC<PatchedChartPopupProps> = ({ isOpen, onCancel, onDownloadOriginal, onDownloadPatched, reason, songName, difficulty }) => {
    if (!isOpen) return null;

    return (
        <NoticeDialog
            tone="warning"
            icon={<WrenchGlyph />}
            eyebrow="Patch available"
            title="A fixed version of this chart exists"
            onClose={onCancel}
            actions={
                <>
                    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button variant="outline" onClick={onDownloadOriginal}>Save original</Button>
                    <Button variant="warning" onClick={onDownloadPatched}>Save patched</Button>
                </>
            }
        >
            {reason && <p className="text-[13px] leading-[1.6] text-[#4b5c53] text-pretty">{reason}</p>}
            {songName && (
                <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[#f3f5f3] border border-[#dce3dd] font-mono text-[11px] font-medium text-[#73857b]">
                    <span className="text-[#16201a] truncate">{songName}</span>
                    {difficulty && (
                        <>
                            <span>·</span>
                            <span style={{ color: getDifficultyColor(difficulty) }}>{difficulty}</span>
                        </>
                    )}
                </div>
            )}
        </NoticeDialog>
    );
};
