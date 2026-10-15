import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api, { getApiError, saveSession } from "../lib/api";
import MFLogo from "../assets/MFLogo.png";

export default function Login() {
  const [userID, setUserID] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (busy) return;

    const trimmedUserID = userID.trim();

    if (!trimmedUserID || !password) {
      setMessage("Please enter your User ID and password.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const res = await api.post("/login", {
        userid: trimmedUserID,
        password,
      });

      saveSession(res.data);
      window.dispatchEvent(new Event("mf:session-updated"));

      navigate(location.state?.from?.pathname || "/dashboard", {
        replace: true,
      });
    } catch (err) {
      setMessage(
        getApiError(
          err,
          "We couldn't sign you in. Check your details and try again.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-65px)] overflow-hidden bg-[#f6f8f5] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-lime-100/60 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_30px_100px_-35px_rgba(16,40,29,0.22)] lg:min-h-[650px] lg:grid-cols-[1fr_0.92fr]">
        {/* Left brand panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#102a21] p-10 text-white lg:flex xl:p-14">
          <div className="pointer-events-none absolute -right-24 -top-20 h-80 w-80 rounded-full border border-emerald-200/15" />
          <div className="pointer-events-none absolute -right-8 top-12 h-56 w-56 rounded-full border border-emerald-200/10" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative">
            {/* Logo row */}
            <div className="flex flex-col items-start gap-5">
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
              <div className="flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                Your financial space
              </div>
            </div>

            <h1 className="mt-7 max-w-md text-4xl font-black leading-[1.13] tracking-tight xl:text-5xl">
              A better way to stay
              <span className="block text-emerald-300">in control.</span>
            </h1>

            <p className="mt-6 max-w-md text-sm leading-7 text-slate-300 xl:text-base">
              Sign in to bring your wallet, payments and transaction activity
              together in one clear, organized place.
            </p>
          </div>

          <div className="relative mt-12 rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
              Designed for clarity
            </p>

            <div className="mt-5 flex items-end gap-2">
              {[32, 48, 38, 62, 50, 72, 60, 86, 68, 94, 78, 100].map(
                (height, index) => (
                  <span
                    key={index}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-emerald-500/40 to-emerald-200"
                    style={{ height: `${height}px` }}
                  />
                ),
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-300">
              <span>Track your activity</span>
              <span className="font-semibold text-emerald-300">
                Stay organized
              </span>
            </div>
          </div>

          <p className="relative mt-8 text-xs text-slate-400">
            Money Fintrack · Your money, in focus.
          </p>
        </section>
        <section className="flex items-center justify-center px-5 py-9 sm:px-10 sm:py-12 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Link to="/" className="inline-flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#102a21] text-lg font-black text-emerald-300">
                  M
                </span>

                <span className="text-lg font-extrabold text-slate-950">
                  Money <span className="text-emerald-700">Fintrack</span>
                </span>
              </Link>
            </div>

            <div className="mb-7">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-800">
                Welcome back
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-[#13241c] sm:text-4xl">
                Sign in to your account
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Enter your details to access your personal financial dashboard.
              </p>
            </div>

            {message && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700"
              >
                {message}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="userid"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  User ID
                </label>

                <input
                  id="userid"
                  name="userid"
                  type="text"
                  autoComplete="username"
                  value={userID}
                  onChange={(e) => setUserID(e.target.value)}
                  required
                  disabled={busy}
                  placeholder="Enter your user ID"
                  className="w-full rounded-xl border border-slate-200 bg-[#fafbf9] px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="text-sm font-bold text-slate-700"
                  >
                    Password
                  </label>

                  <Link
                    to="/forget"
                    className="text-xs font-bold text-emerald-800 transition hover:text-emerald-950"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={busy}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-[#fafbf9] px-4 py-3.5 pr-16 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={busy}
                    className="absolute inset-y-0 right-0 px-4 text-xs font-extrabold text-emerald-800 hover:text-emerald-950 disabled:opacity-60"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#153b2b] px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-950/10 transition duration-200 hover:-translate-y-0.5 hover:bg-[#20543c] focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-wait disabled:opacity-60"
              >
                {busy ? "Signing you in..." : "Sign in securely"}
                {!busy && <span aria-hidden="true">↗</span>}
              </button>
            </form>

            <div className="my-7 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Secure access
              </span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <p className="text-center text-sm text-slate-600">
              New to Money Fintrack?{" "}
              <Link
                to="/account"
                className="font-extrabold text-emerald-800 transition hover:text-emerald-950"
              >
                Create an account
              </Link>
            </p>

            <p className="mt-7 text-center text-xs leading-5 text-slate-400">
              Money Fintrack · Your money, in focus.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
