import React, { useEffect, useRef, useId, memo } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

const MODAL_MAX_WIDTH_CLASSES = Object.freeze({
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
    "2xl": "sm:max-w-2xl",
});

export const Modal = memo(({
                               isOpen,
                               onClose,
                               title,
                               titleFa,
                               children,
                               maxWidth = "md",
                               className,
                           }) => {
    const modalRef = useRef(null);
    const titleId = useId();
    const hasInitialFocusedRef = useRef(false);

    // مدیریت Focus Trap و فوکوس اولیه امن طبق WCAG 2.2 AA بدون سرقت فوکوس از اینپوت‌ها
    useEffect(() => {
        if (!isOpen) {
            hasInitialFocusedRef.current = false;
            return;
        }

        // در صورتی که کاربر هم‌اکنون درون مدال در حال تایپ است، فوکوس به هیچ وجه جابجا نشود
        if (modalRef.current?.contains(document.activeElement)) {
            return;
        }

        if (hasInitialFocusedRef.current) return;
        hasInitialFocusedRef.current = true;

        const previousActiveElement = document.activeElement;

        const timer = setTimeout(() => {
            if (!modalRef.current) return;

            // در دسکتاپ فوکوس اولیه روی اولین فیلد متنی قرار می‌گیرد؛ در موبایل از باز شدن ناخواسته کیبورد قبل از دیدن فرم جلوگیری می‌شود
            const isMobileViewport = typeof window !== "undefined" && window.innerWidth < 640;
            if (!isMobileViewport) {
                const firstInput = modalRef.current.querySelector(
                    'input:not([disabled]):not([type="hidden"]), textarea:not([disabled])'
                );

                if (firstInput) {
                    firstInput.focus();
                    return;
                }
            }

            const focusableElements = modalRef.current.querySelectorAll(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );

            if (focusableElements && focusableElements.length > 0) {
                focusableElements[0].focus();
            }
        }, 60);

        const handleGlobalKeyDown = (e) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                onClose();
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown);

        return () => {
            clearTimeout(timer);
            window.removeEventListener("keydown", handleGlobalKeyDown);
            if (previousActiveElement && typeof previousActiveElement.focus === "function") {
                previousActiveElement.focus();
            }
        };
    }, [isOpen, onClose]);

    const handleKeyDown = (e) => {
        if (e.key !== "Tab" || !modalRef.current) return;

        const focusableElements = modalRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onKeyDown={handleKeyDown}
                className={cn(
                    "relative w-full bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-[1.75rem] sm:rounded-3xl shadow-2xl overflow-hidden z-10 animate-sheet-up sm:animate-fade-in-up text-zinc-100 flex flex-col max-h-[90dvh] sm:max-h-[88dvh]",
                    MODAL_MAX_WIDTH_CLASSES[maxWidth] || MODAL_MAX_WIDTH_CLASSES.md,
                    className
                )}
            >
                {/* دستگیره بصری Bottom Sheet مخصوص موبایل */}
                <div className="sm:hidden w-full flex justify-center pt-2.5 pb-1 bg-zinc-900/95 shrink-0" aria-hidden="true">
                    <div className="w-10 h-1.5 rounded-full bg-zinc-700/80" />
                </div>

                <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 bg-zinc-900/95 shrink-0">
                    <div className="min-w-0 pr-1">
                        <h3 id={titleId} className="text-sm sm:text-base font-bold text-zinc-100 truncate">{title}</h3>
                        {titleFa && <p className="text-[11px] sm:text-xs text-zinc-400 font-fa mt-0.5 truncate">{titleFa}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="بستن پنجره"
                        className="w-10 h-10 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 active:scale-90 transition-all cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                    >
                        <X className="w-4 h-4 sm:w-4 sm:h-4" aria-hidden="true" />
                    </button>
                </div>

                <div
                    className="p-4 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 overflow-y-auto custom-scrollbar flex-1"
                    style={{ WebkitOverflowScrolling: "touch" }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
});

Modal.displayName = "Modal";
export default Modal;