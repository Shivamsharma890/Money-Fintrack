import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { clearSession, getApiError } from "../lib/api";

export default function Delete() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("input");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const removeAccount = async () => {
    setBusy(true);
    setMessage("");
    try {
      const response = await api.delete("/account", { data: { password } });
      setMessage(response.data.message || "Your account has been deactivated.");
      clearSession();
      window.dispatchEvent(new Event("mf:session-updated"));
      setStatus("deleted");
    } catch (error) {
      setMessage(getApiError(error, "Could not close your account."));
    } finally {
      setBusy(false);
    }
  };

  if (status === "deleted") {
    return (
      <main className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-slate-50 px-4 py-10">
        <section className="w-full max-w-xl rounded-3xl border border-emerald-200 bg-white p-7 text-center shadow-sm sm:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl font-black text-emerald-700">
            ✓
          </span>
          <h1 className="mt-5 text-2xl font-extrabold text-slate-950">
            Account closed
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-7 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
          >
            Return to home
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-72px)] bg-slate-50 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-rose-700">
            Account settings
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Close account
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            Review the requirements before confirming account closure.
          </p>
        </div>

        <section className="rounded-3xl border border-rose-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-bold text-amber-900">Before you continue</p>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              Your wallet balance must be ₹0.00. Account closure may not be
              reversible. Confirm your password to continue.
            </p>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              setMessage("");
              setStatus("confirm");
            }}
            className="mt-6 space-y-4"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Confirm your password
              </span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                placeholder="Enter your current password"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-xl border border-rose-200 bg-rose-50 px-5 py-3.5 text-sm font-bold text-rose-800 transition hover:bg-rose-100 sm:w-auto"
            >
              Continue to confirmation
            </button>
          </form>

          {message && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-800"
            >
              {message}
            </p>
          )}

          {status === "confirm" && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <h2 className="font-bold text-rose-900">Are you sure?</h2>
              <p className="mt-2 text-sm leading-6 text-rose-800">
                This will send a request to close your account. Please confirm
                only if you intend to continue.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={busy}
                  onClick={removeAccount}
                  className="rounded-xl bg-rose-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-800 disabled:opacity-60"
                >
                  {busy ? "Closing account…" : "Confirm account closure"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setStatus("input")}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
