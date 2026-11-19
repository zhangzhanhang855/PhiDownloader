import React from 'react';
import { useResourceError } from '../contexts/ResourceErrorContext';
import { Button, ErrorGlyph, NoticeDialog } from './ui/Dialog';

interface ResourceErrorPopupProps {
    onSwitchProxy: () => void;
}

export const ResourceErrorPopup: React.FC<ResourceErrorPopupProps> = ({ onSwitchProxy }) => {
    const { resourceError, clearResourceError } = useResourceError();

    if (!resourceError) return null;

    const handleRetry = () => {
        const { onRetry } = resourceError;
        clearResourceError();
        onRetry?.();
    };

    const handleSwitchProxy = () => {
        clearResourceError();
        onSwitchProxy();
    };

    return (
        <NoticeDialog
            tone="error"
            icon={<ErrorGlyph />}
            eyebrow="Connection error"
            title="Resource failed to load"
            onClose={clearResourceError}
            actions={
                <>
                    <Button variant="ghost" onClick={clearResourceError}>Dismiss</Button>
                    {resourceError.onRetry && <Button variant="outline" onClick={handleRetry}>Retry</Button>}
                    <Button variant="primary" onClick={handleSwitchProxy}>Switch proxy</Button>
                </>
            }
        >
            <p className="text-[13px] leading-[1.6] text-[#4b5c53] text-pretty">
                <span className="text-[#16201a] font-medium">{resourceError.message}</span>{' '}
                GitHub is either unreachable in your region, or the current proxy is down. Switch proxy or retry.
            </p>
            {resourceError.detail && (
                <span className="font-mono text-[11px] leading-[1.5] text-[#73857b] px-2.5 py-2 rounded-lg bg-[#f3f5f3] border border-[#dce3dd] break-all">
                    {resourceError.detail}
                </span>
            )}
        </NoticeDialog>
    );
};
