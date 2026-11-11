"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const NotFound = () => {
  const pathname = usePathname();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", pathname);
  }, [pathname]);

  return (
    <>
      <Navbar />
      <div className="section-padding flex min-h-screen items-center justify-center bg-muted pt-28">
        <div className="container-max">
          <div className="mx-auto max-w-xl rounded-lg border border-border bg-card p-8 text-center shadow-industrial">
            <h1 className="mb-3 font-display text-5xl font-bold text-foreground">404</h1>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              The page you are looking for does not exist or has been moved.
            </p>
            <Link
              href="/"
              className="inline-block rounded-md gradient-navy px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90"
            >
              Return to home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NotFound;
