"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PosterRing from "@/components/PosterRing";
import {
  Calendar,
  MapPin,
  ArrowDown,
  Smartphone,
  QrCode,
  AlertCircle,
  Loader2,
  Mail,
  Users,
  ChevronRight,
} from "lucide-react";

interface MatchedCouncilor {
  id: string;
  name: string;
  unit: string;
  position: string;
}

export default function HomePage() {
  const router = useRouter();
  const lookupSectionRef = useRef<HTMLElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);

  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [matchedCouncilors, setMatchedCouncilors] = useState<
    MatchedCouncilor[]
  >([]);

  const scrollToLookup = () => {
    lookupSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => {
      mobileInputRef.current?.focus();
    }, 450);
  };

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMatchedCouncilors([]);

    const cleanMobile = mobile.replace(/\D/g, "");
    if (cleanMobile.length !== 10) {
      setError("Please enter a valid 10-digit registered mobile number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/pass?mobile=${encodeURIComponent(cleanMobile)}`
      );
      const data = await res.json();

      if (res.ok && Array.isArray(data.councilors)) {
        if (data.councilors.length === 1) {
          router.push(`/pass/${data.councilors[0].id}`);
        } else {
          setMatchedCouncilors(data.councilors);
        }
      } else {
        setError(
          data.error ||
            "Mobile number not found. Please check the number and try again."
        );
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060608] text-white selection:bg-[#e57347] selection:text-black overflow-x-hidden">
      {/* FIRST COMPLETE VIEW (100dvh on Mobile & Desktop) */}
      <section className="relative min-h-[100dvh] flex flex-col justify-between px-5 sm:px-8 py-5 max-w-6xl mx-auto">
        {/* Top Corner Tiny Centenary Logo & Jeevithamaavuka Typo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 opacity-90">
            <img
              src="/samastha-logo.png"
              alt="Samastha Centenary"
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-md object-cover shadow-sm"
            />
            <img
              src="/jeevithamavuka.png"
              alt="Jeevithamaavuka"
              className="h-6 sm:h-7 w-auto object-contain invert brightness-95"
            />
          </div>
        </div>

        {/* Center Program Identity & Rolling Round Element */}
        <div className="my-auto py-4 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-6 sm:gap-10">
          {/* Continuously Rolling Round Element from Poster */}
          <div className="flex items-center justify-center shrink-0">
            <PosterRing className="w-40 h-40 sm:w-56 sm:h-56 lg:w-72 lg:h-72" />
          </div>

          {/* Exact Program Details */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <span className="font-cooper text-3xl sm:text-4xl lg:text-5xl bg-gradient-to-r from-[#e26d42] via-[#ea9663] to-[#f4ca92] bg-clip-text text-transparent leading-none">
              SSF
            </span>

            <p className="text-lg sm:text-xl lg:text-2xl font-bold tracking-wide text-white/95 mt-1.5">
              Champad Sector
            </p>

            <h1 className="mt-2 flex flex-col leading-[0.95]">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-white/90">
                Students&apos;
              </span>
              <span className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-wider bg-gradient-to-r from-[#e57347] via-[#f0ad78] to-[#f7d7a8] bg-clip-text text-transparent mt-0.5">
                COUNCIL
              </span>
            </h1>

            {/* Date & Venue */}
            <div className="mt-5 space-y-1.5 text-sm sm:text-base text-white/85">
              <div className="flex items-center justify-center lg:justify-start gap-2 font-medium">
                <Calendar className="h-4 w-4 text-[#ea9663] shrink-0" />
                <span>27 November 2026, Friday</span>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-2 font-semibold text-[#f4ca92]">
                <MapPin className="h-4 w-4 text-[#e26d42] shrink-0" />
                <span>Erool</span>
              </div>
            </div>

            {/* Get Digital Pass CTA Button */}
            <div className="mt-6 sm:mt-8 w-full sm:w-auto">
              <button
                type="button"
                onClick={scrollToLookup}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#e26d42] via-[#ea9663] to-[#f3c48b] hover:brightness-105 active:scale-[0.99] text-[#09090b] font-extrabold text-sm sm:text-base px-7 py-3.5 shadow-[0_0_30px_rgba(229,115,71,0.3)] transition cursor-pointer"
              >
                <QrCode className="h-5 w-5" />
                <span>Get Digital Pass</span>
                <ArrowDown className="h-4 w-4 animate-bounce" />
              </button>
            </div>
          </div>
        </div>

        {/* Subtle Bottom Scroll Cue */}
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={scrollToLookup}
            aria-label="Scroll to enter mobile number"
            className="text-[11px] uppercase tracking-[0.2em] text-white/40 hover:text-white/75 transition cursor-pointer"
          >
            Scroll for Delegate Check-in Pass
          </button>
        </div>
      </section>

      {/* SECOND SECTION: MOBILE NUMBER LOOKUP */}
      <section
        id="pass-lookup"
        ref={lookupSectionRef}
        className="relative px-5 sm:px-8 py-16 sm:py-24 border-t border-white/10 bg-gradient-to-b from-[#060608] via-[#0d0c10] to-[#060608]"
      >
        <div className="max-w-md mx-auto">
          <div className="rounded-3xl border border-white/15 bg-white/[0.04] backdrop-blur-md p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-[#e26d42]/20 to-[#f4ca92]/20 border border-[#ea9663]/30 text-[#f4ca92] mx-auto mb-4">
              <Smartphone className="h-6 w-6" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-center text-white">
              Delegate Digital Pass
            </h2>
            <p className="text-xs sm:text-sm text-white/60 text-center mt-1.5">
              Enter your registered 10-digit mobile number to open your unique
              QR entry pass.
            </p>

            <form onSubmit={handleLookupSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="delegate-mobile"
                  className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2"
                >
                  Registered Mobile Number
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm font-semibold text-white/45 select-none">
                    +91
                  </span>
                  <input
                    id="delegate-mobile"
                    ref={mobileInputRef}
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
                      if (error) setError("");
                      if (matchedCouncilors.length > 0)
                        setMatchedCouncilors([]);
                    }}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full rounded-xl border border-white/15 bg-black/50 pl-12 pr-4 py-3.5 text-base font-medium tracking-wider text-white placeholder:text-white/30 placeholder:tracking-normal focus:border-[#ea9663] focus:outline-none transition"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs sm:text-sm text-rose-200">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {matchedCouncilors.length === 0 && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e26d42] via-[#ea9663] to-[#f3c48b] hover:brightness-105 disabled:opacity-60 text-[#09090b] font-bold py-3.5 text-sm sm:text-base shadow-lg transition cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Fetching Your Pass...</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="h-5 w-5" />
                      <span>View My Digital Pass</span>
                    </>
                  )}
                </button>
              )}
            </form>

            {/* One-Tap Selector when Multiple Delegates Share the Same Number */}
            {matchedCouncilors.length > 1 && (
              <div className="mt-5 pt-5 border-t border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#f4ca92]">
                  <Users className="h-4 w-4 text-[#ea9663] shrink-0" />
                  <span>
                    {matchedCouncilors.length} Delegates Registered — Tap Your
                    Name
                  </span>
                </div>

                <div className="space-y-2.5">
                  {matchedCouncilors.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => router.push(`/pass/${person.id}`)}
                      className="w-full group flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/[0.05] hover:border-[#ea9663] hover:bg-[#ea9663]/10 p-3.5 text-left transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="h-4 w-4 rounded-full border-2 border-white/40 group-hover:border-[#ea9663] group-hover:bg-[#ea9663] shrink-0 transition" />
                        <div className="truncate">
                          <p className="text-sm sm:text-base font-bold text-white truncate">
                            {person.name}
                          </p>
                          <p className="text-xs text-white/65 truncate mt-0.5">
                            {person.unit} •{" "}
                            <span className="text-[#f4ca92]">
                              {person.position}
                            </span>
                          </p>
                        </div>
                      </div>

                      <ChevronRight className="h-4 w-4 text-white/40 group-hover:text-[#f4ca92] shrink-0 transition" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Clean Public Footer (No Admin Links) */}
      <footer className="border-t border-white/10 py-6 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/55">
          <div className="flex items-baseline gap-2">
            <span className="font-cooper text-base text-white">SSF</span>
            <span className="font-bold tracking-wider text-white">
              CHAMPAD SECTOR
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <a
              href="mailto:ssfchampadsector@gmail.com"
              className="inline-flex items-center gap-1.5 hover:text-white transition"
            >
              <Mail className="h-3.5 w-3.5 text-[#ea9663]" />
              <span>ssfchampadsector@gmail.com</span>
            </a>

            <a
              href="https://instagram.com/ssfchampadsector"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-white transition"
            >
              <svg
                className="h-3.5 w-3.5 text-[#e26d42]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
              <span>@ssfchampadsector</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}