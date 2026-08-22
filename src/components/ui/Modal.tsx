"use client";

import { useEffect, useRef } from "react";
import Icon from "@/components/ui/Icon";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="bg-surface-pure rounded-xl ambient-shadow w-full max-w-[480px] max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h2 className="font-headline text-headline-md text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:text-primary hover:bg-surface-container-low transition-colors"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
