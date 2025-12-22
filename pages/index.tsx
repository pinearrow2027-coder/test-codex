import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

/* ===== Theme ===== */
const THEME = {
  skincare: { main: "#2563eb", soft: "#eff6ff", border: "#bfdbfe" }, // blue
  makeup: { main: "#f59e0b", soft: "#fffbeb", border: "#fde68a" }, // yellow
  ink: { main: "#111827" },
};

/* ===== Styles (no Tailwind) ===== */
const S: Record<string, React.CSSProperties> = {
  page: {
    padding: 20,
    background: "#f6f7fb",
    minHeight: "100vh",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    color: THEME.ink.main,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  h1: { fontSize: 24, fontWeight: 900, margin: 0 },
  badge: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "#111827",
    color: "#fff",
    fontWeight: 900,
    fontSize: 12,
  },
  card: {
    background: "#fff",
    border: "1px solid #eef2f7",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 1px 10px rgba(0,0,0,0.06)",
  },
  columns: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0,1fr))",
    gap: 14,
    marginTop: 12,
  },
  row: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  label: { fontSize: 12, color: "#6b7280", marginBottom: 6 },
  input: {
    width: 120,
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontSize: 14,
    background: "#fff",
  },
  slider: { width: 260 },
  button: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
  buttonGhost: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#111827",
    fontWeight: 900,
    cursor: "pointer",
  },
  hr: { height: 1, background: "#eef2f7", border: "none", margin: "12px 0" },
  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0,1fr))",
    gap: 10,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0,1fr))",
    gap: 12,
  },
  tabRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  tab: {
    padding: "7px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 12,
  },
  tabActive: {
    padding: "7px 10px",
    borderRadius: 999,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 12,
  },
  small: { fontSize: 12, color: "#6b7280" },
};

const fmt = {
  yenM: (n: number) => `¥${n.toFixed(1)}M`,
  int: (n: number) => `${Math.round(n).toLocaleString()}`,
  pct1: (n: number) => `${(n * 100).toFixed(1)}%`,
};

/* ===== demo model ===== */
function sat(x: number, k: number) {
  return 1 - Math.exp(-x / Math.max(1e-6, k));
}
type Inputs = { tv: number; digital: number; sns: number };

function calcSkincare({ tv, digital, sns }: Inputs) {
  const grp = 200 * sat(tv, 6) + 20 * tv;
  const reach = 180000 * sat(digital, 4) + 8000 * digital;
  const vcr = 0.18 + 0.10 * sat(sns, 8) + 0.05 * sat(digital, 10);

  const brandSearch = 12000 * sat(grp, 220) + 9000 * sat(reach / 10000, 8) + 2500 * sat(sns, 10);
  const ec = 0.55 * brandSearch + 900 * sat(digital, 3) + 600 * sat(sns, 8);
  const store = 0.25 * brandSearch + 700 * sat(tv, 4);
  const pdp = 0.75 * ec + 0.2 * store;

  const sales = (pdp * (0.02 + 0.01 * sat(vcr * 100, 22))) * 0.055 * (1.45 + 0.35 * sat(brandSearch / 10000, 2.5));
  const gm = 0.62;
  const profit = sales * gm;

  return { grp, reach, vcr, brandSearch, ec, store, pdp, sales, profit, gm };
}

function calcMakeup({ tv, digital, sns }: Inputs) {
  const grp = 170 * sat(tv, 5) + 18 * tv;
  const productSearch = 15000 * sat(digital, 3.8) + 5500 * sat(sns, 9) + 60 * grp;

  const ugc = 120 * sat(sns, 10) + 40 * sat(digital, 8);
  const searchVolume = 0.85 * productSearch + 35 * ugc;
  const creativeScore = 0.52 + 0.20 * sat(sns, 10) + 0.10 * sat(digital, 8);

  const sales = (searchVolume * 0.08) * (0.014 + 0.01 * sat(creativeScore * 100, 65)) * 0.022 * (1.10 + 0.55 * sat(ugc, 160));
  const gm = 0.58;
  const profit = sales * gm;

  return { grp, productSearch, ugc, searchVolume, creativeScore, sales, profit, gm };
}

function makeSeries(domain: "skincare" | "makeup", inputs: Inputs, mode: "asis" | "tobe") {
  return Array.from({ length: 30 }, (_, i) => {
    const t = i / 29;
    const wobble = 1 + 0.02 * Math.sin(i * 0.6) + 0.015 * Math.cos(i * 0.21);
    const drift = mode === "asis" ? 0.98 + 0.04 * t : 0.92 + 0.12 * t;

    const adj: Inputs = {
      tv: inputs.tv * drift * wobble,
      digital: inputs.digital * drift * wobble,
      sns: Math.max(0, inputs.sns * (0.95 + 0.10 * t)),
    };

    const out = domain === "skincare" ? calcSkincare(adj) : calcMakeup(adj);
    return { day: `D${String(i + 1).padStart(2, "0")}`, ...out };
  });
}

function recommend(domain: "skincare" | "makeup", budget: number) {
  let best = { tv: budget * 0.5, digital: budget * 0.5, sns: 8, profit: -Infinity };
  for (let r = 0; r <= 100; r += 2) {
    const tv = budget * (r / 100);
    const digital = budget - tv;
    for (let sns = 0; sns <= 30; sns += 1) {
      const out = domain === "skincare" ? calcSkincare({ tv, digital, sns }) : calcMakeup({ tv, digital, sns });
      if (out.profit > best.profit) best = { tv, digital, sns, profit: out.profit };
    }
  }
  return best;
}

/* ===== UI parts ===== */
function KPI({
  theme,
  title,
  value,
  hint,
}: {
  theme: { main: string; soft: string; border: string };
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <div style={{ borderRadius: 14, padding: 12, background: theme.soft, border: `1px solid ${theme.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: theme.main }} />
        <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 900 }}>{title}</div>
      </div>
      <div style={{ fontSize: 18, fontWeight: 900, marginTop: 6 }}>{value}</div>
      {hint ? <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>{hint}</div> : null}
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function Home() {
  const [totalBudget, setTotalBudget] = useState(12);
  const [splitSkincare, setSplitSkincare] = useState(50);

  const skincareBudget = totalBudget * (splitSkincare / 100);
  const makeupBudget = totalBudget - skincareBudget;

  const [modeSkincare, setModeSkincare] = useState<"asis" | "tobe">("asis");
  const [modeMakeup, setModeMakeup] = useState<"asis" | "tobe">("asis");

  const [skinTvRatio, setSkinTvRatio] = useState(45);
  const [skinSns, setSkinSns] = useState(8);

  const [makeTvRatio, setMakeTvRatio] = useState(35);
  const [makeSns, setMakeSns] = useState(10);

  const skincareInputs = useMemo<Inputs>(() => {
    const tv = skincareBudget * (skinTvRatio / 100);
    return { tv, digital: skincareBudget - tv, sns: skinSns };
  }, [skincareBudget, skinTvRatio, skinSns]);

  const makeupInputs = useMemo<Inputs>(() => {
    const tv = makeupBudget * (makeTvRatio / 100);
    return { tv, digital: makeupBudget - tv, sns: makeSns };
  }, [makeupBudget, makeTvRatio, makeSns]);

  const sk = useMemo(() => calcSkincare(skincareInputs), [skincareInputs]);
  const mk = useMemo(() => calcMakeup(makeupInputs), [makeupInputs]);

  const recSk = useMemo(() => recommend("skincare", skincareBudget), [skincareBudget]);
  const recMk = useMemo(() => recommend("makeup", makeupBudget), [makeupBudget]);

  const skSeries = useMemo(() => makeSeries("skincare", skincareInputs, modeSkincare), [skincareInputs, modeSkincare]);
  const mkSeries = useMemo(() => makeSeries("makeup", makeupInputs, modeMakeup), [makeupInputs, modeMakeup]);

  const [skMetric, setSkMetric] = useState<"profit" | "sales" | "brandSearch" | "ec" | "pdp" | "grp" | "reach" | "vcr">("profit");
  const [mkMetric, setMkMetric] = useState<"profit" | "sales" | "ugc" | "searchVolume" | "creativeScore" | "grp" | "productSearch">("profit");

  const applySk = () => {
    setSkinTvRatio(clamp((recSk.tv / Math.max(1e-6, skincareBudget)) * 100, 0, 100));
    setSkinSns(recSk.sns);
    setModeSkincare("tobe");
  };

  const applyMk = () => {
    setMakeTvRatio(clamp((recMk.tv / Math.max(1e-6, makeupBudget)) * 100, 0, 100));
    setMakeSns(recMk.sns);
    setModeMakeup("tobe");
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.h1}>投資配分ダッシュボード</h1>
        <div style={S.badge}>最適化 → 適用</div>
      </div>

      {/* 全体設定 */}
      <div style={S.card}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>全体設定</div>
        <div style={S.row}>
          <div>
            <div style={S.label}>総予算（M円）</div>
            <input style={S.input} type="number" min={0} step={0.1} value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value || 0))} />
          </div>

          <div style={{ minWidth: 360 }}>
            <div style={S.label}>
              領域配分：スキンケア <b>{splitSkincare}%</b> / メイク <b>{100 - splitSkincare}%</b>
            </div>
            <input style={S.slider} type="range" min={0} max={100} step={1} value={splitSkincare}
              onChange={(e) => setSplitSkincare(Number(e.target.value))} />
            <div style={S.small}>スキンケア {fmt.yenM(skincareBudget)} ／ メイク {fmt.yenM(makeupBudget)}</div>
          </div>
        </div>
      </div>

      <div style={S.columns}>
        {/* スキンケア */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 900, color: THEME.skincare.main }}>● スキンケア（LTV重視）</div>
            <div style={S.tabRow}>
              <button style={modeSkincare === "asis" ? S.tabActive : S.tab} onClick={() => setModeSkincare("asis")}>AS-IS</button>
              <button style={modeSkincare === "tobe" ? S.tabActive : S.tab} onClick={() => setModeSkincare("tobe")}>TO-BE</button>
            </div>
          </div>

          <hr style={S.hr} />

          <div style={S.row}>
            <div>
              <div style={S.label}>予算（固定）</div>
              <div style={{ fontWeight: 900 }}>{fmt.yenM(skincareBudget)}</div>
            </div>

            <div style={{ minWidth: 320 }}>
              <div style={S.label}>TV比率（残りがデジ）: <b>{skinTvRatio}%</b></div>
              <input style={S.slider} type="range" min={0} max={100} step={1} value={skinTvRatio}
                onChange={(e) => { setSkinTvRatio(Number(e.target.value)); setModeSkincare("tobe"); }} />
              <div style={S.small}>TV {fmt.yenM(skincareInputs.tv)} ／ デジ {fmt.yenM(skincareInputs.digital)}</div>
            </div>

            <div>
              <div style={S.label}>SNS投稿（本/週）</div>
              <input style={S.input} type="number" min={0} max={30} step={1} value={skinSns}
                onChange={(e) => { setSkinSns(Number(e.target.value || 0)); setModeSkincare("tobe"); }} />
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button style={S.button} onClick={applySk}>推奨配分を入力に適用</button>
              <button style={S.buttonGhost} onClick={() => { setSkinTvRatio(45); setSkinSns(8); setModeSkincare("tobe"); }}>リセット</button>
            </div>
          </div>

          <hr style={S.hr} />

          <div style={{ fontWeight: 900, marginBottom: 8 }}>KPI</div>
          <div style={S.grid4}>
            <KPI theme={THEME.skincare} title="TV：GRP（上流）" value={fmt.int(sk.grp)} />
            <KPI theme={THEME.skincare} title="デジ：ビューアブルリーチ（上流）" value={fmt.int(sk.reach)} />
            <KPI theme={THEME.skincare} title="デジ：完全視聴率（上流）" value={fmt.pct1(sk.vcr)} />
            <KPI theme={THEME.skincare} title="ブランド検索数（中流）" value={fmt.int(sk.brandSearch)} />
          </div>
          <div style={{ ...S.grid4, marginTop: 10 }}>
            <KPI theme={THEME.skincare} title="EC送客数（中流）" value={fmt.int(sk.ec)} />
            <KPI theme={THEME.skincare} title="店頭送客数（中流）" value={fmt.int(sk.store)} />
            <KPI theme={THEME.skincare} title="商品詳細ページ流入（中流）" value={fmt.int(sk.pdp)} />
            <KPI theme={THEME.skincare} title="粗利（proxy）" value={fmt.yenM(sk.profit)} hint={`売上 ${fmt.yenM(sk.sales)} / 粗利率 ${(sk.gm * 100).toFixed(0)}%`} />
          </div>

          <hr style={S.hr} />

          <div style={S.grid2}>
            {/* 推奨（白地） */}
            <div style={{ borderRadius: 14, padding: 12, background: "#fff", border: `1px solid ${THEME.skincare.border}`, borderLeft: `6px solid ${THEME.skincare.main}` }}>
              <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 900 }}>推奨（粗利最大）</div>
              <div style={{ marginTop: 6, fontWeight: 900 }}>
                TV {fmt.yenM(recSk.tv)} / デジ {fmt.yenM(recSk.digital)} / SNS {recSk.sns}本/週
              </div>
              <div style={{ marginTop: 8, ...S.small }}>推奨粗利 {fmt.yenM(recSk.profit)}</div>
            </div>

            <div style={{ background: "#fff", borderRadius: 14, padding: 12, border: "1px solid #eef2f7" }}>
              <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 900 }}>チャート表示項目</div>
              <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(["profit","sales","brandSearch","ec","pdp","grp","reach","vcr"] as const).map((k) => (
                  <button key={k} style={skMetric === k ? S.tabActive : S.tab} onClick={() => setSkMetric(k)}>{k}</button>
                ))}
              </div>
            </div>
          </div>

          {/* グラフ（白地） */}
          <div style={{ marginTop: 12, background: "#fff", borderRadius: 14, padding: 12, border: `1px solid ${THEME.skincare.border}`, borderLeft: `6px solid ${THEME.skincare.main}` }}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={skSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={skMetric} name={skMetric} stroke={THEME.skincare.main} strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div style={S.small}>※ {modeSkincare.toUpperCase()} の30日傾向（デモ）</div>
          </div>
        </div>

        {/* メイク */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 900, color: THEME.makeup.main }}>● メイク（商品ヒット重視）</div>
            <div style={S.tabRow}>
              <button style={modeMakeup === "asis" ? S.tabActive : S.tab} onClick={() => setModeMakeup("asis")}>AS-IS</button>
              <button style={modeMakeup === "tobe" ? S.tabActive : S.tab} onClick={() => setModeMakeup("tobe")}>TO-BE</button>
            </div>
          </div>

          <hr style={S.hr} />

          <div style={S.row}>
            <div>
              <div style={S.label}>予算（固定）</div>
              <div style={{ fontWeight: 900 }}>{fmt.yenM(makeupBudget)}</div>
            </div>

            <div style={{ minWidth: 320 }}>
              <div style={S.label}>TV比率（残りがデジ）: <b>{makeTvRatio}%</b></div>
              <input style={S.slider} type="range" min={0} max={100} step={1} value={makeTvRatio}
                onChange={(e) => { setMakeTvRatio(Number(e.target.value)); setModeMakeup("tobe"); }} />
              <div style={S.small}>TV {fmt.yenM(makeupInputs.tv)} ／ デジ {fmt.yenM(makeupInputs.digital)}</div>
            </div>

            <div>
              <div style={S.label}>SNS投稿（本/週）</div>
              <input style={S.input} type="number" min={0} max={30} step={1} value={makeSns}
                onChange={(e) => { setMakeSns(Number(e.target.value || 0)); setModeMakeup("tobe"); }} />
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button style={S.button} onClick={applyMk}>推奨配分を入力に適用</button>
              <button style={S.buttonGhost} onClick={() => { setMakeTvRatio(35); setMakeSns(10); setModeMakeup("tobe"); }}>リセット</button>
            </div>
          </div>

          <hr style={S.hr} />

          <div style={{ fontWeight: 900, marginBottom: 8 }}>KPI</div>
          <div style={S.grid4}>
            <KPI theme={THEME.makeup} title="TV：GRP（上流）" value={fmt.int(mk.grp)} />
            <KPI theme={THEME.makeup} title="デジ：商品検索数（上流）" value={fmt.int(mk.productSearch)} />
            <KPI theme={THEME.makeup} title="UGC数（中流）" value={fmt.int(mk.ugc)} />
            <KPI theme={THEME.makeup} title="商品検索量（中流）" value={fmt.int(mk.searchVolume)} />
          </div>
          <div style={{ ...S.grid4, marginTop: 10 }}>
            <KPI theme={THEME.makeup} title="クリエイティブ評価（中流）" value={fmt.pct1(mk.creativeScore)} hint="0〜100%相当（デモ）" />
            <KPI theme={THEME.makeup} title="売上（proxy）" value={fmt.yenM(mk.sales)} />
            <KPI theme={THEME.makeup} title="粗利（proxy）" value={fmt.yenM(mk.profit)} hint={`粗利率 ${(mk.gm * 100).toFixed(0)}%`} />
            <KPI theme={THEME.makeup} title="SNS投稿（入力）" value={`${makeSns} 本/週`} />
          </div>

          <hr style={S.hr} />

          <div style={S.grid2}>
            <div style={{ borderRadius: 14, padding: 12, background: "#fff", border: `1px solid ${THEME.makeup.border}`, borderLeft: `6px solid ${THEME.makeup.main}` }}>
              <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 900 }}>推奨（粗利最大）</div>
              <div style={{ marginTop: 6, fontWeight: 900 }}>
                TV {fmt.yenM(recMk.tv)} / デジ {fmt.yenM(recMk.digital)} / SNS {recMk.sns}本/週
              </div>
              <div style={{ marginTop: 8, ...S.small }}>推奨粗利 {fmt.yenM(recMk.profit)}</div>
            </div>

            <div style={{ background: "#fff", borderRadius: 14, padding: 12, border: "1px solid #eef2f7" }}>
              <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 900 }}>チャート表示項目</div>
              <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(["profit","sales","ugc","searchVolume","creativeScore","grp","productSearch"] as const).map((k) => (
                  <button key={k} style={mkMetric === k ? S.tabActive : S.tab} onClick={() => setMkMetric(k)}>{k}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, background: "#fff", borderRadius: 14, padding: 12, border: `1px solid ${THEME.makeup.border}`, borderLeft: `6px solid ${THEME.makeup.main}` }}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={mkSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={mkMetric} name={mkMetric} stroke={THEME.makeup.main} strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div style={S.small}>※ {modeMakeup.toUpperCase()} の30日傾向（デモ）</div>
          </div>
        </div>
      </div>
    </div>
  );
}
