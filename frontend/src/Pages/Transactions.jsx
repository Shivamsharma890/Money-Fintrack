import { useEffect, useState } from "react";
import api, { getApiError } from "../lib/api";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const dateLabel = (value) => {
  if (!value) return "—";

  const normalizedValue =
    typeof value === "string" &&
    !value.endsWith("Z") &&
    !/[+-]\d{2}:\d{2}$/.test(value)
      ? `${value}Z`
      : value;

  const d = new Date(normalizedValue);

  return !Number.isNaN(d.getTime())
    ? d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "—";
};

export default function Transactions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await api.get("/transactions");
      setItems(Array.isArray(r.data.transactions) ? r.data.transactions : []);
    } catch (e) {
      setError(getApiError(e, "Unable to load transaction history."));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const visible =
    filter === "all"
      ? items
      : items.filter((t) => String(t.type || "").toLowerCase() === filter);
  return (
    <div className="min-h-[calc(100vh-70px)] bg-slate-50 px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
              Activity
            </p>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-900">
              Transaction history
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Review your wallet deposits and withdrawals.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-60"
          >
            {loading ? "Refreshing…" : "↻ Refresh history"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ["all", "All activity"],
            ["deposit", "Deposits"],
            ["withdraw", "Withdrawals"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filter === value ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            {error}{" "}
            <button onClick={load} className="font-bold underline">
              Try again
            </button>
          </div>
        )}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="font-bold text-slate-900">
              {visible.length} {visible.length === 1 ? "record" : "records"}
            </p>
          </div>
          {loading ? (
            <p className="p-8 text-sm text-slate-500">Loading transactions…</p>
          ) : visible.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                ↻
              </div>
              <h2 className="mt-4 font-bold text-slate-800">
                No matching transactions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Try another filter or complete a wallet transaction first.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Description</th>
                    <th className="px-5 py-4">Date & time</th>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4 text-right">Amount</th>
                    <th className="px-5 py-4 text-right">Balance after</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((tx, i) => (
                    <tr
                      key={tx.id || tx._id || `${tx.type}-${i}`}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {tx.description || "Wallet transaction"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                        {dateLabel(tx.created_at)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${tx.type === "deposit" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                        >
                          {tx.type || "unknown"}
                        </span>
                      </td>
                      <td
                        className={`whitespace-nowrap px-5 py-4 text-right font-bold ${tx.type === "deposit" ? "text-emerald-600" : "text-slate-800"}`}
                      >
                        {tx.type === "deposit" ? "+" : "−"}
                        {money(
                          Number(tx.amount_paise ?? tx.amount ?? 0) /
                            (tx.amount_paise !== undefined ? 100 : 1),
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-slate-700">
                        {tx.balance_after !== undefined
                          ? money(Number(tx.balance_after))
                          : tx.balance_after_paise !== undefined
                            ? money(Number(tx.balance_after_paise) / 100)
                            : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
