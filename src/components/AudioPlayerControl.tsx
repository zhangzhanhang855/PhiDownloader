import React, { useEffect, useRef, useState } from 'react';
import { resourceFetch } from '../utils/githubAuth';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from './Icons';

type WebkitAudioWindow = Window & typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
};

interface AudioPlayerControlProps {
    audio: HTMLAudioElement;
    variant?: 'default' | 'mobile';
}

const isIosBrowser = () => {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent;
    const platform = window.navigator.platform;
    const maxTouchPoints = window.navigator.maxTouchPoints || 0;
    return /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
};

const getLastRangeEnd = (ranges: TimeRanges) => (ranges.length === 0 ? 0 : ranges.end(ranges.length - 1));

const isValidDuration = (duration: number | undefined) => (
    typeof duration === 'number' && Number.isFinite(duration) && duration > 0
);

const decodeAudioDuration = async (src: string, signal: AbortSignal) => {
    const response = await resourceFetch(src, { cache: 'force-cache', signal });
    if (!response.ok) throw new Error(`Audio duration probe failed with ${response.status}`);
    const encodedAudio = await response.arrayBuffer();
    if (signal.aborted) return null;

    const AudioContextConstructor = window.AudioContext || (window as WebkitAudioWindow).webkitAudioContext;
    if (!AudioContextConstructor) return null;

    const context = new AudioContextConstructor();
    try {
        const decodedAudio = await new Promise<AudioBuffer>((resolve, reject) => {
            const decodeResult = context.decodeAudioData(encodedAudio.slice(0), resolve, reject);
            if (decodeResult) decodeResult.then(resolve, reject);
        });
        return decodedAudio.duration;
    } finally {
        void context.close().catch(() => undefined);
    }
};

export const AudioPlayerControl: React.FC<AudioPlayerControlProps> = ({ audio, variant = 'default' }) => {
    const mobile = variant === 'mobile';
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [decodedDuration, setDecodedDuration] = useState<number | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isPlaying, setIsPlaying] = useState(!audio.paused);
    const [isFullyLoaded, setIsFullyLoaded] = useState(false);
    const seekBarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setDecodedDuration(null);
        setIsFullyLoaded(false);
        if (!isIosBrowser() || !audio.src) return;

        const abortController = new AbortController();
        decodeAudioDuration(audio.src, abortController.signal)
            .then(decoded => {
                if (abortController.signal.aborted || !isValidDuration(decoded ?? undefined)) return;
                setDecodedDuration(decoded);
                setDuration(decoded);
                setIsFullyLoaded(true);
            })
            .catch(error => {
                if (!abortController.signal.aborted) console.warn("Could not decode audio duration:", error);
            });

        return () => abortController.abort();
    }, [audio]);

    useEffect(() => {
        const getNormalizedDuration = () => {
            if (isValidDuration(decodedDuration ?? undefined)) return decodedDuration!;
            const reportedDuration = audio.duration;
            const seekableEnd = getLastRangeEnd(audio.seekable);
            if (isValidDuration(reportedDuration)) {
                if (isValidDuration(seekableEnd) && reportedDuration - seekableEnd > 0.5) return seekableEnd;
                return reportedDuration;
            }
            return isValidDuration(seekableEnd) ? seekableEnd : 0;
        };

        const updateTime = () => { if (!isDragging) setCurrentTime(audio.currentTime); };
        const updateDuration = () => {
            const d = getNormalizedDuration();
            if (isValidDuration(d)) setDuration(d);
        };
        const checkBuffered = () => {
            const normalizedDuration = getNormalizedDuration();
            const bufferedEnd = getLastRangeEnd(audio.buffered);
            const seekableEnd = getLastRangeEnd(audio.seekable);
            if (isValidDuration(normalizedDuration)) {
                if (isValidDuration(decodedDuration ?? undefined) || bufferedEnd >= normalizedDuration - 0.5 || seekableEnd >= normalizedDuration - 0.5) {
                    setIsFullyLoaded(true);
                }
            }
        };
        const updateVolume = () => setIsMuted(audio.muted);
        const updatePlayState = () => setIsPlaying(!audio.paused);
        const handleEnded = () => {
            setIsPlaying(false);
            if (isValidDuration(audio.currentTime) && audio.currentTime < getNormalizedDuration() - 0.5) {
                setDuration(audio.currentTime);
                setCurrentTime(audio.currentTime);
            }
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('durationchange', updateDuration);
        audio.addEventListener('loadeddata', updateDuration);
        audio.addEventListener('canplaythrough', checkBuffered);
        audio.addEventListener('progress', updateDuration);
        audio.addEventListener('progress', checkBuffered);
        audio.addEventListener('suspend', updateDuration);
        audio.addEventListener('volumechange', updateVolume);
        audio.addEventListener('play', updatePlayState);
        audio.addEventListener('pause', updatePlayState);
        audio.addEventListener('ended', handleEnded);

        updateDuration();
        checkBuffered();
        setCurrentTime(audio.currentTime || 0);
        setIsMuted(audio.muted);
        setIsPlaying(!audio.paused);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('durationchange', updateDuration);
            audio.removeEventListener('loadeddata', updateDuration);
            audio.removeEventListener('canplaythrough', checkBuffered);
            audio.removeEventListener('progress', updateDuration);
            audio.removeEventListener('progress', checkBuffered);
            audio.removeEventListener('suspend', updateDuration);
            audio.removeEventListener('volumechange', updateVolume);
            audio.removeEventListener('play', updatePlayState);
            audio.removeEventListener('pause', updatePlayState);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [audio, decodedDuration, isDragging]);

    const formatTime = (time: number) => {
        if (isNaN(time) || !isFinite(time)) return "0:00";
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const canSeek = duration > 0 && isFullyLoaded;
    const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

    const seekToPointer = (clientX: number) => {
        const rect = seekBarRef.current?.getBoundingClientRect();
        if (!rect || !canSeek) return;
        const time = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * duration;
        setCurrentTime(time);
        audio.currentTime = time;
    };

    const handleSeekEnd = () => {
        setIsDragging(false);
        if (audio.paused && duration > 0 && audio.currentTime < duration) {
            audio.play().catch(err => console.warn("Could not resume playback:", err));
        }
    };

    const handleSeekKey = (e: React.KeyboardEvent) => {
        if (!canSeek) return;
        const delta = e.key === 'ArrowRight' ? 5 : e.key === 'ArrowLeft' ? -5 : 0;
        if (!delta) return;
        e.preventDefault();
        audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + delta));
    };

    const toggleMute = () => {
        const newMuted = !audio.muted;
        audio.muted = newMuted;
        setIsMuted(newMuted);
    };

    const togglePlay = () => {
        if (audio.paused) audio.play().catch(err => console.warn("Could not play audio:", err));
        else audio.pause();
    };

    return (
        <div className={`flex items-center gap-3 rounded-xl bg-[#f8faf8] border border-[#d7e0d9] ${mobile ? 'w-full p-2' : 'py-2 px-3'}`}>
            <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className={`${mobile ? 'w-10 h-10' : 'w-8 h-8'} flex-none rounded-lg bg-[#008c3c] hover:bg-[#007331] flex items-center justify-center transition-colors shadow-xs`}
            >
                {isPlaying ? (
                    <svg width={mobile ? 18 : 15} height={mobile ? 18 : 15} fill="#ffffff" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                ) : (
                    <svg width={mobile ? 18 : 15} height={mobile ? 18 : 15} fill="#ffffff" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
            </button>

            <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-semibold tracking-[.12em] text-[#008c3c]">
                        {isPlaying ? 'MELODY PLAYING' : 'MELODY PREVIEW'}
                    </span>
                    <span className="font-mono text-[11px] font-medium text-[#4b5c53] tabular-nums whitespace-nowrap">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                </div>
                <div
                    ref={seekBarRef}
                    role="slider"
                    tabIndex={canSeek ? 0 : -1}
                    aria-label="Seek"
                    aria-valuemin={0}
                    aria-valuemax={Math.round(duration)}
                    aria-valuenow={Math.round(currentTime)}
                    aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
                    aria-disabled={!canSeek}
                    title={canSeek ? undefined : 'Loading audio…'}
                    onKeyDown={handleSeekKey}
                    onPointerDown={(e) => {
                        if (!canSeek) return;
                        e.currentTarget.setPointerCapture(e.pointerId);
                        setIsDragging(true);
                        seekToPointer(e.clientX);
                    }}
                    onPointerMove={(e) => {
                        if (e.currentTarget.hasPointerCapture(e.pointerId)) seekToPointer(e.clientX);
                    }}
                    onPointerUp={handleSeekEnd}
                    onPointerCancel={() => setIsDragging(false)}
                    className={`group relative ${mobile ? 'h-6' : 'w-full min-w-[140px] h-4'} flex items-center touch-none focus:outline-none ${canSeek ? 'cursor-pointer' : 'cursor-progress'}`}
                >
                    <div className="w-full h-1.5 rounded-full bg-[#dce3dd] overflow-hidden">
                        <div className={`h-full rounded-full bg-[#008c3c] ${canSeek ? '' : 'opacity-50'}`} style={{ width: `${progress * 100}%` }} />
                    </div>
                    {canSeek && (
                        <div
                            className={mobile
                                ? 'absolute w-3.5 h-3.5 -ml-[7px] rounded-full bg-white border-2 border-[#008c3c] shadow'
                                : 'absolute w-3 h-3 -ml-1.5 rounded-full bg-white border-2 border-[#008c3c] shadow opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity'}
                            style={{ left: `${progress * 100}%` }}
                        />
                    )}
                </div>
            </div>

            <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                title={isMuted ? 'Unmute' : 'Mute'}
                className="w-8 h-8 flex-none rounded-lg flex items-center justify-center text-[#4b5c53] hover:bg-[#e9f5ee] hover:text-[#008c3c] transition-colors"
            >
                {isMuted ? <SpeakerXMarkIcon className="w-4 h-4" /> : <SpeakerWaveIcon className="w-4 h-4" />}
            </button>
        </div>
    );
};
