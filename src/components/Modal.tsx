"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "default" | "large";
}

export default function Modal({ open, onClose, title, children, size = "default" }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/30 backdrop-blur-modal"
          />

          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className={`relative z-10 w-full bg-white rounded-t-[24px] sm:rounded-[24px] flex flex-col sm:mb-0 shadow-apple-lg ${
              size === "large" ? "max-w-xl max-h-[92vh]" : "max-w-lg max-h-[88vh]"
            }`}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 sm:hidden">
              <div className="w-9 h-[4px] bg-border rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-4 pb-3">
              <h2 className="text-[17px] font-bold text-foreground tracking-tight">{title}</h2>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={onClose}
                className="w-[30px] h-[30px] rounded-full bg-border-light flex items-center justify-center text-muted hover:bg-border transition-colors"
              >
                <X size={14} strokeWidth={2.5} />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-8 custom-scroll">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
