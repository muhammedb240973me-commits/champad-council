"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import PosterRing from "@/components/PosterRing";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  ShieldAlert,
} from "lucide-react";

interface CouncilorPass {
  id: string;
  name: string;
  mobile: string;
  membershipId: string | null;
  unit: string;
  position: string;
  isCheckedIn: boolean;
  checkedInAt: string | null;
}

export default function DigitalPassPage() {
  const params = useParams<{ id: string }>();
  const ticketRef = useRef<HTMLDivElement | null>(null);

  const [pass, setPass] = useState<CouncilorPass | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params?.id) return;

    fetch(`/api/pass?id=${encodeURIComponent(params.id)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.councilor) {
          setPass(data.councilor);
        } else {
          setError(data.error || "Digital pass not found.");
        }
      })
      .catch(() => setError("Failed to load digital pass."))
      .finally(() => setLoading(false));
  }, [params?.id]);

  const handleDownloadTicket = async () => {
    if (!ticketRef.current || !pass) return;

    setDownloading(true);
    try {
      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#060608",
      });

      const safeName = pass.name.trim().replace(/[^a-zA-Z0-9]+/g, "_");
      const link = document.createElement("a");
      link.download = `SSF_Pass_${safeName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Ticket image download failed:", err);
      alert("Unable to generate ticket image. Please take a screenshot or try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#060608] text-white flex flex-col justify-between px-4 sm:px-6 py-5 selection:bg-[#e57347] selection:text-black">
      {/* Top Bar: Back Link & Tiny Corner Logos */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white/70 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Link>

        <div className="flex items-center gap-2 opacity-85">
          <img
            src="/samastha-logo.png"
            alt="Samastha Centenary"
            className="h-6 w-6 rounded object-cover"
          />
          <img
            src="/jeevithamavuka.png"
            alt="Jeevithamaavuka"
            className="h-5 w-auto object-contain invert brightness-95"
          />
        </div>
      </header>

      {/* Main Pass Content */}
      <main className="my-auto py-6 max-w-md w-full mx-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#ea9663] border-t-transparent" />
            <p className="text-xs uppercase tracking-widest text-white/50">
              Loading Pass...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 text-center space-y-4">
            <ShieldAlert className="h-10 w-10 text-rose-400 mx-auto" />
            <h1 className="text-lg font-bold">Pass Not Found</h1>
            <p className="text-sm text-white/70">{error}</p>
            <Link
              href="/#pass-lookup"
              className="inline-block rounded-xl bg-gradient-to-r from-[#e26d42] to-[#f3c48b] text-black font-bold text-sm px-5 py-2.5"
            >
              Try Another Mobile Number
            </Link>
          </div>
        )}

        {!loading && pass && (
          <div className="space-y-4">
            {/* Exportable Single Ticket Card */}
            <div
              ref={ticketRef}
              className="relative rounded-3xl border border-white/15 bg-gradient-to-b from-[#131218] to-[#0a0a0e] shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden"
            >
              {/* Ticket Header */}
              <div className="relative px-6 pt-6 pb-5 border-b border-dashed border-white/15 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-cooper text-2xl text-[#ea9663]">
                      SSF
                    </span>
                    <span className="text-sm font-bold text-white/90">
                      Champad Sector
                    </span>
                  </div>
                  <p className="text-lg font-black tracking-wider text-white mt-0.5">
                    STUDENTS&apos; COUNCIL
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/60 mt-1.5">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-[#ea9663]" />
                      27 Nov 2026, Friday
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#f4ca92] font-semibold">
                      <MapPin className="h-3 w-3 text-[#e26d42]" />
                      Erool
                    </span>
                  </div>
                </div>

                <PosterRing className="w-16 h-16 shrink-0" />
              </div>

              {/* Ticket Side Cutout Notches */}
              <div
                aria-hidden="true"
                className="relative flex items-center justify-between -mt-3 pointer-events-none"
              >
                <div className="h-6 w-6 -ml-3 rounded-full bg-[#060608] border-r border-white/15" />
                <div className="h-6 w-6 -mr-3 rounded-full bg-[#060608] border-l border-white/15" />
              </div>

              {/* QR Code & Delegate Info Section */}
              <div className="px-6 pt-2 pb-6 flex flex-col items-center text-center">
                <div className="p-4 rounded-2xl bg-white shadow-lg">
                  <QRCodeSVG
                    value={pass.id}
                    size={190}
                    level="H"
                    bgColor="#ffffff"
                    fgColor="#09090b"
                  />
                </div>

                <p className="text-[11px] uppercase tracking-[0.2em] text-white/45 mt-3">
                  Present this QR at the Check-in Desk
                </p>

                {/* Status Pill */}
                <div className="mt-3">
                  {pass.isCheckedIn ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1 text-xs font-semibold text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Checked In
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ea9663]/15 border border-[#ea9663]/30 px-3.5 py-1 text-xs font-semibold text-[#f4ca92]">
                      <Clock className="h-3.5 w-3.5" />
                      Delegate Entry Pass
                    </span>
                  )}
                </div>

                {/* Delegate Details Box */}
                <div className="w-full mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left space-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/45">
                      Delegate Name
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-white leading-snug">
                      {pass.name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/45">
                        Unit
                      </p>
                      <p className="text-sm font-semibold text-white/95 mt-0.5">
                        {pass.unit}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/45">
                        Position
                      </p>
                      <p className="text-sm font-semibold text-[#f4ca92] mt-0.5">
                        {pass.position}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/45">
                        Mobile
                      </p>
                      <p className="text-xs font-mono text-white/80 mt-0.5">
                        {pass.mobile}
                      </p>
                    </div>

                    {pass.membershipId && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-white/45">
                          Pass ID
                        </p>
                        <p className="text-xs font-mono text-white/80 mt-0.5">
                          {pass.membershipId}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Download Ticket Image Button (Outside Ticket Card) */}
            <button
              type="button"
              onClick={handleDownloadTicket}
              disabled={downloading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#e26d42] via-[#ea9663] to-[#f3c48b] hover:brightness-105 disabled:opacity-60 text-[#09090b] font-bold py-3.5 text-sm shadow-lg transition cursor-pointer"
            >
              {downloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating Ticket Image...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download Ticket</span>
                </>
              )}
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center text-[11px] text-white/40">
        <span className="font-cooper text-white/70">SSF</span> Champad Sector
        Students&apos; Council
      </footer>
    </div>
  );
}