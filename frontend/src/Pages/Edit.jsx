import { useEffect, useState } from "react";
import api, { getApiError, getSavedUser } from "../lib/api";

const fields = [
  { name: "first_name", label: "First name", type: "text" },
  { name: "last_name", label: "Last name", type: "text" },
  { name: "phone", label: "Phone number", type: "tel" },
  { name: "work_email", label: "Email address", type: "email" },
  { name: "age", label: "Age", type: "number" },
  { name: "address", label: "Address", type: "text" },
];

export default function Edit() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    age: "",
    work_email: "",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get("/me");
        const user = response.data.user || getSavedUser() || {};
        setForm({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          phone: user.phone || "",
          address: user.address || "",
          age: user.age ?? "",
          work_email: user.work_email || "",
        });
      } catch (error) {
        setMessage(getApiError(error, "Could not load your personal details."));
      }
    };
    loadProfile();
  }, []);

  const change = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: name === "phone" ? value.replace(/\\D/g, "").slice(0, 10) : value,
    }));
    setSuccess(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setSuccess(false);
    try {
      const response = await api.put("/profile", {
        ...form,
        age: Number(form.age),
      });
      const user = response.data.user;
      if (user) {
        localStorage.setItem("mf_user", JSON.stringify(user));
        window.dispatchEvent(new Event("mf:session-updated"));
      }
      setSuccess(true);
      setMessage(
        response.data.message || "Your personal details were updated.",
      );
    } catch (error) {
      setMessage(getApiError(error, "Profile update failed."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-72px)] bg-slate-50 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
            Account settings
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Personal details
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
            Keep your profile information accurate and up to date.
          </p>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-7 border-b border-slate-100 pb-5">
            <h2 className="text-lg font-bold text-slate-900">
              Profile information
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Update the details associated with your account.
            </p>
          </div>

          <form
            onSubmit={submit}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2"
          >
            {fields.map((field) => (
              <label key={field.name} className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  {field.label}
                </span>
                <input
                  name={field.name}
                  type={field.type}
                  min={field.name === "age" ? 18 : undefined}
                  max={field.name === "age" ? 120 : undefined}
                  maxLength={field.name === "phone" ? 10 : undefined}
                  required
                  value={form[field.name]}
                  onChange={change}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </label>
            ))}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-green-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {busy ? "Saving changes…" : "Save personal details"}
              </button>
            </div>
          </form>

          {message && (
            <p
              role="status"
              className={`mt-5 rounded-xl p-4 text-sm ${
                success
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              {message}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
