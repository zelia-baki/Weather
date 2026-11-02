// ── PUBLIC QR TRACEABILITY PAGE ──────────────────────────────────────────────
// Farmer phone numbers are shown in full (client request); CIN / national ID never.
// Where a printed QR receipt lands (/trace/<hash>). The QR holds only this short
// link, so it stays easy to scan; every detail (farms, crops, grade, warehouse)
// is served here by GET /api/qrcode/public/<hash>. No account, no token.
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  ShieldCheck, ShieldAlert, Loader2, Sprout, MapPin, Warehouse, Users,
  Package, CalendarDays, Phone, ExternalLink, Trees, BadgeCheck, Scale,
} from "lucide-react";
import { googleFontsUrl } from "../../../theme";

// Deliberately NOT axiosInstance: it attaches a token and may redirect on 401.
const API = import.meta.env.VITE_API_BASE_URL || "";

const C = {
  bg: "#f7f4ee", ink: "#14231a", muted: "#5b6b60", line: "rgba(20,35,26,0.12)",
  green: "#16803c", greenSoft: "rgba(22,128,60,0.08)", clay: "#8a5a32", rust: "#a03b2e",
};
const sans = { fontFamily: "'Epilogue', system-ui, sans-serif" };
const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" };
const mono = { fontFamily: "'Space Mono', ui-monospace, monospace" };

const TYPE_LABEL = {
  produce: "Produce transaction",
  fertilizer: "Agro-input transaction",
  conservation: "Tree cutting (conservation)",
  export: "Export lot",
};

const LABELS = {
  produce_weight: "Total weight", agroinput_weight: "Total weight",
  price_per_kg: "Price per kg", total_value: "Total value", total_price: "Total price",
  down_payment_amount: "Down payment", balance: "Balance", payment_type: "Payment",
  season: "Season", country_of_origin: "Country of origin", transaction_date: "Transaction date",
  destination_country: "Destination", channel_partner: "Channel partner",
  end_customer_name: "End customer", farmergroup_id: "Farmer group", coffeeType: "Coffee type",
  hscode: "HS code", geolocation: "Geolocation", agroInputType: "Agro-input type",
  agroInputCategory: "Category", agroInputSubCategory: "Level",
  application_date: "Application date", application_rate: "Application rate (kg/acre)",
  forest_name: "Forest", tree_type: "Tree type", date_cutting: "Date of cutting",
  gps_coordinates: "GPS", height: "Height (m)", diameter: "Diameter (cm)",
};
// Already shown in a dedicated card
const SHOWN_ELSEWHERE = new Set([
  "batch_number", "produceCategory", "crop_category", "crop", "Crop_grade", "crop_grade",
  "store_name", "forest_id",
]);
const MONEY = new Set(["price_per_kg", "total_value", "total_price", "down_payment_amount", "balance"]);
const WEIGHT = new Set(["produce_weight", "agroinput_weight"]);

const humanize = (k) =>
  LABELS[k] || k.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^\w/, (c) => c.toUpperCase());

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: 2 }) : v;
};
const formatValue = (k, v) => {
  if (MONEY.has(k)) return `${num(v)} UGX`;
  if (WEIGHT.has(k)) return `${num(v)} kg`;
  if (k === "payment_type") return String(v).replace(/_/g, " ");
  if (/date|cutting/i.test(k)) return date(v) || String(v);
  return String(v);
};
function date(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
const mapsLink = (geo) => {
  const m = String(geo || "").match(/(-?\d+(?:\.\d+)?)\s*[,; ]\s*(-?\d+(?:\.\d+)?)/);
  return m ? `https://www.openstreetmap.org/?mlat=${m[1]}&mlon=${m[2]}#map=15/${m[1]}/${m[2]}` : null;
};

// ── Small building blocks ─────────────────────────────────────────────────────
const Card = ({ icon: Icon, title, children, aside }) => (
  <section className="rounded-2xl bg-white p-5 sm:p-6" style={{ border: `1px solid ${C.line}` }}>
    <header className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold" style={{ color: C.ink }}>
        <Icon aria-hidden="true" className="h-5 w-5 shrink-0" style={{ color: C.green }} />
        {title}
      </h2>
      {aside}
    </header>
    {children}
  </section>
);

const Field = ({ label, children }) =>
  children === null || children === undefined || children === "" ? null : (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide" style={{ color: C.muted }}>{label}</dt>
      <dd className="mt-0.5 break-words text-[15px] font-medium" style={{ color: C.ink }}>{children}</dd>
    </div>
  );

const Pill = ({ children, tone = "green" }) => (
  <span
    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
    style={tone === "green"
      ? { background: C.greenSoft, color: C.green }
      : { background: "rgba(138,90,50,0.1)", color: C.clay }}
  >
    {children}
  </span>
);

// ── Farm card ─────────────────────────────────────────────────────────────────
const FarmCard = ({ farm, index }) => {
  const map = mapsLink(farm.geolocation);
  return (
    <article className="rounded-xl p-4" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs" style={{ color: C.muted }}>Farm {index + 1}</p>
          <h3 className="text-base font-semibold" style={{ color: C.ink }}>
            {farm.name || "Farm not found in the registry"}
          </h3>
          <p className="text-xs" style={{ ...mono, color: C.muted }}>{farm.farm_id}</p>
        </div>
        {farm.quantity_kg ? <Pill><Scale aria-hidden="true" className="h-3.5 w-3.5" />{num(farm.quantity_kg)} kg</Pill> : null}
      </div>

      {!farm.unknown && (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
          <Field label="District">{[farm.district, farm.region].filter(Boolean).join(", ") || null}</Field>
          <Field label="Sub-county">{farm.subcounty}</Field>
          <Field label="Farmer group">{farm.farmer_group}</Field>
          <Field label="Country">{farm.country}</Field>
          <Field label="Gender">{farm.gender}</Field>
          <Field label="Phone">
            {farm.phone && (
              <a href={`tel:${farm.phone.replace(/[^\d+]/g, "")}`}
                 className="inline-flex min-h-[44px] items-center gap-1 underline underline-offset-2"
                 style={{ ...mono, color: C.green }}>
                <Phone aria-hidden="true" className="h-3.5 w-3.5" />{farm.phone}
              </a>
            )}
          </Field>
          <div className="col-span-2">
            <Field label="Geolocation">
              {farm.geolocation && (map ? (
                <a href={map} target="_blank" rel="noopener noreferrer"
                   className="inline-flex min-h-[44px] items-center gap-1.5 underline underline-offset-2"
                   style={{ color: C.green }}>
                  <MapPin aria-hidden="true" className="h-4 w-4" />{farm.geolocation}
                  <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                  <span className="sr-only">(opens a map in a new tab)</span>
                </a>
              ) : farm.geolocation)}
            </Field>
          </div>
        </dl>
      )}

      {farm.crops?.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
            Crops recorded on this farm
          </p>
          <ul className="space-y-2">
            {farm.crops.map((c, i) => (
              <li key={i} className="rounded-lg bg-white p-3" style={{ border: `1px solid ${C.line}` }}>
                <p className="flex items-center gap-1.5 font-semibold" style={{ color: C.ink }}>
                  <Sprout aria-hidden="true" className="h-4 w-4" style={{ color: C.green }} />
                  {c.crop || "Crop"}
                  {c.season ? <span className="text-xs font-normal" style={{ color: C.muted }}>· Season {c.season}</span> : null}
                </p>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <Field label="Land type">{c.land_type}</Field>
                  <Field label="Tilled land">{c.tilled_land_size != null ? `${num(c.tilled_land_size)} acres` : null}</Field>
                  <Field label="Planted">{date(c.planting_date)}</Field>
                  <Field label="Harvested">{date(c.harvest_date)}</Field>
                  <Field label="Expected yield">{c.expected_yield != null ? `${num(c.expected_yield)} kg` : null}</Field>
                  <Field label="Actual yield">{c.actual_yield != null ? `${num(c.actual_yield)} kg` : null}</Field>
                  <Field label="Quality">{c.quality}</Field>
                  <Field label="Trees">{c.number_of_trees != null ? num(c.number_of_trees) : null}</Field>
                  <Field label="HS code">{c.hs_code}</Field>
                </dl>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function QrTrace() {
  const { hash } = useParams();
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let alive = true;
    setState({ loading: true, data: null, error: null });
    axios.get(`${API}/api/qrcode/public/${encodeURIComponent(hash || "")}`)
      .then((r) => alive && setState({ loading: false, data: r.data, error: null }))
      .catch((e) => alive && setState({
        loading: false, data: null,
        error: e.response?.data?.error || "We could not reach Nkusu. Check your connection and try again.",
      }));
    return () => { alive = false; };
  }, [hash]);

  const { loading, data, error } = state;
  const details = data
    ? Object.entries(data.details || {}).filter(([k, v]) => !SHOWN_ELSEWHERE.has(k) && typeof v !== "object")
    : [];

  return (
    <div className="min-h-screen" style={{ ...sans, background: C.bg, color: C.ink }}>
      <link rel="stylesheet" href={googleFontsUrl} />
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:pt-10">
        <div className="mb-6 flex items-center gap-3">
          <img src="https://www.nkusu.com/parrotlogo.png" alt="" width="40" height="40" className="h-10 w-10" />
          <div>
            <p className="text-sm font-semibold tracking-wide" style={{ color: C.green }}>NKUSU DIGITAL STAMPS</p>
            <p className="text-xs" style={{ color: C.muted }}>Traceability record</p>
          </div>
        </div>

        {loading && (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3" role="status">
            <Loader2 aria-hidden="true" className="h-8 w-8 animate-spin motion-reduce:animate-none" style={{ color: C.green }} />
            <p style={{ color: C.muted }}>Loading the record…</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl p-6" role="alert"
               style={{ background: "rgba(160,59,46,0.06)", border: `1px solid ${C.rust}` }}>
            <p className="flex items-center gap-2 text-lg font-semibold" style={{ color: C.rust }}>
              <ShieldAlert aria-hidden="true" className="h-6 w-6" /> Record not found
            </p>
            <p className="mt-2" style={{ color: C.ink }}>{error}</p>
            <p className="mt-2 text-sm" style={{ color: C.muted }}>
              If this QR is printed on a receipt, the receipt may not have been issued through Nkusu.
            </p>
          </div>
        )}

        {data && (
          <div className="space-y-4">
            {/* Hero */}
            <section className="rounded-2xl p-5 sm:p-6" style={{ background: C.green, color: "#fff" }}>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck aria-hidden="true" className="h-5 w-5" /> Registered on Nkusu
              </p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl" style={serif}>
                {data.product?.crop || TYPE_LABEL[data.type] || "Digital receipt"}
                {data.product?.grade ? <span className="opacity-80"> · Grade {data.product.grade}</span> : null}
              </h1>
              <p className="mt-1 text-sm opacity-90">{data.description || TYPE_LABEL[data.type]}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <div><dt className="opacity-75">Batch</dt><dd className="font-semibold">No. {data.batch_number || "—"}</dd></div>
                <div><dt className="opacity-75">Issued</dt><dd className="font-semibold">{date(data.issued_at) || "—"}</dd></div>
                {data.issuer && <div className="col-span-2 sm:col-span-1"><dt className="opacity-75">Issued by</dt><dd className="font-semibold">{data.issuer}</dd></div>}
              </dl>
            </section>

            {/* Product */}
            {(data.product?.crop || data.product?.category || data.product?.grade) && (
              <Card icon={Package} title="Product">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="Category">{data.product.category}</Field>
                  <Field label="Crop">{data.product.crop}</Field>
                  <Field label="Variety">{data.product.variety}</Field>
                  <Field label="Grade">{data.product.grade}</Field>
                  <div className="col-span-2"><Field label="Grade description">{data.product.grade_description}</Field></div>
                </dl>
              </Card>
            )}

            {/* Farms */}
            {data.farms?.length > 0 && (
              <Card icon={Users} title={`Origin farms (${data.farms.length})`}>
                <div className="space-y-3">
                  {data.farms.map((f, i) => <FarmCard key={`${f.farm_id}-${i}`} farm={f} index={i} />)}
                </div>
              </Card>
            )}

            {/* Forest */}
            {data.forest && (
              <Card icon={Trees} title="Forest">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="Name">{data.forest.name}</Field>
                  <Field label="Tree type">{data.forest.tree_type}</Field>
                  <Field label="Country">{data.forest.country}</Field>
                </dl>
              </Card>
            )}

            {/* Transaction details */}
            {details.length > 0 && (
              <Card icon={CalendarDays} title="Transaction details">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {details.map(([k, v]) => <Field key={k} label={humanize(k)}>{formatValue(k, v)}</Field>)}
                </dl>
              </Card>
            )}

            {/* Warehouse */}
            {data.store && (
              <Card icon={Warehouse} title="Warehouse / store"
                    aside={data.store.certified ? <Pill><BadgeCheck aria-hidden="true" className="h-3.5 w-3.5" />Certified</Pill> : null}>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="Name">{data.store.name}</Field>
                  <Field label="Code">{data.store.code && <span style={mono}>{data.store.code}</span>}</Field>
                  <Field label="Location">{data.store.location}</Field>
                  <Field label="District">{data.store.district}</Field>
                  <Field label="Country">{data.store.country}</Field>
                  <Field label="Type">{data.store.type}</Field>
                  <Field label="Phone">{data.store.phone && <a href={`tel:${data.store.phone}`} className="underline" style={{ color: C.green }}>{data.store.phone}</a>}</Field>
                  <Field label="Email">{data.store.email && <a href={`mailto:${data.store.email}`} className="break-all underline" style={{ color: C.green }}>{data.store.email}</a>}</Field>
                </dl>
              </Card>
            )}

            <p className="pt-2 text-center text-xs" style={{ color: C.muted }}>
              Record <span style={mono}>{data.hash}</span>
              <br />Powered by Nkusu.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
