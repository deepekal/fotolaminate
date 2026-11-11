"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmOptions = {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** One shared confirmation dialog for every delete/remove action in the admin. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    resolver.current?.(false); // a previous dialog left open counts as cancelled
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function close(ok: boolean) {
    resolver.current?.(ok);
    resolver.current = null;
    setOptions(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={options !== null} onOpenChange={(open) => !open && close(false)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle size={20} aria-hidden="true" />
              </span>
              <div className="space-y-1.5 text-left">
                <AlertDialogTitle className="text-base font-semibold text-slate-900">{options?.title}</AlertDialogTitle>
                {options?.description ? (
                  <AlertDialogDescription className="text-sm leading-relaxed text-slate-600">{options.description}</AlertDialogDescription>
                ) : null}
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => close(false)}>{options?.cancelLabel ?? "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={() => close(true)} className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600">
              {options?.confirmLabel ?? "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

/** `const confirm = useConfirm(); if (!(await confirm({ title: "Delete…?" }))) return;` */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  return ctx ?? (async ({ title }) => window.confirm(title));
}
