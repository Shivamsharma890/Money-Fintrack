import React, { useState } from "react";
import { Link } from "react-router-dom";
import api, { getApiError } from "../lib/api";

const phoneIsValid = (value) => /^[6-9]\d{9}$/.test(value);
const passwordIsValid = (value) => value.length >= 8 && value.length <= 128;

export default function Forget() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState("phone");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  const requestOtp = async (event) => {
    event.preventDefault();
    if (!phoneIsValid(phone))
      return showMessage(
        "Enter a valid 10-digit Indian mobile number.",
        "error",
      );
    setBusy(true);
    setMessage("");
    try {
      const response = await api.post("/forgot", { phone });
      showMessage(
        response.data.message ||
          "If the phone number is registered, an OTP will be sent shortly.",
      );
      setStep("otp");
    } catch (error) {
      showMessage(
        getApiError(error, "Could not request an OTP. Please try again."),
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp))
      return showMessage("Enter the 6-digit OTP.", "error");
    setBusy(true);
    setMessage("");
    try {
      const response = await api.post("/forgot/verify", { phone, otp });
      setResetToken(response.data.reset_token);
      setStep("password");
      showMessage("OTP verified. Choose a new password.", "success");
    } catch (error) {
      showMessage(getApiError(error, "OTP is invalid or expired."), "error");
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    if (!passwordIsValid(password))
      return showMessage("Password must be 8–128 characters.", "error");
    if (password !== confirmPassword)
      return showMessage("Passwords do not match.", "error");
    setBusy(true);
    setMessage("");
    try {
      const response = await api.post("/forgot/reset", {
        phone,
        reset_token: resetToken,
        new_password: password,
      });
      showMessage(
        response.data.message || "Password reset successful.",
        "success",
      );
      setStep("done");
      setPassword("");
      setConfirmPassword("");
      setResetToken("");
    } catch (error) {
      showMessage(
        getApiError(error, "Password reset failed. Request a new OTP."),
        "error",
      );
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:opacity-60";
  const buttonClass =
    "w-full rounded-xl bg-[#153b2b] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-950/10 transition hover:bg-[#20543c] focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-wait disabled:opacity-60";

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#f6f8f5] px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/5 sm:p-9">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
          🔐
        </div>
        <p className="text-center text-xs font-extrabold uppercase tracking-[.18em] text-emerald-800">
          Money Fintrack
        </p>
        <h1 className="mt-2 text-center text-3xl font-black tracking-tight text-slate-950">
          Recover account
        </h1>
        <p className="mt-3 text-center text-sm leading-6 text-slate-500">
          Verify your registered mobile number to securely create a new
          password.
        </p>

        {message && (
          <p
            role="status"
            aria-live="polite"
            className={`mt-5 rounded-xl border px-4 py-3 text-sm ${messageType === "error" ? "border-red-200 bg-red-50 text-red-700" : messageType === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-700"}`}
          >
            {message}
          </p>
        )}

        {step === "phone" && (
          <form onSubmit={requestOtp} className="mt-6 space-y-4">
            <label
              htmlFor="phone"
              className="block text-sm font-bold text-slate-700"
            >
              Registered mobile number
            </label>
            <div className="flex gap-2">
              <span className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-600">
                +91
              </span>
              <input
                id="phone"
                type="tel"
                autoComplete="tel-national"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                disabled={busy}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="10-digit mobile number"
                required
                className={inputClass}
              />
            </div>
            <button disabled={busy} type="submit" className={buttonClass}>
              {busy ? "Requesting OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={verifyOtp} className="mt-6 space-y-4">
            <label
              htmlFor="otp"
              className="block text-sm font-bold text-slate-700"
            >
              6-digit OTP
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              disabled={busy}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Enter OTP from SMS"
              required
              className={inputClass}
            />
            <button disabled={busy} type="submit" className={buttonClass}>
              {busy ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setStep("phone");
                setOtp("");
                setMessage("");
              }}
              className="w-full py-2 text-sm font-bold text-emerald-800 hover:text-emerald-950"
            >
              Change phone number
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={resetPassword} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                value={password}
                disabled={busy}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                value={confirmPassword}
                disabled={busy}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                className={inputClass}
              />
            </div>
            <button disabled={busy} type="submit" className={buttonClass}>
              {busy ? "Updating password..." : "Reset password"}
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm font-semibold text-emerald-800">
              Your password has been updated successfully.
            </div>
            <Link to="/login" className={`${buttonClass} block text-center`}>
              Go to login
            </Link>
          </div>
        )}

        <p className="mt-7 text-center text-sm text-slate-500">
          Remember your password?{" "}
          <Link
            className="font-extrabold text-emerald-800 hover:text-emerald-950"
            to="/login"
          >
            Back to login
          </Link>
        </p>
      </section>
    </main>
  );
}
