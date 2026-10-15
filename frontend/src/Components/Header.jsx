import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import MFLogo from "../assets/MFLogo.png";

const navItems = [
  { to: "/dashboard", label: "Overview" },
  { to: "/transfer", label: "Fund transfer" },
  { to: "/transactions", label: "Transactions" },
  { to: "/balance", label: "Balance" },
  { to: "/edit", label: "Personal details" },
  { to: "/delete", label: "Close account" },
];

export default function Header({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const close = () => setOpen(false);
  const logout = () => {
    close();
    onLogout?.();
    navigate("/", { replace: true });
  };

  const linkClass = (to) =>
    `flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
      location.pathname.toLowerCase() === to.toLowerCase()
        ? "bg-blue-700 text-white shadow-sm"
        : "text-slate-600 hover:bg-blue-50 hover:text-blue-800"
    }`;

  const links = (mobile = false) =>
    navItems.map((item) => (
      <Link
        key={item.to}
        to={item.to}
        onClick={mobile ? close : undefined}
        className={linkClass(item.to)}
      >
        <span className="text-[10px] font-extrabold tracking-wider opacity-70">
          {item.mark}
        </span>
        {item.label}
      </Link>
    ));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          aria-label="Money Fintrack home"
          className="group flex shrink-0 items-center gap-3"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-[0_3px_12px_rgba(16,80,55,0.10)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_6px_18px_rgba(16,80,55,0.16)]">
            <img
              src={MFLogo}
              alt="Money Fintrack logo"
              className="h-full w-full object-contain p-1"
            />
          </span>
          <span className="flex flex-col">
            <span className="whitespace-nowrap text-[21px] font-extrabold leading-none tracking-[-0.8px] text-black sm:text-[23px]">
              Money<span className="ml-1 text-blue-600">Fintrack</span>
            </span>

            <span className="mt-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[2px] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Smart Finance
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 2xl:flex"
          aria-label="Account navigation"
        >
          {links()}
        </nav>

        <div className="hidden items-center gap-3 2xl:flex">
          <div className="max-w-36 text-right">
            <p className="truncate text-sm font-bold text-slate-800">
              {user?.first_name || "Account"} {user?.last_name || ""}
            </p>
            <p className="text-xs text-slate-500">Personal account</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            Log out
          </button>
        </div>

        <button
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 2xl:hidden"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-lg 2xl:hidden">
          <p className="mb-3 text-sm font-bold text-slate-700">
            Welcome, {user?.first_name || "there"}
          </p>
          <nav
            className="grid grid-cols-1 gap-1 sm:grid-cols-2"
            aria-label="Mobile account navigation"
          >
            {links(true)}
          </nav>
          <button
            type="button"
            onClick={logout}
            className="mt-3 w-full rounded-xl bg-rose-50 px-4 py-3 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
