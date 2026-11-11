"use client";

import BlogManager from "@/components/dashboard/BlogManager";
import PageManager from "@/components/dashboard/PageManager";
import ProductManager from "@/components/dashboard/ProductManager";
import MediaLibrary from "@/components/dashboard/MediaLibrary";
import Overview from "@/components/dashboard/Overview";
import { ConfirmProvider } from "@/components/dashboard/confirm";
import { btnPrimary, inputCls } from "@/components/dashboard/admin-ui";
import { Eye, EyeOff, ExternalLink, FileText, Images, LayoutDashboard, LayoutTemplate, Loader2, LogOut, Menu, Package, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";

const ADMIN_TOKEN_STORAGE_KEY = "admin_token";

const sections = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "blogs", label: "Blog posts", icon: FileText },
  { id: "pages", label: "Pages", icon: LayoutTemplate },
  { id: "media", label: "Media library", icon: Images },
] as const;

type SectionId = (typeof sections)[number]["id"];
type Route = { section: SectionId; id?: string };

/** Hash routes: #/products, #/products/<id>, #/products/new, #/blogs/…, #/pages/…, #/media */
function parseRoute(): Route {
  if (typeof window === "undefined") return { section: "dashboard" };
  const [, section, id] = window.location.hash.replace(/^#/, "").split("/");
  const found = sections.find((s) => s.id === section);
  return found ? { section: found.id, id: id ? decodeURIComponent(id) : undefined } : { section: "dashboard" };
}

const Logo = ({ className = "" }: { className?: string }) => (
  <img src="/logo-360.webp" srcSet="/logo-360.webp 1x, /logo-720.webp 2x" alt="Foto Laminate" width={204} height={36} className={className} />
);

const DashboardPage = () => {
  const [storedToken, setStoredToken] = useState<string>("");
  const [ready, setReady] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string>("");
  const [route, setRoute] = useState<Route>({ section: "dashboard" });
  const [navOpen, setNavOpen] = useState(false);

  // Unsaved-changes guard shared by all editors.
  const dirtyRef = useRef(false);
  const currentHash = useRef("");
  const onDirtyChange = useCallback((d: boolean) => {
    dirtyRef.current = d;
  }, []);

  useEffect(() => {
    try {
      setStoredToken(window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) ?? "");
    } catch {
      setStoredToken("");
    }
    setRoute(parseRoute());
    currentHash.current = window.location.hash;
    setReady(true);
    const onHash = () => {
      if (window.location.hash === currentHash.current) return;
      if (dirtyRef.current && !window.confirm("You have unsaved changes. Leave without saving?")) {
        window.location.hash = currentHash.current; // undo the navigation (e.g. browser Back)
        return;
      }
      dirtyRef.current = false;
      currentHash.current = window.location.hash;
      setRoute(parseRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const hasToken = useMemo(() => Boolean(storedToken.trim()), [storedToken]);

  async function login(e?: React.FormEvent) {
    e?.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const username = adminUsername.trim();
      const password = adminPassword;
      if (!username || !password) throw new Error("Enter your username and password.");

      const { token } = await api.auth.login(username, password);
      if (!token?.trim()) throw new Error("Server did not return a token");

      try {
        window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
      } catch {
        // ignore
      }
      setStoredToken(token);
      setAdminPassword("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Login failed";
      setLoginError(msg === "Invalid credentials" ? "That username and password don't match. Try again." : msg);
    } finally {
      setLoggingIn(false);
    }
  }

  function clearToken() {
    if (dirtyRef.current && !window.confirm("You have unsaved changes. Log out anyway?")) return;
    dirtyRef.current = false;
    setAdminPassword("");
    setLoginError("");
    try {
      window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
    setStoredToken("");
  }

  const navigate = useCallback((path: string) => {
    setNavOpen(false);
    const hash = `#${path}`;
    if (hash === window.location.hash) return;
    if (dirtyRef.current && !window.confirm("You have unsaved changes. Leave without saving?")) return;
    dirtyRef.current = false;
    currentHash.current = hash;
    window.location.hash = path;
    setRoute(parseRoute());
    window.scrollTo(0, 0);
  }, []);

  if (!ready) return <div className="min-h-screen bg-slate-100" />;

  /* ------------------------------------------------------------ login */
  if (!hasToken) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[hsl(213_62%_13%)] px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <Logo className="h-9 w-auto" />
          </div>
          <form onSubmit={login} className="rounded-2xl bg-white p-7 shadow-2xl">
            <h1 className="font-display text-2xl font-bold text-slate-900">Sign in to admin</h1>
            <p className="mt-1 text-sm text-slate-500">Manage products, blog posts and page content.</p>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Username</span>
                <input
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span>
                <span className="relative block">
                  <input
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              </label>
            </div>

            {loginError ? (
              <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {loginError}
              </p>
            ) : null}

            <button type="submit" disabled={loggingIn} className={`${btnPrimary} mt-6 h-10 w-full`}>
              {loggingIn ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : null}
              {loggingIn ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-primary-foreground/50">
            <a href="/" className="hover:text-primary-foreground">← Back to website</a>
          </p>
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------ app */
  const nav = (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo className="h-7 w-auto" />
      </div>
      <ul className="mt-2 space-y-0.5 px-3">
        {sections.map(({ id, label, icon: Icon }) => {
          const active = id === route.section;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => navigate(id === "dashboard" ? "/" : `/${id}`)}
                aria-current={active ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-accent text-accent-foreground" : "text-primary-foreground/75 hover:bg-white/10 hover:text-primary-foreground"
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto space-y-0.5 border-t border-white/10 p-3">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-primary-foreground/75 transition hover:bg-white/10 hover:text-primary-foreground"
        >
          <ExternalLink size={18} aria-hidden="true" /> View website
        </a>
        <button
          type="button"
          onClick={clearToken}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-primary-foreground/75 transition hover:bg-white/10 hover:text-primary-foreground"
        >
          <LogOut size={18} aria-hidden="true" /> Log out
        </button>
      </div>
    </nav>
  );

  const sectionProps = { routeId: route.id, navigate, onDirtyChange };

  return (
    <ConfirmProvider>
    <div className="min-h-screen bg-slate-100">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 bg-[hsl(213_62%_13%)] lg:block">{nav}</aside>

      {/* Sidebar (mobile drawer) */}
      {navOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setNavOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-[hsl(213_62%_13%)] shadow-xl">{nav}</aside>
        </div>
      ) : null}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
          <button type="button" onClick={() => setNavOpen(true)} className="rounded-md p-2 text-slate-600 hover:bg-slate-100" aria-label="Open menu">
            {navOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-display text-lg font-bold text-slate-900">{sections.find((s) => s.id === route.section)?.label}</span>
        </header>

        <main className="min-h-screen">
          {route.section === "dashboard" ? <Overview navigate={navigate} /> : null}
          {route.section === "products" ? <ProductManager key={`p-${route.id ?? "list"}`} {...sectionProps} /> : null}
          {route.section === "blogs" ? <BlogManager key={`b-${route.id ?? "list"}`} {...sectionProps} /> : null}
          {route.section === "pages" ? <PageManager key={`g-${route.id ?? "list"}`} {...sectionProps} /> : null}
          {route.section === "media" ? <MediaLibrary /> : null}
        </main>
      </div>
    </div>
    </ConfirmProvider>
  );
};

export default DashboardPage;
