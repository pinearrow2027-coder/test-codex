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

/** 色（意味づけ） */
const COLORS = {
  tv: "#f97316",
  digital: "#2563eb",
  sales: "#111827",
  profit: "#16a34a",
  search: "#7c3aed",
  tweets: "#22c55e",
};

/** フォーマット */
const yen = (n: number) => "¥" + Math.round(n).toLocaleString();
const num = (n: number) => Math.round(n).toLocaleString();

/** UI部品 */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 8px 20px rgba(0,0,0,.06)" }}>
      <div style={{ fontWeight: 900, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function Kpi({ label, value, color, note }: { label: string; value: string; color: string; note?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 16, borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900 }}>{value}</div>
      {note ? <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>{note}</div> : null}
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
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
        <strong>{label}</strong>
        <span>{yen(value)}</span>
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

/**
 * 未来予測モデル（ダミー）
 * - TV投資：リーチ・話題の「土台」を作る（逓減効果あり）
 * - デジタル投資：検索・購買へ効率良く効く（粗利率も押し上げる想定）
 *
 * ※ 後で過去データで係数を調整できるように、係数をまとめている
 */
const COEF = {
  // 投資→検索/ツイート
  tv_to_search: 0.020,         // TV 1円あたり検索増（ダミー）
  digital_to_search: 0.060,     // デジタル 1円あたり検索増（ダミー）
  tv_to_tweets: 0.0000012,      // TV 1円あたりツイート増（ダミー）
  digital_to_tweets: 0.0000022, // デジタル 1円あたりツイート増（ダミー）

  // 検索/ツイート→売上
  search_to_sales: 180,         // 検索 1件あたり売上（円）
  tweets_to_sales: 900,         // ツイート 1件あたり売上（円）

  // 粗利率（デジタル比率が上がると上がる想定）
  base_margin: 0.28,
  max_margin_bonus: 0.10,
};

/** 逓減（投資が増えるほど効きが鈍る） */
function diminishing(x: number, scale: number) {
  // 0..∞ → 0..1 の飽和カーブ
  return 1 - Math.exp(-x / scale);
}

/** 未来データ生成 */
function buildForecast({
  days,
  tvBudget,
  digitalBudget,
}: {
  days: number;
  tvBudget: number;
  digitalBudget: number;
}) {
  // 予算を日割り
  const tvPerDay = tvBudget / days;
  const digitalPerDay = digitalBudget / days;

  // 効果の飽和（TVは大きい予算ほど逓減しやすい想定）
  const tvEff = diminishing(tvBudget, 20_000_000);
  const digitalEff = diminishing(digitalBudget, 10_000_000);

  // 日次のベース（ゼロでも最低限は動く想定）
  const baseSearch = 6000;
  const baseTweets = 300;

  // 予測作成
  const rows = Array.from({ length: days }, (_, i) => {
    const d = i + 1;
    const day = `D${String(d).padStart(2, "0")}`;

    // 当日効果（雑音っぽい揺れを少し入れる）
    const wobble = 0.95 + (i % 7) * 0.01;

    const search =
      baseSearch +
      (tvPerDay * COEF.tv_to_search * tvEff) +
      (digitalPerDay * COEF.digital_to_search * digitalEff);

    const tweets =
      baseTweets +
      (tvPerDay * COEF.tv_to_tweets * tvEff) +
      (digitalPerDay * COEF.digital_to_tweets * digitalEff);

    const sales =
      (search * COEF.search_to_sales + tweets * COEF.tweets_to_sales) * wobble;

    // 粗利率：デジタル比率が高いほど上がる（仮）
    const share = digitalBudget + tvBudget > 0 ? digitalBudget / (digitalBudget + tvBudget) : 0.5;
    const margin = COEF.base_margin + COEF.max_margin_bonus * share;

    const profit = sales * margin;

    return {
      day,
      tvSpend: tvPerDay,
      digitalSpend: digitalPerDay,
      search,
      tweets,
      sales,
      profit,
      margin, // 粗利率（参考）
    };
  });

  // 期間合計/平均（KPI用）
  const sum = rows.reduce(
    (acc, r) => {
      acc.search += r.search;
      acc.tweets += r.tweets;
      acc.sales += r.sales;
      acc.profit += r.profit;
      return acc;
    },
    { search: 0, tweets: 0, sales: 0, profit: 0 }
  );

  return { rows, sum };
}

export default function Home() {
  // 入力：未来予算（円）
  const [tvBudget, setTvBudget] = useState(18_000_000);
  const [digitalBudget, setDigitalBudget] = useState(9_000_000);
  const [days, setDays] = useState(30);

  const forecast = useMemo(() => buildForecast({ days, tvBudget, digitalBudget }), [days, tvBudget, digitalBudget]);

  return (
    <main style={{ padding: 24, background: "#f4f6fb", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>投資配分シミュレーター（未来予測）</h1>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>
        TVとデジタルの投資額を入力すると、未来{days}日間の「検索・ツイート・売上・粗利」を予測します（ダミーモデル）。
      </div>

      {/* KPI（未来期間合計） */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
        <Kpi label={`検索数（合計/${days}日）`} value={num(forecast.sum.search)} color={COLORS.search} />
        <Kpi label={`ツイート数（合計/${days}日）`} value={num(forecast.sum.tweets)} color={COLORS.tweets} />
        <Kpi label={`売上（合計/${days}日）`} value={yen(forecast.sum.sales)} color={COLORS.sales} />
        <Kpi label={`粗利（合計/${days}日）`} value={yen(forecast.sum.profit)} color={COLORS.profit} note="（粗利率はデジタル比率が高いほど上がる想定）" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16 }}>
        {/* 入力 */}
        <Card title="入力：将来の投資（円）">
          <Slider label="テレビ投資" value={tvBudget} min={0} max={30_000_000} step={500_000} onChange={setTvBudget} color={COLORS.tv} />
          <Slider label="デジタル投資" value={digitalBudget} min={0} max={30_000_000} step={500_000} onChange={setDigitalBudget} color={COLORS.digital} />

          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <strong>予測期間</strong>
              <span>{days}日</span>
            </div>
            <input
              type="range"
              min={7}
              max={60}
              step={1}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#111827" }}
            />
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
              ※ まずは30日でOK。週次なら7〜14日に。
            </div>
          </div>

          <div style={{ marginTop: 16, fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>
            <strong>モデル（ダミー）意図</strong><br />
            ・TV：話題/検索の「土台」を作るが、増やすほど逓減<br />
            ・デジタル：検索/購買に効きやすく、粗利率も押し上げる想定
          </div>
        </Card>

        {/* 可視化（未来推移） */}
        <Card title="未来推移（投資→検索/ツイート→売上/粗利）">
          <div style={{ height: 420 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast.rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip
                  formatter={(v: any, name: any) => {
                    if (name === "tvSpend") return [yen(v), "TV（日割り）"];
                    if (name === "digitalSpend") return [yen(v), "デジタル（日割り）"];
                    if (name === "sales") return [yen(v), "売上"];
                    if (name === "profit") return [yen(v), "粗利"];
                    if (name === "search") return [num(v), "検索数"];
                    if (name === "tweets") return [num(v), "ツイート数"];
                    return [v, String(name)];
                  }}
                />
                <Legend />
                <Line dataKey="tvSpend" name="TV（日割り）" stroke={COLORS.tv} dot={false} />
                <Line dataKey="digitalSpend" name="デジタル（日割り）" stroke={COLORS.digital} dot={false} />
                <Line dataKey="search" name="検索数" stroke={COLORS.search} dot={false} />
                <Line dataKey="tweets" name="ツイート数" stroke={COLORS.tweets} dot={false} />
                <Line dataKey="sales" name="売上" stroke={COLORS.sales} dot={false} />
                <Line dataKey="profit" name="粗利" stroke={COLORS.profit} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
            ※ このモデルは説明用のダミーです。次は「過去データ」から係数（COEF）を推定して現実に寄せます。
          </div>
        </Card>
      </div>
    </main>
  );
}

