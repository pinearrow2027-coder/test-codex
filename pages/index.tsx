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

/* =====================
  色（意味づけ）
===================== */
const COLORS = {
  tv: "#f97316",
  digital: "#2563eb",
  sns: "#ec4899",       // SNS投稿（企業）
  search: "#7c3aed",
  tweets: "#22c55e",   // UGC
  sales: "#111827",
  profit: "#16a34a",
  base: "#94a3b8",
  future: "#60a5fa",
  bg: "#f4f6fb",
};

const yen = (n: number) => "¥" + Math.round(n).toLocaleString();
const num = (n: number) => Math.round(n).toLocaleString();

/* =====================
  UI部品
===================== */
function Card({
  title,
  children,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 8px 20px rgba(0,0,0,.06)",
        borderTop: accent ? `4px solid ${accent}` : undefined,
      }}
    >
      <div style={{ fontWeight: 900, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function KpiBox({
  label,
  value,
  delta,
  color,
}: {
  label: string;
  value: string;
  delta?: string;
  color: string;
}) {
  const isNeg = delta?.startsWith("-");
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: 16,
        borderTop: `4px solid ${color}`,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900 }}>{value}</div>
      {delta && (
        <div
          style={{
            marginTop: 6,
            fontSize: 13,
            fontWeight: 900,
            color: isNeg ? "#b00020" : "#0a7a3d",
          }}
        >
          {delta} <span style={{ opacity: 0.6 }}>（差分）</span>
        </div>
      )}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  color,
  formatter,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  color: string;
  formatter?: (v: number) => string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
        <strong>{label}</strong>
        <span>{formatter ? formatter(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color }}
      />
    </div>
  );
}

/* =====================
  ダミー係数（説明用）
===================== */
const COEF = {
  tv_to_search: 0.02,
  digital_to_search: 0.06,
  sns_to_search: 25,        // 投稿1本→検索増
  tv_to_tweets: 0.000001,
  digital_to_tweets: 0.000002,
  sns_to_tweets: 18,        // 投稿1本→UGC増
  search_to_sales: 180,
  tweets_to_sales: 900,
  base_margin: 0.28,
  max_margin_bonus: 0.1,
};

function diminishing(x: number, scale: number) {
  return 1 - Math.exp(-x / scale);
}

/* =====================
  未来予測生成
===================== */
function buildForecast({
  days,
  tvBudget,
  digitalBudget,
  snsPosts,
}: {
  days: number;
  tvBudget: number;
  digitalBudget: number;
  snsPosts: number;
}) {
  const tvPerDay = tvBudget / days;
  const digitalPerDay = digitalBudget / days;
  const snsPerDay = snsPosts / days;

  const tvEff = diminishing(tvBudget, 20_000_000);
  const digitalEff = diminishing(digitalBudget, 10_000_000);

  const baseSearch = 6000;
  const baseTweets = 300;

  const rows = Array.from({ length: days }, (_, i) => {
    const day = `D${String(i + 1).padStart(2, "0")}`;
    const wobble = 0.95 + (i % 7) * 0.01;

    const search =
      baseSearch +
      tvPerDay * COEF.tv_to_search * tvEff +
      digitalPerDay * COEF.digital_to_search * digitalEff +
      snsPerDay * COEF.sns_to_search;

    const tweets =
      baseTweets +
      tvPerDay * COEF.tv_to_tweets * tvEff +
      digitalPerDay * COEF.digital_to_tweets * digitalEff +
      snsPerDay * COEF.sns_to_tweets;

    const sales = (search * COEF.search_to_sales + tweets * COEF.tweets_to_sales) * wobble;

    const share = digitalBudget / (tvBudget + digitalBudget);
    const margin = COEF.base_margin + COEF.max_margin_bonus * share;
    const profit = sales * margin;

    return { day, search, tweets, sales, profit };
  });

  const sum = rows.reduce(
    (a, r) => {
      a.search += r.search;
      a.tweets += r.tweets;
      a.sales += r.sales;
      a.profit += r.profit;
      return a;
    },
    { search: 0, tweets: 0, sales: 0, profit: 0 }
  );

  return { rows, sum };
}

const diff = (a: number, b: number, f: (n: number) => string) =>
  `${b - a >= 0 ? "+" : "-"}${f(Math.abs(b - a))}`;

/* =====================
  メイン
===================== */
export default function Home() {
  /* A：固定の現状（比較基準） */
  const baseline = {
    tv: 18_000_000,
    digital: 8_000_000,
    sns: 120, // 月間投稿数（現状）
    days: 30,
  };

  /* 将来（可変） */
  const [tv, setTv] = useState(13_500_000);
  const [digital, setDigital] = useState(9_000_000);
  const [sns, setSns] = useState(180);
  const [days, setDays] = useState(30);

  const base = useMemo(
    () =>
      buildForecast({
        days: baseline.days,
        tvBudget: baseline.tv,
        digitalBudget: baseline.digital,
        snsPosts: baseline.sns,
      }),
    []
  );

  const future = useMemo(
    () =>
      buildForecast({
        days,
        tvBudget: tv,
        digitalBudget: digital,
        snsPosts: sns,
      }),
    [tv, digital, sns, days]
  );

  return (
    <main style={{ padding: 24, background: COLORS.bg, minHeight: "100vh", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>投資配分シミュレーター（未来予測）</h1>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>
        TV/デジタル投資とSNS投稿数（企業施策）を入力すると、検索・UGC（ツイート）・売上・粗利がどう変わるかを予測します（ダミーモデル）。
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16 }}>
        {/* 左：入力 */}
        <Card title="入力：将来の投資・施策" accent={COLORS.future}>
          <Slider label="テレビ投資" value={tv} min={0} max={30_000_000} step={500_000} onChange={setTv} color={COLORS.tv} formatter={yen} />
          <Slider label="デジタル投資" value={digital} min={0} max={30_000_000} step={500_000} onChange={setDigital} color={COLORS.digital} formatter={yen} />
          <Slider label="SNS投稿数（月）" value={sns} min={0} max={300} step={10} onChange={setSns} color={COLORS.sns} formatter={(v) => `${v}本`} />
          <Slider label="予測期間（日）" value={days} min={7} max={60} step={1} onChange={setDays} color="#111827" formatter={(v) => `${v}日`} />

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>
            <strong>現状（固定・比較基準）</strong><br />
            TV {yen(baseline.tv)} / デジタル {yen(baseline.digital)} / SNS投稿 {baseline.sns}本（{baseline.days}日）
          </div>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>
            <strong>モデル（ダミー）意図</strong><br />
            ・TV：話題/検索の「土台」を作るが、増やすほど逓減<br />
            ・デジタル：検索へ効率良く効く（粗利率も押し上げる想定）<br />
            ・SNS投稿：検索とUGC（ツイート）を押し上げる
          </div>
        </Card>

        {/* 右：差分KPI＋グラフ */}
        <div style={{ display: "grid", gridTemplateRows: "auto auto", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            <KpiBox
              label={`検索数（合計/${days}日）`}
              value={num(future.sum.search)}
              delta={diff(base.sum.search, future.sum.search, num)}
              color={COLORS.search}
            />
            <KpiBox
              label={`ツイート数（UGC/合計${days}日）`}
              value={num(future.sum.tweets)}
              delta={diff(base.sum.tweets, future.sum.tweets, num)}
              color={COLORS.tweets}
            />
            <KpiBox
              label={`売上（合計/${days}日）`}
              value={yen(future.sum.sales)}
              delta={diff(base.sum.sales, future.sum.sales, yen)}
              color={COLORS.sales}
            />
            <KpiBox
              label={`粗利（合計/${days}日）`}
              value={yen(future.sum.profit)}
              delta={diff(base.sum.profit, future.sum.profit, yen)}
              color={COLORS.profit}
            />
          </div>

          <Card title={`未来推移（${days}日）`} accent={COLORS.future}>
            <div style={{ height: 420 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={future.rows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="search" name="検索数" stroke={COLORS.search} dot={false} />
                  <Line dataKey="tweets" name="ツイート数（UGC）" stroke={COLORS.tweets} dot={false} />
                  <Line dataKey="sales" name="売上" stroke={COLORS.sales} dot={false} />
                  <Line dataKey="profit" name="粗利" stroke={COLORS.profit} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
              次：B（最適配分★）を追加して「TVをいくら減らすと粗利が最大か」を自動提案します。
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}


