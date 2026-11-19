import React, { useMemo, useState } from 'react';
import { projectDescription, updateLogs } from '../aboutData';
import { DialogFrame, DialogFooter, Eyebrow, CloseButton, Button } from './ui/Dialog';
import { ChevronDownIcon } from './Icons';

interface AboutPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

const REPO_URL = 'https://github.com/swordalt/phigros-chart-downloader/';

// Update logs are stored as HTML lists; pull out the text of each <li>.
const parseLogItems = (html: string): string[] => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return Array.from(doc.querySelectorAll('li'))
        .map(li => (li.textContent || '').trim())
        .filter(Boolean);
};

export const AboutPopup: React.FC<AboutPopupProps> = ({ isOpen, onClose }) => {
    // Index into the version history; the most recent past entry starts open.
    const [openIndex, setOpenIndex] = useState<number>(0);

    const logs = useMemo(() => updateLogs.map(log => ({ date: log.date, items: parseLogItems(log.content) })), []);
    const latest = logs[0];
    const history = logs.slice(1);

    if (!isOpen) return null;

    return (
        <DialogFrame onClose={onClose} labelledBy="about-title" className="w-full max-w-[680px] h-[min(660px,calc(100dvh-32px))]">
            <div className="flex-none flex items-start justify-between gap-6 max-md:gap-4 px-6 max-md:px-5 pt-[22px] pb-5 border-b border-[#e8ede9]">
                <div className="flex flex-col gap-2">
                    <Eyebrow>About the Project</Eyebrow>
                    <h2 id="about-title" className="text-[21px] font-semibold leading-[1.25] text-[#16201a]">Phigros Chart Downloader</h2>
                    <p className="text-sm leading-[1.6] text-[#4b5c53] text-pretty">{projectDescription}</p>
                    <span className="self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#e8f5ee] border border-[#008c3c]/20 font-mono text-[11px] font-semibold text-[#008c3c]">
                        Developed by JackZhang
                    </span>
                </div>
                <CloseButton onClick={onClose} />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto thin-scroll px-6 max-md:px-5 py-5 flex flex-col gap-5">
                {latest && (
                    <div className="rounded-xl border border-[#008c3c]/25 bg-[#e8f5ee]/70 px-[18px] py-4 flex flex-col gap-2.5">
                        <div className="flex items-center gap-2.5">
                            <span className="font-mono text-[10px] font-semibold tracking-[.12em] text-white bg-[#008c3c] px-[7px] py-[3px] rounded">LATEST</span>
                            <span className="font-mono text-[13px] font-semibold text-[#16201a]">{latest.date}</span>
                        </div>
                        <ul className="flex flex-col gap-1.5">
                            {latest.items.map(item => (
                                <li key={item} className="flex gap-2.5 text-sm leading-[1.5] text-[#16201a]">
                                    <span className="text-[#008c3c] font-bold">—</span><span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {history.length > 0 && (
                    <div className="flex flex-col">
                        <span className="font-mono text-[10px] font-semibold tracking-[.14em] text-[#73857b] pb-2">VERSION HISTORY</span>
                        {history.map((log, i) => {
                            const isOpenItem = openIndex === i;
                            return (
                                <div key={log.date} className="border-t border-[#e8ede9]">
                                    <button
                                        type="button"
                                        onClick={() => setOpenIndex(isOpenItem ? -1 : i)}
                                        aria-expanded={isOpenItem}
                                        className="w-full h-[46px] flex items-center justify-between group"
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className={`font-mono text-[13px] font-medium ${isOpenItem ? 'text-[#008c3c]' : 'text-[#16201a] group-hover:text-[#008c3c]'}`}>{log.date}</span>
                                            <span className="text-xs text-[#73857b]">{log.items.length} {log.items.length === 1 ? 'change' : 'changes'}</span>
                                        </span>
                                        <ChevronDownIcon className={`w-3.5 h-3.5 text-[#73857b] transition-transform duration-200 ${isOpenItem ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isOpenItem && (
                                        <ul className="pb-3.5 flex flex-col gap-1.5">
                                            {log.items.map(item => (
                                                <li key={item} className="flex gap-2.5 text-[13px] leading-[1.5] text-[#4b5c53]">
                                                    <span className="text-[#8b9a91]">—</span><span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <DialogFooter>
                <span className="text-[13px] text-[#4b5c53]">
                    Developed by <b className="text-[#16201a]">JackZhang</b> · Source on <a href={REPO_URL} target="_blank" rel="noreferrer" className="text-[#008c3c] font-medium hover:underline">GitHub</a>.
                </span>
                <Button variant="outline" size="md" onClick={onClose}>Close</Button>
            </DialogFooter>
        </DialogFrame>
    );
};
