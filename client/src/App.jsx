import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Routes,
  Route,
  Navigate,
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Wallet,
  LogOut,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Menu,
  X,
  Boxes,
  Search,
  Trash2,
  ChartNoAxesCombined,
  ShieldCheck,
  Sparkles,
  CalendarDays,
  AlertTriangle,
  Eye,
  EyeOff,
  Users,
  ClipboardList,
  ChartColumn,
  FileSpreadsheet,
  FileDown,
  Download,
  UserRound,
  BarChart3,
  CheckCircle2,
  XCircle,
  Info,
  X as CloseIcon,
} from "lucide-react";
import { api, money, dateLabel } from "./api";

const ToastContext = createContext(null);
const useToast = () => useContext(ToastContext);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const notify = (message, type = "success", title) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((items) => [...items, { id, message, type, title }]);
    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, 3800);
  };
  const dismiss = (id) =>
    setToasts((items) => items.filter((item) => item.id !== id));
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="bl-toast-stack" aria-live="polite" aria-atomic="false">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon =
              toast.type === "error"
                ? XCircle
                : toast.type === "info"
                  ? Info
                  : CheckCircle2;
            return (
              <motion.div
                key={toast.id}
                className={`bl-toast bl-toast-${toast.type}`}
                initial={{
                  opacity: 0,
                  x: 36,
                  scale: 0.94,
                  filter: "blur(5px)",
                }}
                animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 24, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
                role={toast.type === "error" ? "alert" : "status"}
              >
                <span className="bl-toast-icon">
                  <Icon size={19} />
                </span>
                <span className="bl-toast-copy">
                  <strong>
                    {toast.title ||
                      (toast.type === "error"
                        ? "Something went wrong"
                        : toast.type === "info"
                          ? "Notice"
                          : "Successfully saved")}
                  </strong>
                  <small>{toast.message}</small>
                </span>
                <button
                  className="bl-toast-close"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                >
                  <CloseIcon size={16} />
                </button>
                <motion.i
                  className="bl-toast-progress"
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 3.8, ease: "linear" }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <style>{`
        .bl-toast-stack{position:fixed;z-index:99999;top:22px;right:22px;display:flex;flex-direction:column;gap:12px;width:min(390px,calc(100vw - 28px));pointer-events:none}
        .bl-toast{position:relative;display:flex;align-items:center;gap:12px;padding:15px 42px 15px 14px;background:rgba(255,255,255,.96);backdrop-filter:blur(18px);border:1px solid #e8eaf2;border-radius:16px;box-shadow:0 18px 55px rgba(28,32,66,.16);overflow:hidden;pointer-events:auto}
        .bl-toast-icon{width:38px;height:38px;display:grid;place-items:center;border-radius:12px;flex:none}
        .bl-toast-success .bl-toast-icon{background:#e8fbf1;color:#0b9b61}.bl-toast-error .bl-toast-icon{background:#fff0f0;color:#dc4545}.bl-toast-info .bl-toast-icon{background:#eef2ff;color:#6255e7}
        .bl-toast-copy{display:flex;flex-direction:column;gap:3px;min-width:0}.bl-toast-copy strong{font-size:13px;color:#171a2b;font-weight:750}.bl-toast-copy small{font-size:12px;line-height:1.45;color:#72778b;overflow-wrap:anywhere}
        .bl-toast-close{position:absolute;right:12px;top:12px;border:0;background:transparent;color:#9a9eb0;cursor:pointer;padding:3px}.bl-toast-close:hover{color:#34384c}
        .bl-toast-progress{position:absolute;bottom:0;left:0;width:100%;height:3px;transform-origin:left;background:#19b879}.bl-toast-error .bl-toast-progress{background:#e05252}.bl-toast-info .bl-toast-progress{background:#7164ed}
        @media(max-width:600px){.bl-toast-stack{top:12px;right:12px;width:calc(100vw - 24px)}}
        @media(prefers-reduced-motion:reduce){.bl-toast,.bl-toast *{transition:none!important;animation:none!important}}
      `}</style>
    </ToastContext.Provider>
  );
}

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);
function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("bizledger_token");
    if (!token) {
      setReady(true);
      return;
    }
    api
      .get("/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => localStorage.removeItem("bizledger_token"))
      .finally(() => setReady(true));
  }, []);
  const login = async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    localStorage.setItem("bizledger_token", data.token);
    setUser(data.user);
  };
  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("bizledger_token", data.token);
    setUser(data.user);
  };
  const logout = () => {
    localStorage.removeItem("bizledger_token");
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
const nav = [
  ["Overview", "/", LayoutDashboard],
  ["Products", "/products", Package],
  ["Sales", "/sales", ShoppingCart],
  ["Expenses", "/expenses", Receipt],
  ["Investments", "/investments", Wallet],
  ["Orders", "/orders", ClipboardList],
  ["Customers", "/customers", Users],
  ["Monthly reports", "/reports", ChartColumn],
  ["Analytics", "/analytics", BarChart3],
];
function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  );
}
function AppRoutes() {
  const { user, ready } = useAuth();
  if (!ready)
    return (
      <div className="loading-screen">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <AuthPage mode="login" />}
      />
      <Route
        path="/register"
        element={
          user ? <Navigate to="/" replace /> : <AuthPage mode="register" />
        }
      />
      <Route
        path="/*"
        element={user ? <Shell /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}
function DeveloperFooter({ compact = false }) {
  return (
    <>
      <footer
        className={`developer-credit ${compact ? "developer-credit-compact" : ""}`}
      >
        <span className="developer-credit-label">Crafted with care</span>
        <span className="developer-credit-main">
          Developed By Dip. Engr.{" "}
          <a
            href="https://asadulsameerportfolio-2167f.web.app/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit Asadul Sameer's portfolio"
          >
            Asadul Sameer <ArrowUpRight size={14} />
          </a>
        </span>
      </footer>
      <style>{`
        .developer-credit{
          position:relative;display:flex;align-items:center;justify-content:center;
          flex-wrap:wrap;gap:7px 12px;margin:28px 0 4px;padding:15px 20px;
          border:1px solid rgba(115,105,230,.18);border-radius:16px;
          background:linear-gradient(115deg,rgba(113,100,237,.075),rgba(25,184,121,.055));
          color:#7b8094;text-align:center;font-size:12px;
        }
        .developer-credit:before{
          content:"";position:absolute;top:-1px;left:50%;transform:translateX(-50%);
          width:72px;height:2px;border-radius:99px;
          background:linear-gradient(90deg,#7164ed,#19b879);
        }
        .developer-credit-label{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9297aa}
        .developer-credit-main{font-weight:600;color:#62677d}
        .developer-credit a{
          display:inline-flex;align-items:center;gap:3px;color:#6255d9;
          font-weight:800;text-decoration:none;transition:color .2s, gap .2s;
        }
        .developer-credit a:hover{color:#159b6b;gap:6px}
        .developer-credit-compact{margin-top:24px}
        @media(max-width:600px){.developer-credit{padding:13px 12px;gap:5px 9px}}
        @media(prefers-reduced-motion:reduce){.developer-credit a{transition:none}}
      `}</style>
    </>
  );
}

function AuthPage({ mode }) {
  const isRegister = mode === "register",
    { login, register } = useAuth(),
    navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [show, setShow] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await (isRegister
        ? register(form)
        : login({ email: form.email, password: form.password }));
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not connect to the server.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth-wrap">
      <div className="auth-art">
        <div className="brand brand-light">
          <span className="brand-mark">
            <ChartNoAxesCombined size={21} />
          </span>
          bizledger
        </div>
        <div className="art-copy">
          <span className="eyebrow">YOUR BUSINESS, IN FOCUS</span>
          <h1>
            Make every
            <br /> taka <em>count.</em>
          </h1>
          <p>
            A calmer, clearer way to understand your business finances. Track
            sales, manage costs and grow with confidence.
          </p>
          <div className="art-stats">
            <div>
              <strong>01</strong>
              <span>Know your numbers</span>
            </div>
            <div>
              <strong>02</strong>
              <span>Make better decisions</span>
            </div>
          </div>
        </div>
        <div className="art-orbit orbit-one" />
        <div className="art-orbit orbit-two" />
        <div className="art-card">
          <div className="art-card-top">
            <span>Net profit</span>
            <TrendingUp size={17} />
          </div>
          <strong>৳ 84,250</strong>
          <small>↑ 18.6% this month</small>
          <div className="fake-bars">
            {[28, 44, 36, 62, 49, 77, 57, 91, 70, 100, 82, 94].map((v, i) => (
              <i key={i} style={{ height: `${v}%` }} />
            ))}
          </div>
        </div>
        <div className="art-footer">
          BUILT FOR THE WAY YOU DO BUSINESS <Sparkles size={14} />
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-panel-inner">
          <div className="brand">
            <span className="brand-mark">
              <ChartNoAxesCombined size={21} />
            </span>
            bizledger
          </div>
          <div className="auth-heading">
            <span className="eyebrow">
              {isRegister ? "GET STARTED — IT'S FREE" : "WELCOME BACK"}
            </span>
            <h2>
              {isRegister
                ? "Build your business clarity."
                : "Good to see you again."}
            </h2>
            <p>
              {isRegister
                ? "Create your workspace and start tracking your business."
                : "Sign in to your workspace to pick up where you left off."}
            </p>
          </div>
          <form onSubmit={submit} className="auth-form">
            {isRegister && (
              <Field label="Your name">
                <input
                  className="input input-bordered"
                  placeholder="e.g. Alex Morgan"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
            )}
            <Field label="Email address">
              <input
                className="input input-bordered"
                type="email"
                placeholder="you@example.com"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Password">
              <div className="password-wrap">
                <input
                  className="input input-bordered"
                  type={show ? "text" : "password"}
                  minLength={isRegister ? 8 : 1}
                  placeholder={
                    isRegister ? "At least 8 characters" : "Enter your password"
                  }
                  required
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
                <button type="button" onClick={() => setShow(!show)}>
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </Field>
            {error && <div className="alert alert-error text-sm">{error}</div>}
            <button className="btn btn-primary auth-submit" disabled={busy}>
              {busy ? (
                <span className="loading loading-spinner" />
              ) : isRegister ? (
                "Create free account"
              ) : (
                "Sign in"
              )}{" "}
              <ArrowUpRight size={17} />
            </button>
          </form>
          <p className="auth-switch">
            {isRegister ? "Already have an account?" : "New to BizLedger?"}{" "}
            <NavLink to={isRegister ? "/login" : "/register"}>
              {isRegister ? "Sign in" : "Create an account"}
            </NavLink>
          </p>
          <div className="secure-note">
            <ShieldCheck size={15} /> Your business data is private to your
            account.
          </div>
          <DeveloperFooter compact />
        </div>
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Shell() {
  const { user, logout } = useAuth(),
    [mobile, setMobile] = useState(false),
    location = useLocation();
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "sidebar-open" : ""}`}>
        <div className="brand side-brand">
          <span className="brand-mark">
            <ChartNoAxesCombined size={21} />
          </span>
          bizledger
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          {nav.map(([label, path, Icon]) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              onClick={() => setMobile(false)}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
              {path === "/" && <span className="nav-dot" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <Sparkles size={17} />
            </div>
            <strong>Small steps, big growth.</strong>
            <p>Keep your numbers up to date for a healthier business.</p>
          </div>
          <div className="user-row">
            <div className="avatar-circle">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="user-info">
              <strong>{user?.name}</strong>
              <span>{user?.email}</span>
            </div>
            <button className="icon-btn" title="Sign out" onClick={logout}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      {mobile && (
        <div className="mobile-scrim" onClick={() => setMobile(false)} />
      )}
      <main className="main-area">
        <header className="topbar">
          <button
            className="icon-btn mobile-menu"
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X /> : <Menu />}
          </button>
          <div className="breadcrumb">
            Workspace <span>/</span>{" "}
            <strong>
              {nav.find((n) => n[1] === location.pathname)?.[0] || "Overview"}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="live-dot" /> All changes sync to your account{" "}
            <div className="top-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          </div>
        </header>
        <div className="page-content">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/investments" element={<Investments />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </div>
        <DeveloperFooter />
      </main>
    </div>
  );
}
function Page({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.22 }}
    >
      {children}
    </motion.div>
  );
}
function useRefresh() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries();
  };
}
function useData(key, url) {
  return useQuery({
    queryKey: [key],
    queryFn: async () => (await api.get(url)).data,
  });
}
function Header({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
function StatCard({ label, value, sub, icon: Icon, tone = "purple", trend }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className={`stat-icon ${tone}`}>
          <Icon size={19} />
        </span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub">
        {trend && (
          <span className="trend-up">
            <ArrowUpRight size={14} />
            {trend}
          </span>
        )}
        {sub}
      </div>
    </div>
  );
}
function Dashboard() {
  const { data, isLoading } = useData("dashboard", "/dashboard");
  if (isLoading) return <Loader />;
  const s = data?.stats || {};
  return (
    <Page>
      <Header
        eyebrow="TUESDAY, YOUR BUSINESS AT A GLANCE"
        title="Overview"
        description="Here's what's happening with your business today."
        action={
          <div className="date-chip">
            <CalendarDays size={16} />
            {new Date().toLocaleDateString("en-BD", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        }
      />
      <div className="welcome-banner">
        <div>
          <span className="welcome-kicker">YOUR BUSINESS SNAPSHOT</span>
          <h2>
            Numbers tell a story. <em>Make yours count.</em>
          </h2>
          <p>
            Every sale, cost and decision adds up. Keep your records current and
            stay in control.
          </p>
        </div>
        <div className="banner-art">
          <div className="banner-ring" />
          <ChartNoAxesCombined size={72} />
          <span>GROW WITH CLARITY</span>
        </div>
      </div>
      <div className="section-title">
        <div>
          <h3>Financial overview</h3>
          <p>Your all-time business performance</p>
        </div>
        <span className="period-pill">ALL TIME</span>
      </div>
      <div className="stats-grid">
        <StatCard
          label="Total revenue"
          value={money(s.revenue)}
          sub="Money from sales"
          icon={TrendingUp}
          tone="green"
        />
        <StatCard
          label="Net profit / loss"
          value={money(s.profit)}
          sub="Revenue − costs − expenses"
          icon={s.profit >= 0 ? ArrowUpRight : ArrowDownRight}
          tone={s.profit >= 0 ? "purple" : "red"}
        />
        <StatCard
          label="Total investment"
          value={money(s.investment)}
          sub="Owner funding recorded"
          icon={Wallet}
          tone="blue"
        />
        <StatCard
          label="Total expenses"
          value={money(s.expenses)}
          sub="Operating costs"
          icon={Receipt}
          tone="orange"
        />
      </div>
      <div className="stats-grid secondary-stats">
        <StatCard
          label="Products sold"
          value={Number(s.unitsSold || 0).toLocaleString()}
          sub={`${s.orders || 0} total orders`}
          icon={ShoppingCart}
          tone="blue"
        />
        <StatCard
          label="Cost of goods"
          value={money(s.cogs)}
          sub="Recorded product cost"
          icon={Boxes}
          tone="orange"
        />
        <StatCard
          label="Today's revenue"
          value={money(s.todayRevenue)}
          sub={`${s.todayOrders || 0} orders today`}
          icon={CalendarDays}
          tone="green"
        />
        <StatCard
          label="Today's units"
          value={s.todayUnits || 0}
          sub="Units sold today"
          icon={Package}
          tone="purple"
        />
      </div>
      <div className="dashboard-bottom">
        <div className="content-card recent-card">
          <div className="card-heading">
            <div>
              <h3>Recent sales</h3>
              <p>Your latest recorded transactions</p>
            </div>
            <NavLink to="/sales" className="text-link">
              View all <ArrowUpRight size={15} />
            </NavLink>
          </div>
          {data.recentSales?.length ? (
            <div className="table-wrap">
              <table className="table app-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Date</th>
                    <th>Quantity</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSales.map((x) => (
                    <tr key={x._id}>
                      <td>
                        <strong>{x.productName}</strong>
                      </td>
                      <td>{dateLabel(x.soldAt)}</td>
                      <td>{x.quantity}</td>
                      <td className="amount-cell">{money(x.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              icon={ShoppingCart}
              title="No sales recorded yet"
              text="Add your first sale to see it here."
            />
          )}
        </div>
        <div className="content-card stock-card">
          <div className="card-heading">
            <div>
              <h3>Stock watch</h3>
              <p>Products running low</p>
            </div>
            <span className="small-count">{data.lowStock?.length || 0}</span>
          </div>
          {data.lowStock?.length ? (
            data.lowStock.slice(0, 5).map((p) => (
              <div className="stock-row" key={p._id}>
                <div className="product-mini">
                  <Package size={16} />
                </div>
                <div className="stock-name">
                  <strong>{p.name}</strong>
                  <span>{p.sku || "No SKU"}</span>
                </div>
                <span className={`stock-qty ${p.stock === 0 ? "out" : ""}`}>
                  {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                </span>
              </div>
            ))
          ) : (
            <div className="stock-empty">
              <span>
                <Boxes size={24} />
              </span>
              <strong>You're in good shape!</strong>
              <p>No products with 5 or fewer units in stock.</p>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
function Loader() {
  return (
    <div className="loader-box">
      <span className="loading loading-spinner loading-lg text-primary" />{" "}
      Loading your workspace…
    </div>
  );
}
function Empty({ icon: Icon, title, text }) {
  return (
    <div className="empty-state">
      <span>
        <Icon size={23} />
      </span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const f = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="modal-box app-modal"
      >
        <div className="modal-title">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
function useFormMutation(url, method = "post") {
  const refresh = useRefresh();
  const toast = useToast();
  const section = url.split("/").filter(Boolean).pop() || "record";
  const label =
    {
      products: "Product",
      sales: "Sale",
      expenses: "Expense",
      investments: "Investment",
      customers: "Customer",
      orders: "Order",
    }[section] || "Record";
  return useMutation({
    mutationFn: (payload) => api[method](url, payload),
    onSuccess: () => {
      refresh();
      toast(
        `${label} has been added to your workspace.`,
        "success",
        `${label} saved`,
      );
    },
    onError: (error) =>
      toast(
        error.response?.data?.message ||
          `Could not save ${label.toLowerCase()}. Please try again.`,
        "error",
      ),
  });
}
function Products() {
  const toast = useToast();
  const { data = [], isLoading } = useData("products", "/products"),
    [open, setOpen] = useState(false),
    [search, setSearch] = useState(""),
    [form, setForm] = useState({
      name: "",
      sku: "",
      price: "",
      cost: "",
      stock: "",
    });
  const mutation = useFormMutation("/products");
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries();
      toast("Item deleted successfully.", "success", "Deleted");
    },
    onError: (error) =>
      toast(
        error.response?.data?.message || "Could not delete this item.",
        "error",
      ),
  });
  const submit = async (e) => {
    e.preventDefault();
    try {
      await mutation.mutateAsync(form);
      setOpen(false);
      setForm({ name: "", sku: "", price: "", cost: "", stock: "" });
    } catch {}
  };
  const filtered = data.filter((p) =>
    `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <Page>
      <Header
        eyebrow="YOUR CATALOGUE"
        title="Products"
        description="Manage what you sell, what it costs and what's in stock."
        action={
          <button
            className="btn btn-primary action-btn"
            onClick={() => setOpen(true)}
          >
            <Plus size={17} /> Add product
          </button>
        }
      />
      <div className="toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            placeholder="Search products or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="result-count">{filtered.length} products</span>
      </div>
      <div className="content-card">
        <div className="table-wrap">
          <table className="table app-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Selling price</th>
                <th>Unit cost</th>
                <th>Stock</th>
                <th>Margin</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="table-product">
                      <span className="product-mini">
                        <Package size={16} />
                      </span>
                      <strong>{p.name}</strong>
                    </div>
                  </td>
                  <td>{p.sku || "—"}</td>
                  <td>{money(p.price)}</td>
                  <td>{money(p.cost)}</td>
                  <td>
                    <span
                      className={`stock-tag ${p.stock <= 5 ? "warning" : ""}`}
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="profit-cell">{money(p.price - p.cost)}</td>
                  <td>
                    <button
                      className="icon-btn danger-hover"
                      title="Delete product"
                      onClick={() => {
                        if (
                          confirm(
                            "Delete this product? Existing sales remain in reports.",
                          )
                        )
                          del.mutate(p._id);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && !isLoading && (
            <Empty
              icon={Package}
              title="No products found"
              text="Add a product to start building your catalogue."
            />
          )}
          {isLoading && <Loader />}
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Add a product">
        <form onSubmit={submit} className="modal-form">
          <Field label="Product name">
            <input
              className="input input-bordered"
              required
              placeholder="e.g. Classic T-shirt"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="SKU (optional)">
            <input
              className="input input-bordered"
              placeholder="TSH-001"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
          </Field>
          <div className="form-grid">
            <Field label="Selling price (৳)">
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="input input-bordered"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </Field>
            <Field label="Purchase cost (৳)">
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="input input-bordered"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Opening stock (units)">
            <input
              type="number"
              min="0"
              required
              className="input input-bordered"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </Field>
          {mutation.isError && (
            <p className="error-text">
              {mutation.error.response?.data?.message ||
                "Could not save product."}
            </p>
          )}
          <button
            className="btn btn-primary auth-submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving…" : "Save product"}
          </button>
        </form>
      </Modal>
    </Page>
  );
}
function Sales() {
  const toast = useToast();
  const { data: products = [] } = useData("products", "/products"),
    { data = [], isLoading } = useData("sales", "/sales"),
    [open, setOpen] = useState(false),
    [form, setForm] = useState({
      productId: "",
      productName: "",
      quantity: "1",
      unitPrice: "",
      unitCost: "",
      note: "",
      soldAt: new Date().toISOString().slice(0, 10),
    });
  const mutation = useFormMutation("/sales");
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: (id) => api.delete(`/sales/${id}`),
    onSuccess: () => {
      qc.invalidateQueries();
      toast("Item deleted successfully.", "success", "Deleted");
    },
    onError: (error) =>
      toast(
        error.response?.data?.message || "Could not delete this item.",
        "error",
      ),
  });
  const choose = (id) => {
    const p = products.find((x) => x._id === id);
    setForm((f) => ({
      ...f,
      productId: id,
      productName: p?.name || "",
      unitPrice: p?.price ?? "",
      unitCost: p?.cost ?? "",
    }));
  };
  const submit = async (e) => {
    e.preventDefault();
    try {
      await mutation.mutateAsync({
        ...form,
        soldAt: new Date(`${form.soldAt}T12:00:00`),
      });
      setOpen(false);
      setForm({
        productId: "",
        productName: "",
        quantity: "1",
        unitPrice: "",
        unitCost: "",
        note: "",
        soldAt: new Date().toISOString().slice(0, 10),
      });
    } catch {}
  };
  const total = Number(form.quantity || 0) * Number(form.unitPrice || 0);
  return (
    <Page>
      <Header
        eyebrow="MONEY COMING IN"
        title="Sales"
        description="Record each order and keep your revenue and product costs accurate."
        action={
          <button
            className="btn btn-primary action-btn"
            onClick={() => setOpen(true)}
          >
            <Plus size={17} /> Record a sale
          </button>
        }
      />
      <div className="toolbar">
        <span className="result-count">{data.length} recent transactions</span>
        <span className="period-pill">LATEST 200</span>
      </div>
      <div className="content-card">
        <div className="table-wrap">
          <table className="table app-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Date</th>
                <th>Units</th>
                <th>Unit price</th>
                <th>Revenue</th>
                <th>Product cost</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((x) => (
                <tr key={x._id}>
                  <td>
                    <strong>{x.productName}</strong>
                    {x.note && <small className="cell-sub">{x.note}</small>}
                  </td>
                  <td>{dateLabel(x.soldAt)}</td>
                  <td>{x.quantity}</td>
                  <td>{money(x.unitPrice)}</td>
                  <td className="amount-cell">{money(x.total)}</td>
                  <td>{money(x.costTotal)}</td>
                  <td>
                    <button
                      className="icon-btn danger-hover"
                      title="Delete sale and restore stock"
                      onClick={() => {
                        if (
                          confirm(
                            "Delete this sale? Product stock will be restored.",
                          )
                        )
                          del.mutate(x._id);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.length && !isLoading && (
            <Empty
              icon={ShoppingCart}
              title="Your first sale starts here"
              text="Record a sale to start tracking your revenue."
            />
          )}
          {isLoading && <Loader />}
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Record a sale">
        <form onSubmit={submit} className="modal-form">
          <Field label="Select a product (optional)">
            <select
              className="select select-bordered"
              value={form.productId}
              onChange={(e) => choose(e.target.value)}
            >
              <option value="">Custom / unlisted product</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} — {p.stock} in stock
                </option>
              ))}
            </select>
          </Field>
          {!form.productId && (
            <Field label="Product name">
              <input
                className="input input-bordered"
                required
                value={form.productName}
                onChange={(e) =>
                  setForm({ ...form, productName: e.target.value })
                }
                placeholder="Product or service name"
              />
            </Field>
          )}
          <div className="form-grid">
            <Field label="Quantity">
              <input
                type="number"
                min="1"
                step="1"
                required
                className="input input-bordered"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </Field>
            <Field label="Sale date">
              <input
                type="date"
                required
                className="input input-bordered"
                value={form.soldAt}
                onChange={(e) => setForm({ ...form, soldAt: e.target.value })}
              />
            </Field>
          </div>
          <div className="form-grid">
            <Field label="Unit selling price (৳)">
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="input input-bordered"
                value={form.unitPrice}
                onChange={(e) =>
                  setForm({ ...form, unitPrice: e.target.value })
                }
              />
            </Field>
            <Field label="Unit product cost (৳)">
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="input input-bordered"
                value={form.unitCost}
                onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Note (optional)">
            <input
              className="input input-bordered"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Order ID, customer note…"
            />
          </Field>
          <div className="total-preview">
            <span>Sale total</span>
            <strong>{money(total)}</strong>
          </div>
          {mutation.isError && (
            <p className="error-text">
              {mutation.error.response?.data?.message ||
                "Could not record sale."}
            </p>
          )}
          <button
            className="btn btn-primary auth-submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving…" : "Save sale"}
          </button>
        </form>
      </Modal>
    </Page>
  );
}
function LedgerPage({ type }) {
  const toast = useToast();
  const config =
    type === "expenses"
      ? {
          title: "Expenses",
          eyebrow: "MONEY GOING OUT",
          description: "Keep your operating costs organised and visible.",
          url: "/expenses",
          date: "spentAt",
          empty: "No expenses recorded",
          hint: "Add costs like delivery, ads, packaging or subscriptions.",
          icon: Receipt,
          amountLabel: "Expense amount",
          nameLabel: "Expense title",
        }
      : {
          title: "Investments",
          eyebrow: "FUNDING YOUR BUSINESS",
          description: "Track the money you put into building your business.",
          url: "/investments",
          date: "investedAt",
          empty: "No investments recorded",
          hint: "Record your starting capital or additional owner funding.",
          icon: Wallet,
          amountLabel: "Investment amount",
          nameLabel: "Investment title",
        };
  const { data = [], isLoading } = useData(type, config.url),
    [open, setOpen] = useState(false),
    [form, setForm] = useState({
      title: "",
      category: "Marketing",
      amount: "",
      note: "",
      date: new Date().toISOString().slice(0, 10),
    });
  const mutation = useFormMutation(config.url),
    qc = useQueryClient();
  const del = useMutation({
    mutationFn: (id) => api.delete(`${config.url}/${id}`),
    onSuccess: () => {
      qc.invalidateQueries();
      toast("Item deleted successfully.", "success", "Deleted");
    },
    onError: (error) =>
      toast(
        error.response?.data?.message || "Could not delete this item.",
        "error",
      ),
  });
  const submit = async (e) => {
    e.preventDefault();
    try {
      await mutation.mutateAsync({
        title: form.title,
        category: form.category,
        amount: form.amount,
        note: form.note,
        [config.date]: new Date(`${form.date}T12:00:00`),
      });
      setOpen(false);
      setForm({
        title: "",
        category: "Marketing",
        amount: "",
        note: "",
        date: new Date().toISOString().slice(0, 10),
      });
    } catch {}
  };
  const total = data.reduce((s, x) => s + x.amount, 0);
  return (
    <Page>
      <Header
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        action={
          <button
            className="btn btn-primary action-btn"
            onClick={() => setOpen(true)}
          >
            <Plus size={17} /> Add{" "}
            {type === "expenses" ? "expense" : "investment"}
          </button>
        }
      />
      <div className="ledger-summary">
        <div className="ledger-icon">
          <config.icon size={22} />
        </div>
        <div>
          <span>Total {type === "expenses" ? "expenses" : "investment"}</span>
          <strong>{money(total)}</strong>
        </div>
        <span className="ledger-count">{data.length} entries</span>
      </div>
      <div className="content-card">
        <div className="table-wrap">
          <table className="table app-table">
            <thead>
              <tr>
                <th>Description</th>
                {type === "expenses" && <th>Category</th>}
                <th>Date</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((x) => (
                <tr key={x._id}>
                  <td>
                    <strong>{x.title}</strong>
                    {x.note && <small className="cell-sub">{x.note}</small>}
                  </td>
                  {type === "expenses" && (
                    <td>
                      <span className="category-pill">{x.category}</span>
                    </td>
                  )}
                  <td>{dateLabel(x[config.date])}</td>
                  <td className="amount-cell">{money(x.amount)}</td>
                  <td>
                    <button
                      className="icon-btn danger-hover"
                      onClick={() => {
                        if (
                          confirm(
                            `Delete this ${type === "expenses" ? "expense" : "investment"}?`,
                          )
                        )
                          del.mutate(x._id);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.length && !isLoading && (
            <Empty icon={config.icon} title={config.empty} text={config.hint} />
          )}
          {isLoading && <Loader />}
        </div>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Add ${type === "expenses" ? "expense" : "investment"}`}
      >
        <form onSubmit={submit} className="modal-form">
          <Field label={config.nameLabel}>
            <input
              className="input input-bordered"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={
                type === "expenses"
                  ? "e.g. Facebook ads"
                  : "e.g. Initial capital"
              }
            />
          </Field>
          {type === "expenses" && (
            <Field label="Category">
              <select
                className="select select-bordered"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {[
                  "Marketing",
                  "Delivery",
                  "Packaging",
                  "Salary",
                  "Rent",
                  "Software",
                  "Utilities",
                  "Other",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
          )}
          <div className="form-grid">
            <Field label={config.amountLabel + " (৳)"}>
              <input
                className="input input-bordered"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
            <Field label="Date">
              <input
                className="input input-bordered"
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Note (optional)">
            <input
              className="input input-bordered"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Add a short note"
            />
          </Field>
          {mutation.isError && (
            <p className="error-text">
              {mutation.error.response?.data?.message ||
                "Could not save entry."}
            </p>
          )}
          <button
            className="btn btn-primary auth-submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving…" : "Save entry"}
          </button>
        </form>
      </Modal>
    </Page>
  );
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function Customers() {
  const toast = useToast();
  const { data = [], isLoading } = useData("customers", "/customers"),
    [open, setOpen] = useState(false),
    [form, setForm] = useState({
      name: "",
      phone: "",
      email: "",
      address: "",
      note: "",
    }),
    [search, setSearch] = useState("");
  const mutation = useFormMutation("/customers"),
    qc = useQueryClient(),
    del = useMutation({
      mutationFn: (id) => api.delete(`/customers/${id}`),
      onSuccess: () => {
        qc.invalidateQueries();
        toast("Item deleted successfully.", "success", "Deleted");
      },
      onError: (error) =>
        toast(
          error.response?.data?.message || "Could not delete this item.",
          "error",
        ),
    });
  const submit = async (e) => {
    e.preventDefault();
    try {
      await mutation.mutateAsync(form);
      setOpen(false);
      setForm({ name: "", phone: "", email: "", address: "", note: "" });
    } catch {}
  };
  const filtered = data.filter((c) =>
    `${c.name} ${c.phone} ${c.email}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <Page>
      <Header
        eyebrow="CUSTOMER RELATIONSHIPS"
        title="Customers"
        description="Keep customer details and understand who keeps coming back."
        action={
          <button
            className="btn btn-primary action-btn"
            onClick={() => setOpen(true)}
          >
            <Plus size={17} /> Add customer
          </button>
        }
      />
      <div className="toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            placeholder="Search name, phone or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="result-count">{filtered.length} customers</span>
      </div>
      <div className="content-card">
        <div className="table-wrap">
          <table className="table app-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Orders</th>
                <th>Total spent</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id}>
                  <td>
                    <div className="table-product">
                      <span className="product-mini">
                        <UserRound size={16} />
                      </span>
                      <strong>{c.name}</strong>
                    </div>
                  </td>
                  <td>{c.phone || "—"}</td>
                  <td>{c.email || "—"}</td>
                  <td>{c.orderCount || 0}</td>
                  <td className="amount-cell">{money(c.totalSpent)}</td>
                  <td>
                    <button
                      className="icon-btn danger-hover"
                      onClick={() => {
                        if (
                          confirm(
                            "Delete this customer? Existing orders will be kept.",
                          )
                        )
                          del.mutate(c._id);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && !isLoading && (
            <Empty
              icon={Users}
              title="No customers yet"
              text="Add a customer to build your customer list."
            />
          )}
          {isLoading && <Loader />}
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Add customer">
        <form className="modal-form" onSubmit={submit}>
          <Field label="Customer name">
            <input
              className="input input-bordered"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <div className="form-grid">
            <Field label="Phone">
              <input
                className="input input-bordered"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className="input input-bordered"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Address">
            <input
              className="input input-bordered"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <Field label="Note">
            <input
              className="input input-bordered"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </Field>
          {mutation.isError && (
            <p className="error-text">
              {mutation.error.response?.data?.message ||
                "Could not save customer."}
            </p>
          )}
          <button
            className="btn btn-primary auth-submit"
            disabled={mutation.isPending}
          >
            Save customer
          </button>
        </form>
      </Modal>
    </Page>
  );
}
function Orders() {
  const toast = useToast();
  const { data: orders = [], isLoading } = useData("orders", "/orders"),
    { data: products = [] } = useData("products", "/products"),
    { data: customers = [] } = useData("customers", "/customers"),
    [open, setOpen] = useState(false),
    [form, setForm] = useState({
      customerId: "",
      customerName: "",
      customerPhone: "",
      productId: "",
      productName: "",
      quantity: "1",
      unitPrice: "",
      unitCost: "",
      discount: "0",
      deliveryFee: "0",
      status: "Pending",
      paymentStatus: "Unpaid",
      orderDate: new Date().toISOString().slice(0, 10),
      note: "",
    });
  const mutation = useFormMutation("/orders"),
    qc = useQueryClient(),
    patch = useMutation({
      mutationFn: ({ id, payload }) => api.patch(`/orders/${id}`, payload),
      onSuccess: () => {
        qc.invalidateQueries();
        toast("Item deleted successfully.", "success", "Deleted");
      },
      onError: (error) =>
        toast(
          error.response?.data?.message || "Could not delete this item.",
          "error",
        ),
    });
  const selectCustomer = (id) => {
    const c = customers.find((x) => x._id === id);
    setForm((f) => ({
      ...f,
      customerId: id,
      customerName: c?.name || "",
      customerPhone: c?.phone || "",
    }));
  };
  const selectProduct = (id) => {
    const p = products.find((x) => x._id === id);
    setForm((f) => ({
      ...f,
      productId: id,
      productName: p?.name || "",
      unitPrice: p?.price ?? "",
      unitCost: p?.cost ?? "",
    }));
  };
  const subtotal = Number(form.quantity || 0) * Number(form.unitPrice || 0),
    grand =
      subtotal - Number(form.discount || 0) + Number(form.deliveryFee || 0);
  const submit = async (e) => {
    e.preventDefault();
    try {
      await mutation.mutateAsync({
        customerId: form.customerId || undefined,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        items: [
          {
            productId: form.productId || undefined,
            productName: form.productName,
            quantity: Number(form.quantity),
            unitPrice: Number(form.unitPrice),
            unitCost: Number(form.unitCost),
          },
        ],
        discount: Number(form.discount),
        deliveryFee: Number(form.deliveryFee),
        status: form.status,
        paymentStatus: form.paymentStatus,
        orderDate: new Date(`${form.orderDate}T12:00:00`),
        note: form.note,
      });
      setOpen(false);
      setForm({
        customerId: "",
        customerName: "",
        customerPhone: "",
        productId: "",
        productName: "",
        quantity: "1",
        unitPrice: "",
        unitCost: "",
        discount: "0",
        deliveryFee: "0",
        status: "Pending",
        paymentStatus: "Unpaid",
        orderDate: new Date().toISOString().slice(0, 10),
        note: "",
      });
    } catch {}
  };
  const invoice = async (id) => {
    try {
      const r = await api.get(`/orders/${id}/invoice.pdf`, {
        responseType: "blob",
      });
      downloadBlob(r.data, `invoice-${id}.pdf`);
      toast("Invoice downloaded successfully.", "success", "Invoice ready");
    } catch (error) {
      toast(
        error.response?.data?.message || "Could not download the invoice.",
        "error",
      );
    }
  };
  return (
    <Page>
      <Header
        eyebrow="ORDER OPERATIONS"
        title="Orders"
        description="Create orders, follow delivery status and download customer invoices."
        action={
          <button
            className="btn btn-primary action-btn"
            onClick={() => setOpen(true)}
          >
            <Plus size={17} /> Create order
          </button>
        }
      />
      <div className="content-card">
        <div className="table-wrap">
          <table className="table app-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Order status</th>
                <th>Payment</th>
                <th>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td>
                    <strong>{o.orderNumber}</strong>
                  </td>
                  <td>{o.customerName}</td>
                  <td>{dateLabel(o.orderDate)}</td>
                  <td className="amount-cell">{money(o.total)}</td>
                  <td>
                    <select
                      className="mini-select"
                      value={o.status}
                      onChange={(e) =>
                        patch.mutate({
                          id: o._id,
                          payload: { status: e.target.value },
                        })
                      }
                    >
                      {[
                        "Pending",
                        "Processing",
                        "Shipped",
                        "Delivered",
                        "Cancelled",
                      ].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="mini-select"
                      value={o.paymentStatus}
                      onChange={(e) =>
                        patch.mutate({
                          id: o._id,
                          payload: { paymentStatus: e.target.value },
                        })
                      }
                    >
                      {["Unpaid", "Partial", "Paid"].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className="icon-btn"
                      title="Download PDF invoice"
                      onClick={() => invoice(o._id)}
                    >
                      <FileDown size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!orders.length && !isLoading && (
            <Empty
              icon={ClipboardList}
              title="No orders yet"
              text="Create your first order to manage fulfilment and invoices."
            />
          )}
          {isLoading && <Loader />}
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Create order">
        <form className="modal-form" onSubmit={submit}>
          <Field label="Choose existing customer">
            <select
              className="select select-bordered"
              value={form.customerId}
              onChange={(e) => selectCustomer(e.target.value)}
            >
              <option value="">New / walk-in customer</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.phone ? `· ${c.phone}` : ""}
                </option>
              ))}
            </select>
          </Field>
          {!form.customerId && (
            <div className="form-grid">
              <Field label="Customer name">
                <input
                  className="input input-bordered"
                  required
                  value={form.customerName}
                  onChange={(e) =>
                    setForm({ ...form, customerName: e.target.value })
                  }
                />
              </Field>
              <Field label="Phone">
                <input
                  className="input input-bordered"
                  value={form.customerPhone}
                  onChange={(e) =>
                    setForm({ ...form, customerPhone: e.target.value })
                  }
                />
              </Field>
            </div>
          )}
          <Field label="Product">
            <select
              className="select select-bordered"
              value={form.productId}
              onChange={(e) => selectProduct(e.target.value)}
            >
              <option value="">Custom / service</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} · stock {p.stock}
                </option>
              ))}
            </select>
          </Field>
          {!form.productId && (
            <Field label="Item name">
              <input
                className="input input-bordered"
                required
                value={form.productName}
                onChange={(e) =>
                  setForm({ ...form, productName: e.target.value })
                }
              />
            </Field>
          )}
          <div className="form-grid">
            <Field label="Quantity">
              <input
                className="input input-bordered"
                type="number"
                min="1"
                step="1"
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </Field>
            <Field label="Order date">
              <input
                className="input input-bordered"
                type="date"
                value={form.orderDate}
                onChange={(e) =>
                  setForm({ ...form, orderDate: e.target.value })
                }
              />
            </Field>
          </div>
          <div className="form-grid">
            <Field label="Unit price (৳)">
              <input
                className="input input-bordered"
                type="number"
                min="0"
                required
                value={form.unitPrice}
                onChange={(e) =>
                  setForm({ ...form, unitPrice: e.target.value })
                }
              />
            </Field>
            <Field label="Unit cost (৳)">
              <input
                className="input input-bordered"
                type="number"
                min="0"
                required
                value={form.unitCost}
                onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
              />
            </Field>
          </div>
          <div className="form-grid">
            <Field label="Discount (৳)">
              <input
                className="input input-bordered"
                type="number"
                min="0"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
              />
            </Field>
            <Field label="Delivery fee (৳)">
              <input
                className="input input-bordered"
                type="number"
                min="0"
                value={form.deliveryFee}
                onChange={(e) =>
                  setForm({ ...form, deliveryFee: e.target.value })
                }
              />
            </Field>
          </div>
          <div className="form-grid">
            <Field label="Order status">
              <select
                className="select select-bordered"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {[
                  "Pending",
                  "Processing",
                  "Shipped",
                  "Delivered",
                  "Cancelled",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field label="Payment status">
              <select
                className="select select-bordered"
                value={form.paymentStatus}
                onChange={(e) =>
                  setForm({ ...form, paymentStatus: e.target.value })
                }
              >
                {["Unpaid", "Partial", "Paid"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="total-preview">
            <span>Order total</span>
            <strong>{money(grand)}</strong>
          </div>
          {mutation.isError && (
            <p className="error-text">
              {mutation.error.response?.data?.message ||
                "Could not create order."}
            </p>
          )}
          <button
            className="btn btn-primary auth-submit"
            disabled={mutation.isPending}
          >
            Save order
          </button>
        </form>
      </Modal>
    </Page>
  );
}
function Reports() {
  const [year, setYear] = useState(new Date().getFullYear()),
    { data, isLoading } = useQuery({
      queryKey: ["monthly-report", year],
      queryFn: async () =>
        (await api.get(`/reports/monthly?year=${year}`)).data,
    });
  const exportExcel = async () => {
    const r = await api.get("/export.xlsx", { responseType: "blob" });
    downloadBlob(r.data, "bizledger-business-report.xlsx");
  };
  return (
    <Page>
      <Header
        eyebrow="FINANCIAL REPORTING"
        title="Monthly reports"
        description="Compare revenue, costs, investment and net profit month by month."
        action={
          <button className="btn btn-primary action-btn" onClick={exportExcel}>
            <FileSpreadsheet size={17} /> Export Excel
          </button>
        }
      />
      <div className="toolbar">
        <span className="result-count">12-month financial breakdown</span>
        <select
          className="select select-bordered year-select"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {Array.from(
            { length: 7 },
            (_, i) => new Date().getFullYear() - 5 + i,
          ).map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </div>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <div className="stats-grid">
            <StatCard
              label="Annual revenue"
              value={money(data?.totals.revenue)}
              sub="Sales revenue"
              icon={TrendingUp}
              tone="green"
            />
            <StatCard
              label="Annual profit / loss"
              value={money(data?.totals.profit)}
              sub="After recorded costs"
              icon={ChartNoAxesCombined}
              tone="purple"
            />
            <StatCard
              label="Operating expenses"
              value={money(data?.totals.expenses)}
              sub="All recorded expenses"
              icon={Receipt}
              tone="orange"
            />
            <StatCard
              label="Units sold"
              value={data?.totals.units || 0}
              sub={`${data?.totals.orders || 0} sales records`}
              icon={ShoppingCart}
              tone="blue"
            />
          </div>
          <div className="content-card report-card">
            <div className="card-heading">
              <div>
                <h3>Monthly financial breakdown</h3>
                <p>Amounts in Bangladeshi taka (৳)</p>
              </div>
              <span className="period-pill">{year}</span>
            </div>
            <div className="table-wrap">
              <table className="table app-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Revenue</th>
                    <th>Cost of goods</th>
                    <th>Expenses</th>
                    <th>Net profit / loss</th>
                    <th>Investment</th>
                    <th>Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.months.map((m) => (
                    <tr key={m.month}>
                      <td>
                        <strong>{m.month}</strong>
                      </td>
                      <td>{money(m.revenue)}</td>
                      <td>{money(m.cogs)}</td>
                      <td>{money(m.expenses)}</td>
                      <td
                        className={m.profit >= 0 ? "profit-cell" : "loss-cell"}
                      >
                        {money(m.profit)}
                      </td>
                      <td>{money(m.investment)}</td>
                      <td>{m.orders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Page>
  );
}
function Analytics() {
  const { data, isLoading } = useData("analytics", "/analytics");
  if (isLoading) return <Loader />;
  const max = Math.max(1, ...(data?.monthly || []).map((x) => x.revenue));
  return (
    <Page>
      <Header
        eyebrow="INSIGHTS & PERFORMANCE"
        title="Advanced analytics"
        description="Spot trends, understand profitability and see what's driving your business."
      />
      <div className="stats-grid">
        <StatCard
          label="Average order value"
          value={money(data.metrics.averageOrderValue)}
          sub="Average order total"
          icon={ShoppingCart}
          tone="blue"
        />
        <StatCard
          label="Profit margin"
          value={`${data.metrics.profitMargin.toFixed(1)}%`}
          sub="Recent six-month window"
          icon={TrendingUp}
          tone="green"
        />
        <StatCard
          label="Active products"
          value={data.metrics.activeProducts}
          sub={`${data.metrics.lowStock} low-stock items`}
          icon={Package}
          tone="purple"
        />
        <StatCard
          label="Customers"
          value={data.metrics.customers}
          sub={`${data.metrics.orders} total orders`}
          icon={Users}
          tone="orange"
        />
      </div>
      <div className="analytics-grid">
        <div className="content-card chart-card">
          <div className="card-heading">
            <div>
              <h3>Revenue trend</h3>
              <p>Last 6 months</p>
            </div>
            <span className="chart-legend">
              <i /> Revenue
            </span>
          </div>
          <div className="bar-chart">
            {data.monthly.map((m) => (
              <div className="bar-column" key={m.month}>
                <div className="bar-value">
                  {m.revenue ? money(m.revenue) : "—"}
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      height: `${Math.max(2, (m.revenue / max) * 100)}%`,
                    }}
                  />
                </div>
                <span>{m.month}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="content-card chart-card">
          <div className="card-heading">
            <div>
              <h3>Top products</h3>
              <p>Ranked by sales revenue</p>
            </div>
            <span className="period-pill">TOP 5</span>
          </div>
          {data.topProducts.length ? (
            data.topProducts.map((p, i) => (
              <div className="top-product-row" key={p.name}>
                <span className="rank-badge">{i + 1}</span>
                <div className="top-product-info">
                  <strong>{p.name}</strong>
                  <span>
                    {p.units} units · Profit {money(p.profit)}
                  </span>
                  <div className="top-product-track">
                    <i
                      style={{
                        width: `${Math.max(4, (p.revenue / Math.max(1, data.topProducts[0].revenue)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <strong className="top-product-revenue">
                  {money(p.revenue)}
                </strong>
              </div>
            ))
          ) : (
            <Empty
              icon={BarChart3}
              title="No product insights yet"
              text="Record sales to reveal your best-performing products."
            />
          )}
        </div>
      </div>
      <div className="insight-note">
        <Sparkles size={18} />
        <div>
          <strong>Keep your records consistent</strong>
          <p>
            Analytics are based on recorded sales, product costs and expenses.
            Add all business transactions for more reliable insights.
          </p>
        </div>
      </div>
    </Page>
  );
}

function Expenses() {
  return <LedgerPage type="expenses" />;
}
function Investments() {
  return <LedgerPage type="investments" />;
}

export default App;
