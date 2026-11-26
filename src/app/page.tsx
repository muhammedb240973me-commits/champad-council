import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ShieldCheck,
  Mail,
  QrCode,
} from "lucide-react";

export default function TemporaryHomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#07070a] text-white selection:bg-pink-500 selection:text-white relative overflow-x-hidden">
      {/* Ambient Poster-Inspired Gradient Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-32 -left-32 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-purple-600/20 via-pink-500/15 to-amber-200/15 blur-3xl"
      />

      {/* Sticky Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#07070a]/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-cooper text-2xl sm:text-3xl bg-gradient-to-r from-purple-400 via-pink-400 to-amber-200 bg-clip-text text-transparent">
              SSF
            </span>
            <span className="text-base sm:text-lg font-bold tracking-tight text-white">
              Champad Sector
            </span>
          </Link>

          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white transition"
          >
            <ShieldCheck className="h-4 w-4 text-pink-400" />
            <span>Admin Login</span>
          </Link>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16 relative z-10">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left / Main Event Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Coming Soon Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-1.5 text-xs sm:text-sm font-medium text-pink-200">
              <Sparkles className="h-4 w-4 text-pink-400" />
              <span>Delegate Pass Portal — Coming Soon</span>
            </div>

            {/* Event Titles */}
            <div className="space-y-2">
              <p className="text-sm sm:text-base font-semibold uppercase tracking-[0.2em] text-purple-300">
                SSF Champad Sector
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-white via-pink-200 to-amber-200 bg-clip-text text-transparent">
                  Students&apos; Council
                </span>
              </h1>
              <p className="text-lg sm:text-xl font-medium text-white/80 pt-1">
                സെക്ടർ സ്റ്റുഡൻസ് കൗൺസിൽ
              </p>
            </div>

            {/* Speaker Highlight Card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wider text-pink-300 font-semibold">
                Keynote Address • സംസാരം
              </p>
              <p className="text-lg sm:text-xl font-bold text-white mt-1">
                Sayyid Muneer Ahdal Thangal
              </p>
              <p className="text-sm text-white/70">
                സയ്യിദ് മുനീർ അഹദൽ തങ്ങൾ — President, SSF Kerala
              </p>
            </div>

            {/* Date, Time & Venue Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center justify-center lg:justify-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <Calendar className="h-5 w-5 text-purple-400 shrink-0" />
                <div className="text-left">
                  <p className="text-[11px] uppercase text-white/50">Date</p>
                  <p className="text-sm font-semibold">27 Nov 2026</p>
                </div>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <Clock className="h-5 w-5 text-pink-400 shrink-0" />
                <div className="text-left">
                  <p className="text-[11px] uppercase text-white/50">Time</p>
                  <p className="text-sm font-semibold">05:00 PM</p>
                </div>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <MapPin className="h-5 w-5 text-amber-300 shrink-0" />
                <div className="text-left">
                  <p className="text-[11px] uppercase text-white/50">Venue</p>
                  <p className="text-sm font-semibold">Erul (ഏരുൽ)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Geometric Poster Art & Delegate Status Box */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 sm:p-8 shadow-2xl overflow-hidden">
              {/* Decorative Poster-Style Gradient Blocks */}
              <div className="flex items-end gap-2 mb-6" aria-hidden="true">
                <div className="h-10 w-14 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-400 opacity-90" />
                <div className="h-14 w-12 rounded-lg bg-gradient-to-tr from-pink-500 to-amber-200 opacity-90" />
                <div className="h-8 w-16 rounded-lg bg-gradient-to-r from-amber-200 to-purple-500 opacity-85" />
                <div className="h-12 w-10 rounded-lg bg-gradient-to-b from-pink-300 to-amber-100 opacity-85" />
              </div>

              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-pink-400/30 flex items-center justify-center mb-4">
                <QrCode className="h-6 w-6 text-pink-300" />
              </div>

              <h2 className="text-xl font-bold text-white">
                Digital Check-in Pass
              </h2>
              <p className="text-sm text-white/70 mt-2 leading-relaxed">
                Councilors will soon be able to download their unique QR event
                pass here using their registered mobile number.
              </p>

              <div className="mt-6 pt-5 border-t border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Portal Status</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-amber-300">
                    <span className="h-2 w-2 rounded-full bg-amber-300 animate-pulse" />
                    Launching Soon
                  </span>
                </div>

                <Link
                  href="/admin"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:opacity-95 px-4 py-3 text-sm font-semibold text-white shadow-lg transition"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Organizer &amp; Admin Portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer matching Poster Contact Info */}
      <footer className="border-t border-white/10 py-6 px-4 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-white/60">
          <div className="flex items-baseline gap-2">
            <span className="font-cooper text-lg text-white">SSF</span>
            <span className="font-bold text-white tracking-wide">
              CHAMPAD SECTOR
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <a
              href="mailto:ssfchampadsector@gmail.com"
              className="inline-flex items-center gap-1.5 hover:text-white transition"
            >
              <Mail className="h-4 w-4 text-pink-400" />
              <span>ssfchampadsector@gmail.com</span>
            </a>

            <a
              href="https://instagram.com/ssfchampadsector"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-white transition"
            >
              <svg
                className="h-4 w-4 text-purple-400"
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