"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  UserPlus,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
  QrCode,
} from "lucide-react";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [authState, setAuthState] = useState<"loading" | "guest" | "authed">(
    "loading"
  );
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("ssf-theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("ssf-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("ssf-theme", "light");
    }
  };

  // Check existing admin cookie
  useEffect(() => {
    fetch("/api/admin/login")
      .then((res) => res.json())
      .then((data) => {
        setAuthState(data.authenticated ? "authed" : "guest");
      })
      .catch(() => setAuthState("guest"));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setAuthState("authed");
      } else {
        setLoginError(data.error || "Invalid credentials");
      }
    } catch {
      setLoginError("Network error. Try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthState("guest");
    setUserId("");
    setPassword("");
  };

  const navItems = [
    {
      label: "Analytics & Stats",
      href: "/admin",
      icon: BarChart3,
    },
    {
      label: "Delegate Data",
      href: "/admin/delegates",
      icon: UserPlus,
    },
    {
      label: "Delegate Pass Portal",
      href: "/",
      icon: QrCode,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sticky Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            {authState === "authed" && (
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle Menu"
                className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {sidebarOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            )}

            {/* Brand Title with SSF in Cooper Black */}
            <Link href="/admin" className="flex items-baseline gap-2">
              <span className="font-cooper text-2xl sm:text-3xl text-emerald-700 dark:text-emerald-400 tracking-wide">
                SSF
              </span>
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">
                Champad Sector
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden md:inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Students&apos; Council
            </span>

            {/* Dark / Light Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-slate-700" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Loading State */}
      {authState === "loading" && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      )}

      {/* Login Screen if Not Authenticated */}
      {authState === "guest" && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-3">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h1 className="text-xl font-bold">Admin Portal Login</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                <span className="font-cooper text-emerald-700 dark:text-emerald-400">
                  SSF
                </span>{" "}
                Champad Sector Students&apos; Council
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  User ID
                </label>
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter admin user ID"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {loginError && (
                <p className="text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-2">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-2.5 text-sm shadow-sm transition cursor-pointer"
              >
                {loggingIn ? "Signing In..." : "Sign In to Dashboard"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Authenticated Workspace (Sidebar + Main Content) */}
      {authState === "authed" && (
        <div className="flex-1 flex relative">
          {/* Mobile Overlay Backdrop */}
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            />
          )}

          {/* Sidebar (Drawer on Mobile, Fixed Column on Desktop) */}
          <aside
            className={`fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between p-4 transition-transform duration-200 ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }`}
          >
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                      active
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </aside>

          {/* Main Page Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      )}
    </div>
  );
}