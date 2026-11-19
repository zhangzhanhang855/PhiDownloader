import React, { useEffect } from 'react';

export type Tone = 'info' | 'warning' | 'error';

const TOPLINE: Record<Tone, string> = {
    info: '#008c3c',
    warning: '#d97706',
    error: '#dc2626',
};

const EYEBROW_COLOR: Record<Tone, string> = {
    info: 'text-[#008c3c]',
    warning: 'text-[#d97706]',
    error: 'text-[#dc2626]',
};

interface DialogFrameProps {
    onClose: () => void;
    /** Whether clicking the backdrop closes the dialog. Escape always calls onClose. */
    closeOnBackdrop?: boolean;
    tone?: Tone;
    labelledBy?: string;
    role?: 'dialog' | 'alertdialog';
    /** How the dialog is presented on phones: a bottom sheet sized to its content, or a full-height panel. */
    mobile?: 'sheet' | 'panel';
    className?: string;
    children: React.ReactNode;
}

const MOBILE_PANEL: Record<'sheet' | 'panel', string> = {
    sheet: 'max-md:w-full max-md:max-w-none max-md:max-h-[86dvh] max-md:rounded-b-none max-md:rounded-t-[22px] max-md:border-b-0',
    panel: 'max-md:w-full max-md:max-w-none max-md:h-[calc(100dvh-10px)] max-md:max-h-none max-md:rounded-b-none max-md:border-b-0',
};

/** Soft backdrop plus clean white JR-styled dialog panel with a solid top accent bar. */
export const DialogFrame: React.FC<DialogFrameProps> = ({
    onClose,
    closeOnBackdrop = true,
    tone = 'info',
    labelledBy,
    role = 'dialog',
    mobile = 'panel',
    className = '',
    children,
}) => {
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    return (
        <div
            className="motion-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 max-md:p-0 max-md:items-end bg-[rgba(22,32,26,0.38)] backdrop-blur-[5px]"
            role={role}
            aria-modal="true"
            aria-labelledby={labelledBy}
            onClick={closeOnBackdrop ? onClose : undefined}
        >
            <div
                className={`motion-dialog relative flex flex-col overflow-hidden rounded-2xl border border-[#dce3dd] bg-white shadow-[0_24px_64px_rgba(22,32,26,0.18)] ${className} ${MOBILE_PANEL[mobile]}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="dialog-topline" style={{ background: TOPLINE[tone] }} />
                {mobile === 'sheet' && (
                    <button type="button" onClick={onClose} aria-label="Close" className="md:hidden flex-none -mt-1 -mb-1 h-[22px] flex items-center justify-center">
                        <span className="w-9 h-1 rounded-sm bg-[#cbd5ce]" />
                    </button>
                )}
                {children}
            </div>
        </div>
    );
};

export const Eyebrow: React.FC<{ tone?: Tone; className?: string; children: React.ReactNode }> = ({ tone = 'info', className = '', children }) => (
    <span className={`flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[.16em] uppercase ${EYEBROW_COLOR[tone]} ${className}`}>
        {children}
    </span>
);

export const CloseButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button
        type="button"
        onClick={onClick}
        aria-label="Close"
        className="flex-none w-[34px] h-[34px] max-md:w-11 max-md:h-11 max-md:-mr-1.5 max-md:rounded-[10px] rounded-lg flex items-center justify-center text-[#73857b] hover:bg-[#eef2ee] hover:text-[#16201a] transition-colors"
    >
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    </button>
);

interface DialogHeaderProps {
    id?: string;
    eyebrow: React.ReactNode;
    title: React.ReactNode;
    onClose: () => void;
}

/** 68px header used by the large dialogs (Settings, FAQ). */
export const DialogHeader: React.FC<DialogHeaderProps> = ({ id, eyebrow, title, onClose }) => (
    <div className="h-[68px] flex-none flex items-center justify-between gap-3 px-6 max-md:px-5 border-b border-[#e8ede9]">
        <div className="flex flex-col">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2 id={id} className="text-[21px] font-semibold leading-[1.25] text-[#16201a]">{title}</h2>
        </div>
        <CloseButton onClick={onClose} />
    </div>
);

export const DialogFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`flex-none min-h-16 flex flex-wrap items-center justify-between gap-3 px-6 py-3 max-md:px-5 max-md:pb-[calc(16px+env(safe-area-inset-bottom))] border-t border-[#e8ede9] bg-[#f8faf8] ${className}`}>
        {children}
    </div>
);

type ButtonVariant = 'primary' | 'warning' | 'danger' | 'outline' | 'ghost';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
    primary: 'bg-[#008c3c] hover:bg-[#007331] text-white font-bold',
    warning: 'bg-[#d97706] hover:bg-[#b45309] text-white font-bold',
    danger: 'bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold',
    outline: 'border border-[#dce3dd] bg-white hover:bg-[#f1f4f2] text-[#16201a] font-semibold',
    ghost: 'text-[#4b5c53] hover:text-[#16201a] hover:bg-[#eef2ee] font-semibold',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: 'sm' | 'md';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'outline', size = 'sm', className = '', ...props }) => {
    const sizing = size === 'md'
        ? 'px-[22px] py-[9px] text-sm rounded-[9px]'
        : variant === 'ghost' ? 'px-2.5 py-2 text-[13px] rounded-lg' : 'px-3.5 py-2 text-[13px] rounded-lg';
    return (
        <button
            type="button"
            className={`transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${sizing} ${BUTTON_VARIANTS[variant]} ${className}`}
            {...props}
        />
    );
};

interface NoticeDialogProps {
    tone: Tone;
    icon: React.ReactNode;
    eyebrow: string;
    title: string;
    onClose: () => void;
    /** Shown in the bottom-left corner, e.g. "Shown once". */
    footnote?: string;
    actions: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Compact notice frame (info, warning or error). Only informational notices close when
 * the backdrop is clicked.
 */
export const NoticeDialog: React.FC<NoticeDialogProps> = ({ tone, icon, eyebrow, title, onClose, footnote, actions, children }) => {
    const titleId = `notice-${eyebrow.toLowerCase().replace(/\s+/g, '-')}`;
    return (
        <DialogFrame
            onClose={onClose}
            tone={tone}
            closeOnBackdrop={tone === 'info'}
            role={tone === 'info' ? 'dialog' : 'alertdialog'}
            labelledBy={titleId}
            mobile="sheet"
            className="w-full max-w-[440px] gap-3.5 px-[22px] pt-[24px] pb-[18px] max-md:px-5 max-md:pt-2 max-md:pb-[calc(24px+env(safe-area-inset-bottom))] max-md:overflow-y-auto shadow-[0_24px_60px_rgba(22,32,26,0.16)]"
        >
            <Eyebrow tone={tone} className="tracking-[.14em]">{icon}{eyebrow}</Eyebrow>
            <h2 id={titleId} className="text-[19px] max-md:text-[21px] font-semibold leading-[1.3] text-[#16201a]">{title}</h2>
            {children}
            <div className={`flex flex-wrap items-center gap-2 pt-1 max-md:flex-col-reverse max-md:items-stretch max-md:gap-3.5 ${footnote ? 'justify-between' : 'justify-end'}`}>
                {footnote && (
                    <span className="font-mono text-[10px] font-medium tracking-[.08em] uppercase text-[#73857b] max-md:text-center">{footnote}</span>
                )}
                <div className="flex flex-wrap items-center justify-end gap-2 max-md:flex-col-reverse max-md:items-stretch max-md:gap-2.5 max-md:[&>button]:h-[52px] max-md:[&>button]:rounded-xl max-md:[&>button]:text-[15px]">{actions}</div>
            </div>
        </DialogFrame>
    );
};

const iconProps = { width: 14, height: 14, fill: 'none', viewBox: '0 0 24 24', strokeWidth: 2, stroke: 'currentColor' } as const;

export const InfoGlyph = () => (
    <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
);

export const WarningGlyph = () => (
    <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
);

export const ErrorGlyph = () => (
    <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
);

export const WrenchGlyph = () => (
    <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" /></svg>
);
