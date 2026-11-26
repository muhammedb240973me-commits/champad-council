"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";
import {
  Camera,
  CameraOff,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  LogOut,
  Sun,
  Moon,
  Users,
  UserCheck,
  Clock,
  RefreshCw,
  QrCode,
  Undo2,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";

interface Councilor {
  id: string;
  name: string;
  mobile: string;
  membershipId: string | null;
  unit: string;
  position: string;
  isCheckedIn: boolean;
  checkedInAt: string | null;
}

interface ScanFeedback {
  type: "success" | "warning" | "error";
  title: string;
  subtitle: string;
  councilor?: Councilor;
}

export default function CheckinPage() {
  // Auth state
  const [authState, setAuthState] = useState<"loading" | "guest" | "authed">(
    "loading"
  );
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Theme & sound
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Data & filters
  const [councilors, setCouncilors] = useState<Councilor[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "CHECKED_IN"
  >("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Camera scanner state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanFeedback, setScanFeedback] = useState<ScanFeedback | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<{ code: string; time: number }>({
    code: "",
    time: 0,
  });
  const isScanningRequestRef = useRef(false);

  // Load theme preference
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

  // Web Audio API instant beep feedback (no external audio files needed)
  const playBeep = useCallback(
    (type: "success" | "warning" | "error") => {
      if (!soundEnabled || typeof window === "undefined") return;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === "success") {
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.setValueAtTime(1174, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          osc.start();
          osc.stop(ctx.currentTime + 0.22);
        } else if (type === "warning") {
          osc.frequency.setValueAtTime(520, ctx.currentTime);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          osc.start();
          osc.stop(ctx.currentTime + 0.28);
        } else {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(220, ctx.currentTime);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        }
      } catch {
        // Ignore audio errors on restricted browsers
      }
    },
    [soundEnabled]
  );

  // Fetch delegate list
  const fetchDelegates = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await fetch("/api/checkin");
      if (res.ok) {
        const data = await res.json();
        setCouncilors(data.councilors || []);
      }
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Check session on load
  useEffect(() => {
    fetch("/api/checkin/login")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setAuthState("authed");
          fetchDelegates();
        } else {
          setAuthState("guest");
        }
      })
      .catch(() => setAuthState("guest"));
  }, [fetchDelegates]);

  // Handle Check-in Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");

    try {
      const res = await fetch("/api/checkin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setAuthState("authed");
        fetchDelegates();
      } else {
        setLoginError(data.error || "Invalid credentials");
      }
    } catch {
      setLoginError("Network error. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  // Stop camera helper
  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // Ignore cleanup errors
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
    setCameraStarting(false);
  }, []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleLogout = async () => {
    await stopCamera();
    await fetch("/api/checkin/logout", { method: "POST" });
    setAuthState("guest");
    setUserId("");
    setPassword("");
    setScanFeedback(null);
  };

  // Instant Auto Check-In when QR code is scanned
  const processScannedQr = useCallback(
    async (decodedText: string) => {
      const now = Date.now();
      // Prevent duplicate rapid-fire scans of the exact same QR within 3.5 seconds
      if (
        decodedText === lastScannedRef.current.code &&
        now - lastScannedRef.current.time < 3500
      ) {
        return;
      }
      if (isScanningRequestRef.current) return;

      lastScannedRef.current = { code: decodedText, time: now };
      isScanningRequestRef.current = true;

      try {
        const res = await fetch("/api/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: decodedText }),
        });

        const data = await res.json();

        if (res.ok && data.status === "checked_in") {
          playBeep("success");
          const c: Councilor = data.councilor;
          setScanFeedback({
            type: "success",
            title: `Checked In: ${c.name}`,
            subtitle: `${c.position} • ${c.unit} Unit (${c.mobile})`,
            councilor: c,
          });
          setCouncilors((prev) =>
            prev.map((item) => (item.id === c.id ? c : item))
          );
        } else if (res.ok && data.status === "already_checked_in") {
          playBeep("warning");
          const c: Councilor = data.councilor;
          const timeStr = c.checkedInAt
            ? new Date(c.checkedInAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "earlier";
          setScanFeedback({
            type: "warning",
            title: `Already Checked In: ${c.name}`,
            subtitle: `${c.position} • ${c.unit} (Verified at ${timeStr})`,
            councilor: c,
          });
        } else {
          playBeep("error");
          setScanFeedback({
            type: "error",
            title: "Invalid QR Pass",
            subtitle:
              data.error || "This QR code does not match any registered delegate.",
          });
        }
      } catch {
        playBeep("error");
        setScanFeedback({
          type: "error",
          title: "Connection Error",
          subtitle: "Could not verify QR pass. Check internet connection.",
        });
      } finally {
        isScanningRequestRef.current = false;
      }
    },
    [playBeep]
  );

  // Keep latest scan callback in ref so camera never restarts
  const scanHandlerRef = useRef(processScannedQr);
  useEffect(() => {
    scanHandlerRef.current = processScannedQr;
  }, [processScannedQr]);

  // Start Camera
  const startCamera = async () => {
    setCameraError("");
    setCameraStarting(true);

    try {
      await stopCamera();
      // Small delay ensures the #qr-reader container is mounted
      await new Promise((r) => setTimeout(r, 100));

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 230, height: 230 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          scanHandlerRef.current(decodedText);
        },
        () => {
          // Ignore frame-by-frame decode misses
        }
      );

      setCameraActive(true);
    } catch (err) {
      console.error("Camera start error:", err);
      setCameraError(
        "Unable to access camera. Please allow camera permission in your browser and ensure you are on HTTPS or localhost."
      );
      setCameraActive(false);
    } finally {
      setCameraStarting(false);
    }
  };

  // Manual row Check-In / Undo
  const handleManualCheckin = async (
    councilor: Councilor,
    action: "checkin" | "undo" = "checkin"
  ) => {
    setProcessingId(councilor.id);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ councilorId: councilor.id, action }),
      });

      const data = await res.json();
      if (res.ok && data.councilor) {
        const updated: Councilor = data.councilor;
        setCouncilors((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );

        if (action === "checkin") {
          playBeep("success");
          setScanFeedback({
            type: "success",
            title: `Checked In: ${updated.name}`,
            subtitle: `${updated.position} • ${updated.unit} Unit`,
            councilor: updated,
          });
        }
      }
    } finally {
      setProcessingId(null);
    }
  };

  // Live counts & filtered list
  const stats = useMemo(() => {
    const total = councilors.length;
    const checkedIn = councilors.filter((c) => c.isCheckedIn).length;
    return { total, checkedIn, pending: total - checkedIn };
  }, [councilors]);

  const filteredCouncilors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return councilors.filter((c) => {
      if (statusFilter === "CHECKED_IN" && !c.isCheckedIn) return false;
      if (statusFilter === "PENDING" && c.isCheckedIn) return false;

      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.unit.toLowerCase().includes(q) ||
        c.position.toLowerCase().includes(q) ||
        (c.membershipId && c.membershipId.toLowerCase().includes(q))
      );
    });
  }, [councilors, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sticky Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="font-cooper text-2xl sm:text-3xl text-emerald-700 dark:text-emerald-400">
                SSF
              </span>
              <span className="text-base sm:text-lg font-bold tracking-tight">
                Champad Sector
              </span>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <QrCode className="h-3.5 w-3.5" />
              Check-in Desk
            </span>
          </div>

          <div className="flex items-center gap-2">
            {authState === "authed" && (
              <>
                <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                  {stats.checkedIn} / {stats.total} Checked In
                </span>

                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? "Mute Scan Beep" : "Enable Scan Beep"}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  {soundEnabled ? (
                    <Volume2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-slate-400" />
                  )}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-slate-700" />
              )}
            </button>

            {authState === "authed" && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Loading State */}
      {authState === "loading" && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      )}

      {/* Check-in Login Gate */}
      {authState === "guest" && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-3">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h1 className="text-xl font-bold">Check-in Volunteer Login</h1>
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
                  Check-in User ID
                </label>
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter check-in user ID"
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
                {loggingIn ? "Verifying..." : "Open Check-in Scanner"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Authenticated Check-in Workspace */}
      {authState === "authed" && (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Quick Mini Stats Bar */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase font-medium text-slate-500">
                  Total
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-0.5">
                  {stats.total}
                </p>
              </div>
              <Users className="h-5 w-5 text-blue-500 hidden sm:block" />
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase font-medium text-slate-500">
                  Checked In
                </p>
                <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {stats.checkedIn}
                </p>
              </div>
              <UserCheck className="h-5 w-5 text-emerald-500 hidden sm:block" />
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase font-medium text-slate-500">
                  Pending
                </p>
                <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {stats.pending}
                </p>
              </div>
              <Clock className="h-5 w-5 text-amber-500 hidden sm:block" />
            </div>
          </div>

          {/* Section 1: QR Code Camera Scanner */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Instant QR Check-in Scanner
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Point camera at a delegate&apos;s QR pass to automatically
                  mark check-in.
                </p>
              </div>

              {/* Camera On / Off Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={cameraActive || cameraStarting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition cursor-pointer"
                >
                  <Camera className="h-4 w-4" />
                  {cameraStarting ? "Starting..." : "Camera On"}
                </button>

                <button
                  type="button"
                  onClick={stopCamera}
                  disabled={!cameraActive && !cameraStarting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 disabled:opacity-40 text-rose-700 dark:text-rose-300 text-sm font-semibold transition cursor-pointer"
                >
                  <CameraOff className="h-4 w-4" />
                  Camera Off
                </button>
              </div>
            </div>

            {/* Camera Error */}
            {cameraError && (
              <div className="mt-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 p-3.5 text-sm text-rose-700 dark:text-rose-300">
                {cameraError}
              </div>
            )}

            {/* Camera Viewfinder Box */}
            <div className="mt-4 flex flex-col items-center">
              <div
                className={`w-full max-w-sm overflow-hidden rounded-2xl border-2 ${
                  cameraActive
                    ? "border-emerald-500 bg-black"
                    : "border-dashed border-slate-300 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/40"
                }`}
              >
                <div
                  id="qr-reader"
                  className={cameraActive ? "w-full min-h-[280px]" : "hidden"}
                />

                {!cameraActive && (
                  <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
                    <div className="h-12 w-12 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
                      <Camera className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Camera is currently off
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Tap <strong>Camera On</strong> above to start scanning
                      delegate tickets
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Live Instant Scan Result Card */}
            {scanFeedback && (
              <div
                className={`mt-4 rounded-2xl border p-4 flex items-start justify-between gap-3 transition-all ${
                  scanFeedback.type === "success"
                    ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-100"
                    : scanFeedback.type === "warning"
                    ? "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/70 text-amber-900 dark:text-amber-100"
                    : "border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/70 text-rose-900 dark:text-rose-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  {scanFeedback.type === "success" && (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {scanFeedback.type === "warning" && (
                    <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  )}
                  {scanFeedback.type === "error" && (
                    <XCircle className="h-6 w-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold text-base">{scanFeedback.title}</p>
                    <p className="text-xs sm:text-sm opacity-90 mt-0.5">
                      {scanFeedback.subtitle}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setScanFeedback(null)}
                  aria-label="Dismiss notification"
                  className="p-1 rounded-lg opacity-60 hover:opacity-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </section>

          {/* Section 2: Search & Filter Bar */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search delegate by Name, Mobile Number, Unit, or Position..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-9 py-2.5 text-sm focus:border-emerald-600 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filter Pills + Refresh */}
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { key: "ALL", label: `All (${stats.total})` },
                    { key: "PENDING", label: `Pending (${stats.pending})` },
                    {
                      key: "CHECKED_IN",
                      label: `Checked In (${stats.checkedIn})`,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      statusFilter === tab.key
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={fetchDelegates}
                  title="Refresh list"
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loadingData ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Section 3: Complete Delegate Table with Check-in Buttons */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-3.5 px-4 w-14">Sl No.</th>
                    <th className="py-3.5 px-4 min-w-[180px]">Delegate Name</th>
                    <th className="py-3.5 px-4 min-w-[130px]">Mobile</th>
                    <th className="py-3.5 px-4 min-w-[140px]">Unit</th>
                    <th className="py-3.5 px-4 min-w-[150px]">Position</th>
                    <th className="py-3.5 px-4 min-w-[130px]">Status</th>
                    <th className="py-3.5 px-4 text-right min-w-[140px]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredCouncilors.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-center text-slate-400 text-sm"
                      >
                        {councilors.length === 0
                          ? "No councilor records found. Upload delegate data from the Admin portal first."
                          : "No delegates match your current search or filter."}
                      </td>
                    </tr>
                  ) : (
                    filteredCouncilors.map((c, index) => (
                      <tr
                        key={c.id}
                        className={`transition ${
                          c.isCheckedIn
                            ? "bg-emerald-50/40 dark:bg-emerald-950/15"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <td className="py-3 px-4 font-semibold text-slate-500">
                          {index + 1}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {c.name}
                          </div>
                          {c.membershipId && (
                            <div className="text-xs text-slate-400">
                              ID: {c.membershipId}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono text-xs sm:text-sm">
                          {c.mobile}
                        </td>

                        <td className="py-3 px-4 font-medium">{c.unit}</td>

                        <td className="py-3 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {c.position}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {c.isCheckedIn ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="h-4 w-4" />
                              {c.checkedInAt
                                ? new Date(c.checkedInAt).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" }
                                  )
                                : "Checked In"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                              <Clock className="h-3.5 w-3.5" />
                              Pending
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {!c.isCheckedIn ? (
                            <button
                              type="button"
                              disabled={processingId === c.id}
                              onClick={() => handleManualCheckin(c, "checkin")}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {processingId === c.id
                                ? "Saving..."
                                : "Check In"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={processingId === c.id}
                              onClick={() => handleManualCheckin(c, "undo")}
                              title="Undo check-in"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                              <Undo2 className="h-3.5 w-3.5" />
                              Undo
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}