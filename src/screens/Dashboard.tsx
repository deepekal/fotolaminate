"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BlogManager from "@/components/dashboard/BlogManager";
import PageManager from "@/components/dashboard/PageManager";
import ProductManager from "@/components/dashboard/ProductManager";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

const ADMIN_TOKEN_STORAGE_KEY = "admin_token";

const DashboardPage = () => {
  const [storedToken, setStoredToken] = useState<string>("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string>("");

  useEffect(() => {
    try {
      const existing = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) ?? "";
      setStoredToken(existing);
    } catch {
      setStoredToken("");
    }
  }, []);

  const hasToken = useMemo(() => Boolean(storedToken.trim()), [storedToken]);

  async function login() {
    setLoginError("");
    setLoggingIn(true);
    try {
      const username = adminUsername.trim();
      const password = adminPassword;
      if (!username || !password) throw new Error("Admin and password are required");

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
      setLoginError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoggingIn(false);
    }
  }

  function clearToken() {
    setAdminPassword("");
    setLoginError("");
    try {
      window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
    setStoredToken("");
  }

  return (
    <>
      <Navbar />

      <header className="gradient-navy pt-28 pb-10">
        <div className="container-max">
          <div className="max-w-4xl">
            <span className="mb-3 inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1 font-display text-sm font-semibold tracking-wider text-accent">
              Dashboard
            </span>
            <h1 className="mb-3 font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl">
              Content and product management
            </h1>
            <p className="text-sm leading-relaxed text-primary-foreground/75">
              Manage blog posts and product pages backed by Supabase Postgres. Images upload through ImgBB.
            </p>
          </div>
        </div>
      </header>

      <main>
        <section className="section-padding bg-muted">
          <div className="container-max">
            <div className="rounded-lg border border-border bg-card p-4 shadow-industrial md:p-6">
              {!hasToken ? (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-3 md:items-end">
                    <div className="md:col-span-1">
                      <div className="text-sm font-semibold">Admin</div>
                      <div className="text-sm text-muted-foreground">Enter your admin username.</div>
                    </div>
                    <Input
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="Admin"
                      autoComplete="username"
                    />
                    <div className="flex gap-2 md:justify-end">
                      <Button type="button" onClick={login} disabled={loggingIn}>
                        {loggingIn ? "Logging in…" : "Login"}
                      </Button>
                      <Button type="button" variant="outline" onClick={clearToken}>
                        Clear
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3 md:items-end">
                    <div className="md:col-span-1">
                      <div className="text-sm font-semibold">Password</div>
                      <div className="text-sm text-muted-foreground">Enter your admin password.</div>
                    </div>
                    <Input
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Password"
                      type="password"
                      autoComplete="current-password"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void login();
                      }}
                    />
                    <div />
                  </div>

                  {loginError ? (
                    <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                      {loginError}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                      Enter your admin username and password to access blog and product management.
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-4">
                    <div>
                      <div className="text-sm font-semibold">Signed in</div>
                      <div className="text-sm text-muted-foreground">You can now manage blogs and products.</div>
                    </div>
                    <Button type="button" variant="outline" onClick={clearToken}>
                      Logout
                    </Button>
                  </div>

                  <Tabs defaultValue="blogs" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="blogs">Blogs</TabsTrigger>
                      <TabsTrigger value="products">Products</TabsTrigger>
                      <TabsTrigger value="pages">Pages</TabsTrigger>
                    </TabsList>

                    <TabsContent value="blogs" className="mt-6">
                      <BlogManager />
                    </TabsContent>

                    <TabsContent value="products" className="mt-6">
                      <ProductManager />
                    </TabsContent>

                    <TabsContent value="pages" className="mt-6">
                      <PageManager />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default DashboardPage;
