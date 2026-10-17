import React, { useEffect, useRef, useId, memo } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

const MODAL_MAX_WIDTH_CLASSES = Object.freeze({
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
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

    // مدیریت Focus Trap و فوکوس اولیه امن طبق WCAG 2.1 AA بدون سرقت فوکوس از اینپوت‌ها
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

            // اولویت فوکوس اولیه به اولین فیلد ورودی متن به جای دکمه بستن پنجره
            const firstInput = modalRef.current.querySelector(
                'input:not([disabled]):not([type="hidden"]), textarea:not([disabled])'
            );

            if (firstInput) {
                firstInput.focus();
                return;
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
    }, [isOpen]);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4">
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
                    "relative w-full bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150 text-zinc-100 flex flex-col max-h-[88dvh]",
                    MODAL_MAX_WIDTH_CLASSES[maxWidth] || MODAL_MAX_WIDTH_CLASSES.md,
                    className
                )}
            >
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 bg-zinc-900/90 shrink-0">
                    <div>
                        <h3 id={titleId} className="text-sm sm:text-base font-bold text-zinc-100">{title}</h3>
                        {titleFa && <p className="text-[11px] sm:text-xs text-zinc-400 font-fa mt-0.5">{titleFa}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="بستن پنجره"
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                    >
                        <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                </div>

                <div
                    className="p-3.5 sm:p-6 overflow-y-auto custom-scrollbar flex-1"
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