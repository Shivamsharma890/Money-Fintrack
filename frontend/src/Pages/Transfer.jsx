import { useEffect, useState } from "react";
import api, { getApiError, getSavedUser } from "../lib/api";

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), {
        once: true,
      });
      existingScript.addEventListener("error", () => resolve(false), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function Transfer() {
  const [stage, setStage] = useState("options");
  const [selectedMode, setSelectedMode] = useState("test");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [user, setUser] = useState(getSavedUser());
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [busy, setBusy] = useState(false);

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const showError = (text) => {
    setMessage(text);
    setMessageType("error");
  };

  const refresh = async () => {
    try {
      const [balanceResponse, userResponse] = await Promise.all([
        api.get("/balance"),
        api.get("/me"),
      ]);

      setBalance(Number(balanceResponse.data.balance || 0));

      const currentUser = userResponse.data.user;
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem("mf_user", JSON.stringify(currentUser));
      }
    } catch (error) {
      showError(getApiError(error, "Unable to load your account details."));
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const validAmount = () => {
    const value = Number(amount);

    if (
      !Number.isFinite(value) ||
      value <= 0 ||
      value > 100000 ||
      Math.round(value * 100) !== value * 100
    ) {
      showError(
        "Enter an amount from ₹0.01 to ₹1,00,000 with up to two decimal places.",
      );
      return null;
    }

    return value;
  };

  const withdraw = async () => {
    const value = validAmount();
    if (value === null) return;

    setBusy(true);
    setMessage("");

    try {
      const response = await api.post("/transfer", {
        action: "withdraw",
        amount: value,
      });

      setBalance(Number(response.data.new_balance));
      setAmount("");
      setStage("options");
      setMessageType("success");
      setMessage(
        response.data.message ||
          `₹${formatCurrency(value)} withdrawn successfully.`,
      );
    } catch (error) {
      showError(getApiError(error, "Withdrawal failed. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const deposit = async () => {
    const value = validAmount();
    if (value === null) return;

    setBusy(true);
    setMessage("");

    try {
      const loaded = await loadRazorpay();

      if (!loaded) {
        throw new Error("Unable to load Razorpay. Check your connection.");
      }

      const response = await api.post("/create_order", {
        amount: value,
        mode: selectedMode,
      });

      const order = response.data;

      if (!order.key_id || !order.order_id) {
        throw new Error("The server returned an invalid payment order.");
      }

      const isTestKey = order.key_id.startsWith("rzp_test_");

      if (order.mode && order.mode !== selectedMode) {
        throw new Error(
          `The server returned ${order.mode.toUpperCase()} mode instead of ${selectedMode.toUpperCase()} mode.`,
        );
      }

      if (
        (selectedMode === "test" && !isTestKey) ||
        (selectedMode === "live" && isTestKey)
      ) {
        throw new Error(
          `The server returned a ${isTestKey ? "TEST" : "LIVE"} key for ${selectedMode.toUpperCase()} mode. Check your backend payment configuration.`,
        );
      }

      const checkout = new window.Razorpay({
        key: order.key_id,
        amount: Number(order.amount || Math.round(value * 100)),
        currency: order.currency || "INR",
        name: "Money Fintrack",
        description:
          selectedMode === "test"
            ? "Test mode wallet deposit"
            : "Live mode wallet deposit",
        order_id: order.order_id,
        prefill: {
          name: user
            ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
            : "",
          email: user?.work_email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: selectedMode === "test" ? "#D2522E" : "#1A73E8",
        },
        handler: async (paymentResponse) => {
          try {
            const verifiedResponse = await api.post("/verify_payment", {
              ...paymentResponse,
              mode: selectedMode,
            });

            if (verifiedResponse.data.success === false) {
              throw new Error("Payment verification failed.");
            }

            setAmount("");
            setMessageType("success");
            setMessage(
              verifiedResponse.data.message ||
                "Payment verified and balance updated.",
            );

            await refresh();
            setStage("options");
          } catch (error) {
            showError(
              getApiError(
                error,
                "Payment verification failed. Contact support if money was debited.",
              ),
            );
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
      });

      checkout.on("payment.failed", (paymentError) => {
        showError(
          paymentError.error?.description || "Payment could not be completed.",
        );
        setBusy(false);
      });

      checkout.open();
    } catch (error) {
      showError(getApiError(error, "Unable to start the payment."));
      setBusy(false);
    }
  };

  const selectStage = (nextStage) => {
    setStage(nextStage);
    setAmount("");
    setMessage("");
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-slate-50 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 px-6 py-8 text-white sm:px-10 sm:py-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
              Money Fintrack
            </p>

            <h1 className="mt-3 text-3xl font-black sm:text-4xl">
              {stage === "withdraw"
                ? "Withdraw Money"
                : stage === "deposit"
                  ? "Deposit Money"
                  : "Manage Your Money"}
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
              Move money securely and keep track of your available balance.
            </p>
          </div>

          <div className="p-5 sm:p-8 lg:p-10">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:p-6">
              <p className="text-sm font-semibold text-slate-600">
                Available Balance
              </p>

              <p className="mt-2 break-words text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                ₹{formatCurrency(balance)}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Your current account balance
              </p>
            </div>

            {message && (
              <div
                role="status"
                className={`mt-5 rounded-xl border px-4 py-3 text-sm font-medium ${
                  messageType === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
              >
                {message}
              </div>
            )}

            {stage === "options" ? (
              <div className="mt-8 space-y-7">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Choose a transaction
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Select an action to continue.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => selectStage("deposit")}
                    className="group rounded-2xl border border-blue-200 bg-white p-6 text-left transition hover:-translate-y-1 hover:border-blue-500 hover:bg-blue-50 hover:shadow-lg hover:shadow-blue-100"
                  >
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
                      Add funds
                    </span>
                    <span className="mt-3 block text-xl font-extrabold text-slate-900">
                      Deposit Money
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-slate-500">
                      Add money to your account through Razorpay.
                    </span>
                    <span className="mt-5 block font-bold text-blue-700">
                      Continue →
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => selectStage("withdraw")}
                    className="group rounded-2xl border border-rose-200 bg-white p-6 text-left transition hover:-translate-y-1 hover:border-rose-400 hover:bg-rose-50 hover:shadow-lg hover:shadow-rose-100"
                  >
                    <span className="text-xs font-bold uppercase tracking-widest text-rose-700">
                      Move funds
                    </span>
                    <span className="mt-3 block text-xl font-extrabold text-slate-900">
                      Withdraw Money
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-slate-500">
                      Withdraw money from your available balance.
                    </span>
                    <span className="mt-5 block font-bold text-rose-700">
                      Continue →
                    </span>
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-900">
                    Razorpay payment mode
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Choose your mode before starting a deposit.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMode("test");
                        setMessage("");
                      }}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        selectedMode === "test"
                          ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="block font-bold text-slate-900">
                        Test Mode
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        Use test credentials; no real payment.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMode("live");
                        setMessage("");
                      }}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        selectedMode === "live"
                          ? "border-rose-500 bg-rose-50 ring-2 ring-rose-100"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="block font-bold text-slate-900">
                        Live Mode
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        Real payments may be charged.
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto mt-8 max-w-xl">
                <div className="mb-6">
                  <h2 className="text-xl font-extrabold text-slate-900">
                    {stage === "withdraw"
                      ? "Enter withdrawal amount"
                      : "Enter deposit amount"}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {stage === "withdraw"
                      ? "The amount must be within your available balance."
                      : `Your payment will use ${selectedMode.toUpperCase()} mode.`}
                  </p>
                </div>

                {stage === "deposit" && (
                  <div
                    className={`mb-5 rounded-xl border px-4 py-3 text-sm font-semibold ${
                      selectedMode === "test"
                        ? "border-blue-200 bg-blue-50 text-blue-800"
                        : "border-rose-200 bg-rose-50 text-rose-800"
                    }`}
                  >
                    {selectedMode === "test"
                      ? "Test payment selected"
                      : "Live payment selected — real money may be charged"}
                  </div>
                )}

                <label
                  htmlFor="amount"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Amount (₹)
                </label>

                <input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  max="100000"
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setMessage("");
                  }}
                  placeholder="0.00"
                  disabled={busy}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-lg font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Minimum ₹0.01 · Maximum ₹1,00,000
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={stage === "withdraw" ? withdraw : deposit}
                    className={`rounded-xl px-5 py-3.5 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      stage === "withdraw"
                        ? "bg-rose-600 hover:bg-rose-700"
                        : selectedMode === "test"
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-rose-600 hover:bg-rose-700"
                    }`}
                  >
                    {busy
                      ? "Processing..."
                      : stage === "withdraw"
                        ? "Confirm Withdrawal"
                        : "Proceed to Payment"}
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => selectStage("options")}
                    className="rounded-xl border border-slate-200 px-5 py-3.5 font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          Keep your account credentials secure. Always verify the payment mode
          before proceeding with a live transaction.
        </p>
      </div>
    </div>
  );
}
