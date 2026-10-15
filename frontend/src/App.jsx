import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Header from "./Components/Header";
import Footer from "./Components/Footer";
import Home from "./Components/Home";
import Learn from "./Components/Learnit";
import PublicAuthActions from "./Components/PublicAuthActions";
import Dashboard from "./Pages/Dashboard";
import Transactions from "./Pages/Transactions";
import Account from "./Pages/Account";
import Login from "./Pages/Login";
import Transfer from "./Pages/Transfer";
import Balance from "./Pages/Balance";
import Delete from "./Pages/Delete";
import Edit from "./Pages/Edit";
import Forget from "./Pages/Forget";
import ProtectedRoute from "./Components/ProtectedRoute";
import api, { clearSession, getSavedUser } from "./lib/api";

export default function App() {
  const [user, setUser] = useState(getSavedUser());
  const location = useLocation();
  const path = location.pathname.toLowerCase();
  const privateRoute = [
    "/dashboard",
    "/transfer",
    "/tranfer",
    "/transactions",
    "/balance",
    "/delete",
    "/edit",
  ].includes(path);
  const authRoute = ["/login", "/account", "/forget"].includes(path);
  const showPublicFooter = path === "/" || path === "/learn";

  useEffect(() => {
    const sync = () => setUser(getSavedUser());
    const expired = () => {
      clearSession();
      setUser(null);
    };
    window.addEventListener("mf:session-updated", sync);
    window.addEventListener("mf:session-expired", expired);
    if (localStorage.getItem("mf_access_token")) {
      api
        .get("/me")
        .then((r) => {
          localStorage.setItem("mf_user", JSON.stringify(r.data.user));
          setUser(r.data.user);
        })
        .catch(() => {
          clearSession();
          setUser(null);
        });
    }
    return () => {
      window.removeEventListener("mf:session-updated", sync);
      window.removeEventListener("mf:session-expired", expired);
    };
  }, []);

  const logout = () => {
    clearSession();
    setUser(null);
    window.dispatchEvent(new Event("mf:session-updated"));
  };

  return (
    <div className="min-h-screen flex flex-col">
      {privateRoute && user && <Header user={user} onLogout={logout} />}
      {authRoute && !user && <PublicAuthActions user={user} />}
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <PublicAuthActions user={user} />
                <Home />
              </>
            }
          />
          <Route
            path="/learn"
            element={
              <>
                <PublicAuthActions user={user} />
                <Learn />
              </>
            }
          />
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route
            path="/account"
            element={user ? <Navigate to="/dashboard" replace /> : <Account />}
          />
          <Route path="/forget" element={<Forget />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route
              path="/tranfer"
              element={<Navigate to="/transfer" replace />}
            />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/balance" element={<Balance />} />
            <Route path="/delete" element={<Delete />} />
            <Route path="/edit" element={<Edit />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {showPublicFooter && <Footer />}
    </div>
  );
}
