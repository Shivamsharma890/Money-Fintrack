import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getApiError, getSavedUser } from "../lib/api";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateLabel = (value) => {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
};

export default function Dashboard() {
  const [user, setUser] = useState(getSavedUser());
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [meRes, balanceRes, txRes] = await Promise.all([
        api.get("/me"),
        api.get("/balance"),
        api.get("/transactions"),
      ]);
      const currentUser = meRes.data.user || getSavedUser();
      setUser(currentUser);
      localStorage.setItem("mf_user", JSON.stringify(currentUser));
      setBalance(Number(balanceRes.data.balance || 0));
      setTransactions(
        Array.isArray(txRes.data.transactions)
          ? txRes.data.transactions.slice(0, 5)
          : [],
      );
    } catch (e) {
      setError(getApiError(e, "Dashboard data could not be loaded."));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const quick = [
    {
      to: "/transfer",
      title: "Fund transfer",
      desc: "Add funds or withdraw money",
      icon: "↔",
      tone: "bg-blue-50 text-blue-700",
    },
    {
      to: "/transactions",
      title: "Transaction history",
      desc: "Review recent activity",
      icon: "↻",
      tone: "bg-violet-50 text-violet-700",
    },
    {
      to: "/edit",
      title: "Personal details",
      desc: "Update your profile",
      icon: "◎",
      tone: "bg-emerald-50 text-emerald-700",
    },
  ];
  return (
    <div className="min-h-[calc(100vh-70px)] bg-slate-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <section className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 p-6 text-white shadow-xl sm:p-8 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
              Money Fintrack
            </p>
            <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
              Welcome back, {user?.first_name || "there"}.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-blue-100 sm:text-base">
              Your money overview, recent activity, and account tools — all in
              one place.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
          >
            {loading ? "Refreshing…" : "↻ Refresh overview"}
          </button>
        </section>
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            {error}{" "}
            <button onClick={load} className="ml-2 font-bold underline">
              Try again
            </button>
          </div>
        )}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">
                Available wallet balance
              </p>
              <span className="rounded-xl bg-blue-50 p-3 text-xl text-blue-700">
                ₹
              </span>
            </div>
            <p className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">
              {loading && balance === null ? "Loading…" : money(balance)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Updated from your account
            </p>
            <Link
              to="/balance"
              className="mt-5 inline-flex text-sm font-bold text-blue-700 hover:text-blue-900"
            >
              View balance →
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">
                Recent activity
              </p>
              <span className="rounded-xl bg-violet-50 p-3 text-xl text-violet-700">
                ↻
              </span>
            </div>
            <p className="mt-5 text-3xl font-extrabold text-slate-900">
              {transactions.length}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Latest transactions shown below
            </p>
            <Link
              to="/transactions"
              className="mt-5 inline-flex text-sm font-bold text-blue-700 hover:text-blue-900"
            >
              View all transactions →
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">
                Account status
              </p>
              <span className="rounded-xl bg-emerald-50 p-3 text-xl text-emerald-700">
                ✓
              </span>
            </div>
            <p className="mt-5 text-2xl font-extrabold text-slate-900">
              Active
            </p>
            <p className="mt-2 truncate text-xs text-slate-500">
              {user?.work_email || "Personal Money Fintrack account"}
            </p>
            <Link
              to="/edit"
              className="mt-5 inline-flex text-sm font-bold text-blue-700 hover:text-blue-900"
            >
              Edit personal details →
            </Link>
          </div>
        </section>
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                Quick actions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Get where you need to go, faster.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {quick.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${item.tone}`}
                >
                  {item.icon}
                </div>
                <h3 className="font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                <p className="mt-4 text-sm font-bold text-blue-700">
                  Open feature →
                </p>
              </Link>
            ))}
          </div>
        </section>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Recent transactions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your latest wallet activity
              </p>
            </div>
            <Link
              to="/transactions"
              className="text-sm font-bold text-blue-700 hover:text-blue-900"
            >
              See all →
            </Link>
          </div>
          {loading && transactions.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              Loading recent activity…
            </p>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-semibold text-slate-700">
                No transactions yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Your completed deposits and withdrawals will appear here.
              </p>
              <Link
                to="/transfer"
                className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Go to fund transfer
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Transaction</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx, i) => (
                    <tr
                      key={tx.id || tx._id || `${tx.type}-${i}`}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {tx.description || "Wallet transaction"}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {dateLabel(tx.created_at)}
                      </td>
                      <td className="px-6 py-4 capitalize text-slate-600">
                        {tx.type || "—"}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-bold ${tx.type === "deposit" ? "text-emerald-600" : "text-slate-800"}`}
                      >
                        {tx.type === "deposit" ? "+" : "−"}
                        {money(
                          Number(
                            tx.amount ??
                              (tx.amount_paise !== undefined
                                ? Number(tx.amount_paise) / 100
                                : 0),
                          ),
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
