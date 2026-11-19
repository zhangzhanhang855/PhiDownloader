import React, { memo } from 'react';

interface HeaderProps {
    version: string | null;
    isLoadingVersion: boolean;
    versionError: string | null;
    onRetryVersion: () => void;
    onSettingsClick: () => void;
    onFaqClick: () => void;
    onAboutClick: () => void;
}

const ServiceStatusPill: React.FC<Pick<HeaderProps, 'version' | 'isLoadingVersion' | 'versionError' | 'onRetryVersion'>> = ({
    version,
    isLoadingVersion,
    versionError,
    onRetryVersion,
}) => {
    const dot = versionError ? '#dc2626' : isLoadingVersion ? '#d97706' : '#008c3c';
    const label = versionError ? 'Service Error · Retry' : isLoadingVersion ? 'Syncing …' : `Phigros v${version}`;
    const className = 'flex items-center gap-2 px-3 py-1 rounded-full border border-[#d7e0d9] bg-[#f4f6f4] font-mono text-[11px] font-semibold text-[#4b5c53] whitespace-nowrap';

    const content = (
        <>
            <span className={`w-2 h-2 rounded-full ${isLoadingVersion ? 'animate-pulse' : ''}`} style={{ background: dot }} />
            {label}
        </>
    );

    if (versionError) {
        return (
            <button type="button" onClick={onRetryVersion} title={`${versionError} — click to retry`} className={`${className} hover:border-[#008c3c]/50 hover:text-[#16201a] transition-colors`}>
                {content}
            </button>
        );
    }
    return <span className={className} title="The game version assets are decompiled from">{content}</span>;
};

export const Header: React.FC<HeaderProps> = memo(({ onSettingsClick, onFaqClick, onAboutClick, ...versionProps }) => {
    const navBtn = 'px-3 py-1.5 rounded-lg text-[13px] font-semibold text-[#4b5c53] hover:text-[#008c3c] hover:bg-[#e9f5ee] transition-colors';

    return (
        <header className="relative h-16 flex-none flex items-center justify-between gap-4 px-5 sm:px-7 border-b border-[#d7e0d9] bg-white shadow-[0_1px_3px_rgba(18,28,22,0.04)]">
            <div className="absolute inset-x-0 top-0 h-[4px] bg-[#008c3c]" aria-hidden="true" />

            <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#008c3c] text-white shadow-xs flex-none" aria-hidden="true">
                    <span className="font-mono text-xs font-bold tracking-wider">JR</span>
                    <span className="w-px h-3 bg-white/35" />
                    <span className="font-mono text-[10px] font-semibold tracking-wider opacity-90">PHI</span>
                </div>
                <div className="flex flex-col min-w-0">
                    <h1 className="font-bold text-[15px] tracking-[.08em] text-[#16201a] truncate leading-tight">
                        PHIGROS CHART TERMINAL
                    </h1>
                    <span className="font-mono text-[10px] tracking-[.12em] text-[#73857b] truncate">
                        CHART &amp; ASSET DISPATCHER
                    </span>
                </div>
            </div>

            <nav className="flex items-center gap-1.5 flex-none">
                <span className="hidden md:flex"><ServiceStatusPill {...versionProps} /></span>
                <span className="hidden md:block w-px h-5 bg-[#d7e0d9] mx-2" aria-hidden="true" />
                <button type="button" onClick={onAboutClick} className={navBtn}>About</button>
                <button type="button" onClick={onFaqClick} className={navBtn}>FAQ</button>
                <button
                    type="button"
                    onClick={onSettingsClick}
                    aria-label="Settings"
                    title="Settings"
                    className="ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d7e0d9] bg-[#fafbfa] text-[13px] font-semibold text-[#16201a] hover:border-[#008c3c]/50 hover:bg-[#e9f5ee] hover:text-[#008c3c] transition-colors"
                >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="hidden sm:inline">Settings</span>
                </button>
            </nav>
        </header>
    );
});
