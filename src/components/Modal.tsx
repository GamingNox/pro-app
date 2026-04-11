"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { spring, duration } from "@/lib/motion";
import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "default" | "large";
}

export default function Modal({ open, onClose, title, children, size = "default" }: ModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.overflow = "";
      html.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const handleBackdropTouch = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          onTouchMove={handleBackdropTouch}
        >
          {/* Backdrop — smooth fade with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.normal }}
            onClick={onClose}
            className="absolute inset-0 bg-black/35 backdrop-blur-modal"
          />

          {/* Modal body — spring slide from bottom */}
          <motion.div
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={spring.smooth}
            onTouchMove={(e) => e.stopPropagation()}
            className={`relative z-10 w-full bg-white rounded-t-[28px] sm:rounded-[28px] flex flex-col shadow-apple-lg ${
              size === "large" ? "max-w-xl max-h-[92vh]" : "max-w-lg max-h-[88vh]"
            }`}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 sm:hidden flex-shrink-0">
              <div className="w-10 h-[4px] bg-border/60 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-4 pb-3 flex-shrink-0">
              <h2 className="text-[18px] font-bold text-foreground tracking-tight">{title}</h2>
              <motion.button
                whileTap={{ scale: 0.8 }}
                transition={spring.snappy}
                onClick={onClose}
                className="w-[32px] h-[32px] rounded-full bg-border-light flex items-center justify-center text-muted hover:bg-border transition-colors duration-200"
              >
                <X size={15} strokeWidth={2.5} />
              </motion.button>
            </div>

            {/* Scrollable content */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto overscroll-contain px-6 pb-8 custom-scroll"
              style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
            >
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
