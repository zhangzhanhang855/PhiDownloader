import React from 'react';
import { Button, NoticeDialog, WarningGlyph } from './ui/Dialog';

interface BlacklistWarningPopupProps {
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    reason?: string;
}

export const BlacklistWarningPopup: React.FC<BlacklistWarningPopupProps> = ({ isOpen, onCancel, onConfirm, reason }) => {
    if (!isOpen) return null;

    return (
        <NoticeDialog
            tone="warning"
            icon={<WarningGlyph />}
            eyebrow="Known issue"
            title="This chart may not work correctly"
            onClose={onCancel}
            actions={
                <>
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button variant="warning" onClick={onConfirm}>Proceed anyway</Button>
                </>
            }
        >
            {reason && (
                <div className="flex flex-col gap-1 px-3 py-2.5 rounded-lg bg-[#fef3c7]/60 border border-[#f59e0b]/30">
                    <span className="font-mono text-[10px] font-semibold tracking-[.12em] text-[#b45309]">REASON</span>
                    <span className="text-[13px] leading-[1.55] text-[#16201a]">{reason}</span>
                </div>
            )}
            <p className="text-[13px] text-[#4b5c53]">Proceed with the download anyway?</p>
        </NoticeDialog>
    );
};
