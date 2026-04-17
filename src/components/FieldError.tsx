"use client";

import { AnimatePresence, motion } from "framer-motion";

/**
 * Inline field validation error. Shows under an input when `error` is truthy.
 * <FieldError error={errors.email} />
 */
export default function FieldError({ error }: { error?: string | null }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.15 }}
          className="text-[11px] text-danger font-semibold mt-1 leading-tight"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
