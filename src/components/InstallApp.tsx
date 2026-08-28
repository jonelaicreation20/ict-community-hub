"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const DISMISSED_KEY = "ict-install-prompt-dismissed";
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

type InstallChoice = { outcome: "accepted" | "dismissed"; platform: string };

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
}

type InstallMode = "prompt" | "android-help" | "ios-help" | null;

function isInstalled() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

function wasRecentlyDismissed() {
  const dismissedAt = Number(window.localStorage.getItem(DISMISSED_KEY));
  return dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_FOR_MS;
}

export function InstallApp() {
  const pathname = usePathname();
  const [mode, setMode] = useState<InstallMode>(null);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    if (isInstalled() || wasRecentlyDismissed()) return;

    const userAgent = navigator.userAgent.toLowerCase();
    const isIPad = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    const isIOS = /iphone|ipad|ipod/.test(userAgent) || isIPad;
    const isAndroid = /android/.test(userAgent);

    const helpMode: InstallMode = isIOS ? "ios-help" : isAndroid ? "android-help" : null;
    const revealHelp = window.setTimeout(() => setMode((current) => current ?? helpMode), 0);

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
      setMode("prompt");
    };

    const handleInstalled = () => {
      setMode(null);
      setInstallPrompt(null);
      window.localStorage.removeItem(DISMISSED_KEY);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.clearTimeout(revealHelp);
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!mode || pathname !== "/") return null;

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setMode(null);
  };

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === "accepted") setMode(null);
    else setMode("android-help");
  };

  return (
    <aside className="install-card" aria-label="Install Community ICT Hub">
      <button className="install-close" type="button" onClick={dismiss} aria-label="Hide install message">×</button>
      <div className="install-icon" aria-hidden="true">ICT</div>
      <div className="install-copy">
        <p className="eyebrow">KEEP IT ON YOUR PHONE</p>
        <h2>Install this app</h2>
        {mode === "prompt" && <p>Open lessons faster and keep saved modules available offline.</p>}
        {mode === "android-help" && (
          <p>In Chrome, tap <strong>⋮ Menu</strong>, then <strong>Add to Home screen</strong> or <strong>Install app</strong>.</p>
        )}
        {mode === "ios-help" && (
          <p>In Safari, tap <strong>Share</strong> <span aria-hidden="true">□↑</span>, then <strong>Add to Home Screen</strong>.</p>
        )}
        {mode === "prompt" && <button className="install-action" type="button" onClick={install}>Install now</button>}
      </div>
    </aside>
  );
}
