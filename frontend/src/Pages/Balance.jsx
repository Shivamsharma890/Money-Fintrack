import { useEffect, useState } from "react";
import api, { getApiError } from "../lib/api";

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function Balance() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadBalance = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await api.get("/balance");
      setBalance(Number(response.data.balance || 0));
    } catch (error) {
      setMessage(getApiError(error, "Your balance could not be loaded."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
  }, []);

  return (
    <main className="min-h-[calc(100vh-72px)] bg-slate-50 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
            Your finances
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Wallet balance
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Check your available balance and refresh it whenever you need an
            update.
          </p>
        </div>

        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-6 text-white shadow-xl sm:p-10">
          <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-semibold text-blue-100">
                Available balance
              </p>
              <p className="mt-4 break-words text-4xl font-extrabold tracking-tight sm:text-5xl">
                {loading && balance === null
                  ? "Loading…"
                  : formatMoney(balance)}
              </p>
              <p className="mt-4 text-sm text-blue-100">
                Your wallet balance from Money Fintrack
              </p>
            </div>
            <div className="w-fit rounded-2xl border border-white/20 bg-white/10 px-5 py-4">
              <span className="text-3xl font-black" aria-hidden="true">
                ₹
              </span>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-blue-100">
                Wallet
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 border-t border-white/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-blue-100">
              {loading
                ? "Checking your latest balance…"
                : "Balance details are up to date when this page refreshes."}
            </p>
            <button
              type="button"
              onClick={loadBalance}
              disabled={loading}
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-900 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Refreshing…" : "Refresh balance"}
            </button>
          </div>
        </section>

        {message && (
          <div
            role="alert"
            className="mt-5 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{message}</p>
            <button
              type="button"
              onClick={loadBalance}
              className="font-bold underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
