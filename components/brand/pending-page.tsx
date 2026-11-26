"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PageLoading } from "@/components/brand/page-loading";

export function PendingPage({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const waiting = pendingPath !== null && pendingPath !== pathname;

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest("a");
      if (!anchor || anchor.getAttribute("target") === "_blank") return;
      if (!anchor.closest("header, nav[aria-label='Main']")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setPendingPath(url.pathname);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!waiting) return;
    const timer = window.setTimeout(() => setPendingPath(null), 8000);
    return () => window.clearTimeout(timer);
  }, [waiting]);

  if (waiting) return <PageLoading />;
  return children;
}
