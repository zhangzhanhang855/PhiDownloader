import React, { useState, useCallback } from 'react';
import { Spinner } from './Spinner';
import { AssetDownloadWarningPopup } from './AssetDownloadWarningPopup';
import { Song, FileInfo } from '../types';
import { sendAssetDownloadNotification } from '../utils/api';
import { ArrowDownTrayIcon, InformationCircleIcon } from './Icons';
import { useSettings } from '../contexts/SettingsContext';
import { useResourceError } from '../contexts/ResourceErrorContext';
import { getResourceUrl } from '../utils/resourceUrls';
import { resourceFetch } from '../utils/githubAuth';
import { getDifficultyColor } from '../utils/difficulty';
import { getChartDifficulty } from '../hooks/useSongFiles';

interface FileTableProps {
    selectedSong: Song;
    files: FileInfo[];
    isLoading: boolean;
    onDownloaded: (fileName: string) => void;
    variant?: 'default' | 'mobile';
}

const ASSET_WARNING_KEY = 'phigrosDownloader_assetWarningShown';

const RESOLUTIONS: Record<string, string> = {
    'Illustration': '2048×1080',
    'Illustration (Low-Res)': '512×270',
    'Illustration (Blur)': '256×135',
};

const formatBytes = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const getDownloadName = (file: FileInfo, song: Song) =>
    file.type.startsWith('Chart') ? `Chart_${song.id}_${file.name}` : file.name;

export const FileTable: React.FC<FileTableProps> = ({ selectedSong, files, isLoading, onDownloaded, variant = 'default' }) => {
    const mobile = variant === 'mobile';
    const previewBox = mobile ? 'w-14' : 'w-12 sm:w-16';
    const { settings } = useSettings();
    const { reportResourceError } = useResourceError();
    const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
    const [pendingDownload, setPendingDownload] = useState<FileInfo | null>(null);

    const executeDownload = useCallback(async (file: FileInfo) => {
        if (downloadingUrl) return;
        const downloadName = getDownloadName(file, selectedSong);
        setDownloadingUrl(file.url);
        try {
            const response = await resourceFetch(file.url, { referrerPolicy: 'no-referrer' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = downloadName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            sendAssetDownloadNotification(selectedSong.name, file.type, selectedSong.id, settings.analyticsEnabled);
            onDownloaded(downloadName);
        } catch (error) {
            console.error('Download failed:', error);
            reportResourceError(
                `Failed to download "${file.name}".`,
                () => executeDownload(file),
                error instanceof Error ? `GET ${file.url} → ${error.message}` : file.url
            );
        } finally {
            setDownloadingUrl(null);
        }
    }, [downloadingUrl, selectedSong, settings.analyticsEnabled, reportResourceError, onDownloaded]);

    const handleDownloadClick = (file: FileInfo) => {
        if (file.type.startsWith('Chart') && !localStorage.getItem(ASSET_WARNING_KEY)) {
            setPendingDownload(file);
            return;
        }
        executeDownload(file);
    };

    const handleWarningConfirm = () => {
        localStorage.setItem(ASSET_WARNING_KEY, 'true');
        const file = pendingDownload;
        setPendingDownload(null);
        if (file) executeDownload(file);
    };

    const lowResUrl = getResourceUrl(settings.proxySource, 'illustrationLowRes', `${selectedSong.id}.png`);

    const renderPreview = (file: FileInfo) => {
        const chartDiff = getChartDifficulty(file);
        if (chartDiff) {
            const color = getDifficultyColor(chartDiff);
            return (
                <div className={`${previewBox} h-[34px] rounded-md border bg-[#fafbfa] flex items-center justify-center`} style={{ borderColor: `${color}55` }}>
                    <span className={`font-mono font-bold tracking-[.06em] ${mobile ? 'text-xs' : 'text-[13px]'}`} style={{ color }}>{chartDiff}</span>
                </div>
            );
        }
        if (file.type === 'Audio') {
            return (
                <div className={`${previewBox} h-[34px] rounded-md bg-[#e9f5ee] border border-[#008c3c]/20 flex items-center justify-center`}>
                    <svg width="16" height="16" fill="#008c3c" viewBox="0 0 24 24"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" /></svg>
                </div>
            );
        }
        const src = /^Illustration \((EZ|HD|IN|AT)\)$/.test(file.type) ? file.url : lowResUrl;
        return (
            <div className={`${previewBox} h-[34px] rounded-md overflow-hidden border border-[#d7e0d9] bg-[repeating-linear-gradient(135deg,#e9eee9_0_4px,#dfe6e1_4px_8px)]`}>
                <img
                    src={src}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    style={file.type === 'Illustration (Blur)' ? { filter: 'blur(2px)' } : undefined}
                />
            </div>
        );
    };

    const describe = (file: FileInfo): { label: string; meta: string } => {
        const chartDiff = getChartDifficulty(file);
        if (chartDiff) return { label: `Chart · ${chartDiff}`, meta: 'JSON' };
        if (file.type === 'Audio') return { label: 'Music', meta: 'OGG' };
        return { label: file.type, meta: RESOLUTIONS[file.type] ?? 'PNG' };
    };

    const mobileMeta = (file: FileInfo): string => {
        if (getChartDifficulty(file)) return `JSON · ${file.name}`;
        if (file.type === 'Audio') return `OGG · ${file.name}`;
        return `PNG · ${RESOLUTIONS[file.type] ?? file.name}`;
    };

    const groups = [
        { label: 'ILLUSTRATIONS', items: files.filter(f => f.type.startsWith('Illustration')) },
        { label: 'AUDIO', items: files.filter(f => f.type === 'Audio') },
        { label: 'CHARTS', items: files.filter(f => f.type.startsWith('Chart')) },
    ].filter(g => g.items.length > 0);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center gap-3 text-sm text-[#4b5c53] py-10">
                <Spinner />
                <span>Checking manifest…</span>
            </div>
        );
    }

    if (groups.length === 0) {
        return <p className="py-10 text-center text-sm text-[#73857b]">No files found for this song.</p>;
    }

    return (
        <>
            <AssetDownloadWarningPopup
                isOpen={!!pendingDownload}
                onConfirm={handleWarningConfirm}
                onCancel={() => setPendingDownload(null)}
            />
            <div className={`flex flex-col ${mobile ? 'gap-5' : 'gap-6'}`}>
                {groups.map(group => (
                    <div key={group.label} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between px-1">
                            <span className="font-mono text-[10px] font-semibold tracking-[.14em] text-[#4b5c53]">{group.label}</span>
                            <span className="font-mono text-[10px] text-[#73857b]">{group.items.length} ITEMS</span>
                        </div>
                        <div className="flex flex-col rounded-xl border border-[#d7e0d9] bg-white overflow-hidden shadow-[0_2px_8px_rgba(18,28,22,0.03)]">
                            {group.items.map((file, i) => {
                                const { label, meta } = describe(file);
                                const isDownloadingThis = downloadingUrl === file.url;
                                return (
                                    <div
                                        key={file.url}
                                        className={`grid items-center ${mobile ? 'grid-cols-[56px_minmax(0,1fr)_44px] gap-3 pl-3 pr-1.5 py-2.5' : 'grid-cols-[48px_minmax(0,1fr)_36px] sm:grid-cols-[64px_minmax(0,1fr)_auto_auto_36px] gap-3 sm:gap-4 px-3.5 py-2.5 hover:bg-[#f4f6f4]'} transition-colors ${i ? 'border-t border-[#e6ece7]' : ''}`}
                                        title={settings.advancedInfo ? file.url : undefined}
                                    >
                                        {renderPreview(file)}
                                        <div className="flex flex-col min-w-0">
                                            <span className="flex items-center gap-1.5 text-sm font-semibold leading-[1.3] text-[#16201a]">
                                                {label}
                                                {file.tooltip && (
                                                    <span title={file.tooltip} className="text-[#73857b] hover:text-[#008c3c] cursor-help">
                                                        <InformationCircleIcon className="w-3.5 h-3.5" />
                                                    </span>
                                                )}
                                            </span>
                                            <span className="font-mono text-[11px] text-[#73857b] truncate">{mobile ? mobileMeta(file) : file.name}</span>
                                        </div>
                                        {!mobile && <span className="hidden sm:block font-mono text-[11px] font-medium text-[#4b5c53]">{meta}</span>}
                                        {!mobile && <span className="hidden sm:block font-mono text-[11px] text-[#73857b] min-w-14 text-right tabular-nums">{formatBytes(file.size)}</span>}
                                        <button
                                            type="button"
                                            onClick={() => handleDownloadClick(file)}
                                            disabled={!!downloadingUrl}
                                            aria-label={`Download ${label}`}
                                            title={`Download ${file.name}`}
                                            className={`${mobile ? 'w-11 h-11 rounded-[10px]' : 'w-9 h-9 rounded-lg'} flex items-center justify-center text-[#008c3c] hover:bg-[#e9f5ee] transition-colors disabled:cursor-not-allowed ${isDownloadingThis ? '' : 'disabled:opacity-40'}`}
                                        >
                                            {isDownloadingThis ? <Spinner /> : <ArrowDownTrayIcon className={mobile ? 'w-[18px] h-[18px]' : 'w-[17px] h-[17px]'} />}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};
