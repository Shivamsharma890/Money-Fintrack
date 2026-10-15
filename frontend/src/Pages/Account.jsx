import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { getApiError } from "../lib/api";
import MFLogo from "../assets/MFLogo.png";

const initialForm = {
  first_name: "",
  last_name: "",
  phone: "",
  address: "",
  age: "",
  work_email: "",
  userid: "",
  password: "",
};

const fields = [
  {
    name: "first_name",
    label: "First name",
    placeholder: "Your first name",
    type: "text",
    auto: "given-name",
  },
  {
    name: "last_name",
    label: "Last name",
    placeholder: "Your last name",
    type: "text",
    auto: "family-name",
  },
  {
    name: "work_email",
    label: "Email address",
    placeholder: "you@example.com",
    type: "email",
    auto: "email",
  },
  {
    name: "phone",
    label: "Phone number",
    placeholder: "10-digit mobile number",
    type: "tel",
    auto: "tel",
  },
  {
    name: "age",
    label: "Age",
    placeholder: "Enter your age",
    type: "number",
    auto: "off",
  },
  {
    name: "userid",
    label: "Choose a user ID",
    placeholder: "Create a unique user ID",
    type: "text",
    auto: "username",
  },
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-[#fafbf9] px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100";

export default function Account() {
  const [form, setForm] = useState(initialForm);
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const change = (event) => {
    const { name, value } = event.target;

    if (name === "phone" && !/^\d{0,10}$/.test(value)) {
      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }

    if (!form.age || Number(form.age) < 18 || Number(form.age) > 120) {
      setError("Enter a valid age between 18 and 120.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setBusy(true);

    try {
      const payload = {
        ...form,
        age: Number(form.age),
      };

      await api.post("/account", payload);

      setSuccess("Your account has been created successfully.");

      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1000);
    } catch (requestError) {
      setError(
        getApiError(
          requestError,
          "Could not create your account. Please try again.",
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

      <div className="relative mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_30px_100px_-35px_rgba(16,40,29,0.22)] lg:grid-cols-[0.78fr_1.22fr]">
        {/* Brand panel */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#102a21] p-10 text-white lg:flex xl:p-12">
          <div className="pointer-events-none absolute -right-20 top-16 h-72 w-72 rounded-full border border-emerald-200/15" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative">
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

            <div className="mt-16 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.17em] text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Start your journey
            </div>

            <h1 className="mt-7 text-4xl font-black leading-[1.13] tracking-tight xl:text-5xl">
              Make room for
              <span className="block text-emerald-300">
                better money habits.
              </span>
            </h1>

            <p className="mt-6 max-w-sm text-sm leading-7 text-slate-300">
              Create your account to keep your wallet, transactions and personal
              finance activity organized in one place.
            </p>
          </div>

          <div className="relative mt-12 space-y-5 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            {[
              "Your financial activity in one place",
              "Quick access to your wallet and transactions",
              "A dashboard designed for everyday clarity",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-xs font-black text-emerald-300">
                  ✓
                </span>
                <p className="text-sm leading-6 text-slate-200">{item}</p>
              </div>
            ))}
          </div>

          <p className="relative mt-8 text-xs text-slate-400">
            Money Fintrack · Your money, in focus.
          </p>
        </aside>
        <section className="px-5 py-8 sm:px-9 sm:py-10 xl:px-12">
          <div className="mx-auto max-w-xl">
            <div className="mb-7 lg:hidden">
              <Link to="/" className="inline-flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#102a21] text-lg font-black text-emerald-300">
                  M
                </span>
                <span className="text-lg font-extrabold text-slate-950">
                  Money <span className="text-emerald-700">Fintrack</span>
                </span>
              </Link>
            </div>

            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-800">
              Create your account
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#13241c] sm:text-4xl">
              Let's get you started.
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Enter your details below to set up your Money Fintrack account.
            </p>

            <form onSubmit={submit} className="mt-7 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.name}>
                    <label
                      htmlFor={field.name}
                      className="mb-2 block text-sm font-bold text-slate-700"
                    >
                      {field.label}
                    </label>

                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      autoComplete={field.auto}
                      min={field.name === "age" ? 18 : undefined}
                      max={field.name === "age" ? 120 : undefined}
                      maxLength={field.name === "phone" ? 10 : undefined}
                      inputMode={field.name === "phone" ? "numeric" : undefined}
                      required
                      disabled={busy}
                      value={form[field.name]}
                      onChange={change}
                      placeholder={field.placeholder}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Address
                </label>

                <textarea
                  id="address"
                  name="address"
                  rows={2}
                  required
                  disabled={busy}
                  value={form.address}
                  onChange={change}
                  placeholder="Enter your current address"
                  className={`${inputClass} resize-y`}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      required
                      disabled={busy}
                      value={form.password}
                      onChange={change}
                      placeholder="At least 8 characters"
                      className={`${inputClass} pr-14`}
                    />

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute inset-y-0 right-0 px-3 text-xs font-extrabold text-emerald-800"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Confirm password
                  </label>

                  <div className="relative">
                    <input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      disabled={busy}
                      value={confirm}
                      onChange={(event) => {
                        setConfirm(event.target.value);
                        setError("");
                      }}
                      placeholder="Enter it again"
                      className={`${inputClass} pr-14`}
                    />

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setShowConfirm((value) => !value)}
                      aria-label={
                        showConfirm ? "Hide password" : "Show password"
                      }
                      className="absolute inset-y-0 right-0 px-3 text-xs font-extrabold text-emerald-800"
                    >
                      {showConfirm ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  role="status"
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
                >
                  {success} Redirecting you to sign in...
                </div>
              )}

              <button
                type="submit"
                disabled={busy || Boolean(success)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#153b2b] px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-950/10 transition duration-200 hover:-translate-y-0.5 hover:bg-[#20543c] focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-wait disabled:opacity-60"
              >
                {busy ? "Creating your account..." : "Create account"}
                {!busy && <span aria-hidden="true">↗</span>}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-extrabold text-emerald-800 transition hover:text-emerald-950"
              >
                Sign in
              </Link>
            </p>

            <p className="mt-5 text-center text-xs leading-5 text-slate-400">
              Use a strong, unique password to help protect your account.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
