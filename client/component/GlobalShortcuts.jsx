"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const GlobalShortcuts = () => {
  const router = useRouter();

  useEffect(() => {
    const shortcuts = {
      b: "/client/billing",
      r: "/client/inventory/return",
      d: "/client/debts",
    };

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (isCmdOrCtrl && shortcuts[key]) {
        event.preventDefault();
        router.push(shortcuts[key]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return null;
};

export default GlobalShortcuts;