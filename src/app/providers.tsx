"use client";

import { Toaster as Sonner } from "@/components/ui/sonner";
import EnquireActions from "@/components/EnquireActions";
import ScrollManager from "./scroll-manager";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sonner />
      <ScrollManager />
      <EnquireActions />
      {children}
    </>
  );
}
