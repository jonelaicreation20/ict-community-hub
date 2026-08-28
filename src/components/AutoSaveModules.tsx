"use client";

import { useEffect } from "react";
import { saveAllModules, useOnline } from "@/lib/offline";

/** Quietly prepares every lesson after student registration. */
export function AutoSaveModules() {
  const online = useOnline();

  useEffect(() => {
    if (!online) return;

    void saveAllModules(() => {})
      .then(() => navigator.storage?.persist?.())
      .catch(() => {
        // A weak or lost connection is expected. Existing files stay saved,
        // and the next app opening or online event will try the missing files.
      });
  }, [online]);

  return null;
}
