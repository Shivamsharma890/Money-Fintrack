import { Link, useLocation } from "react-router-dom";
import MFLogo from "../assets/MFLogo.png";

export default function PublicAuthActions({ user }) {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#102a21] pt-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.18)]">
      <nav
        aria-label="Public navigation"
        className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-3 py-3 sm:px-5 lg:px-8"
      >
        <Link
          to="/"
          aria-label="Money Fintrack home"
          className="group flex shrink-0 items-center gap-2.5"
        >
          <img
            src={MFLogo}
            alt="Money Fintrack Logo"
            className="h-11 w-11 shrink-0 object-contain transition duration-300 group-hover:scale-105"
          />

          <span className="leading-tight">
            <span className="block whitespace-nowrap text-base font-extrabold tracking-tight text-white sm:text-lg">
              Money <span className="text-emerald-300">Fintrack</span>
            </span>

            <span className="mt-0.5 hidden text-[10px] font-medium tracking-wide text-slate-300 sm:block">
              Your money, in focus
            </span>
          </span>
        </Link>
        <div className="hidden md:flex md:flex-1 md:justify-center md:px-3">
          <div className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2">
            <p className="text-xs font-medium text-slate-200 lg:text-sm">
              {pathname === "/learn"
                ? "Small habits. Stronger finances."
                : "A simpler way to manage your money."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {user ? (
            <Link
              to="/dashboard"
              className="rounded-xl bg-emerald-400 px-3.5 py-2.5 text-xs font-bold text-[#102a21] transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-[#102a21] sm:px-5 sm:text-sm"
            >
              Dashboard <span className="ml-1">→</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl border border-white/15 px-3 py-2.5 text-xs font-semibold text-white transition hover:border-emerald-300/50 hover:bg-white/[0.07] hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 sm:px-4 sm:text-sm"
              >
                Log in
              </Link>

              <Link
                to="/account"
                className="rounded-xl bg-emerald-400 px-3 py-2.5 text-xs font-bold text-[#102a21] shadow-sm transition hover:bg-emerald-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-[#102a21] sm:px-5 sm:text-sm"
              >
                <span className="sm:hidden">Sign up</span>
                <span className="hidden sm:inline">Create account</span>
                <span className="ml-1.5" aria-hidden="true">
                  ↗
                </span>
              </Link>
            </>
          )}
        </div>
      </nav>
      <div className="h-0.5 bg-gradient-to-r from-emerald-900 via-emerald-400 to-teal-300" />
    </header>
  );
}
