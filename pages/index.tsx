import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from "recharts";

/** ====== Today KPI（仮） ====== */
const todayKpi = [
  { label: "デジタルリーチ", value: "1,240,000", delta: +6.2 },
  { label: "売上", value: "¥1,820,000", delta: +4.1 },
  { label: "粗利", value: "¥680,000", delta: +5.3 },
  { label: "初速購入数", value: "420", delta: +8.9, highlight: true },
];

/** ====== 1か月分の仮データを生成（12/01〜12/31） ======
 * - digitalSpend/tvSpend: 投資（円）
 * - sales/grossProfit: 成果（円）
 * - search/tweets: 量（件）
 * - ecShare: EC比率（0-1）
 * - grossMargin: 粗利率（0-1）
 */
const month = "12";
const daily = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1;
  const date = `${month}/${String(day).padStart(2, "0")}`;

  // ざっくり “TV投資は減少、デジタルは増加” のシナリオ
  const tvSpend = Math.round(1200000 - i * 12000 + (i % 5) * 8000);
  const digitalSpend = Math.round(380000 + i * 9000 + (i % 4) * 7000);

  // 検索・ツイートはデジタル投資に連動して増える（仮）
  const search = Math.round(7000 + i * 120 + (i % 3) * 180);
  const tweets = Math.round(380 + i * 7 + (i % 6) * 12);

  // 売上・粗利は「検索/話題の増加」＋「TV逓減」っぽい形（仮）
  const sales = Math.round(1450000 + i * 14000 + (i % 7) * 22000);
  const ecShare = Math.max(0.25, Math.min(0.6, 0.30 + i * 0.006 + (i % 5) * 0.01)); // 徐々にEC比率↑
  const grossMargin = Math.max(0.22, Math.min(0.45, 0.30 + (ecShare - 0.30) * 0.35)); // EC比率が上がると粗利率も上がる（仮）
  const grossProfit = Math.round(sales * grossMargin);

  return {
    date,
    tvSpend,
    digitalSpend,
    search,
    tweets,
    sales,
    grossProfit,
    ecShare,
    grossMargin,
  };
});

// 週次推移（参考：そのまま）
const weeklySales = [
  { period: "W1", sales: 120, grossProfit: 42 },
  { period: "W2", sales: 150, grossProfit: 55 },
  { period: "W3", sales: 110, grossProfit: 38 },
  { period: "W4", sales: 180, grossProfit: 66 },
];

/** ====== UI部品 ====== */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #e5e5e5", borderRadius: 16, padding: 16, background: "#fff" }}>
      <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0", fontSize: 13 }}>
      <span style={{ opacity: 0.85 }}>{label}</span>
      <span style={{ fontWeight: 800 }}>{value}</span>
    </div>
  );
}

function TodayKpiCard({ label, value, delta, highlight }: { label: string; value: string; delta: number; highlight?: boolean }) {
  const up = delta >= 0;
  const color = up ? "#0a7a3d" : "#b00020";
  return (
    <div style={{ border: highlight ? "2px solid #111" : "1px solid #e5e5e5", borderRadius: 16, padding: 16, background: "#fff" }}>
      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>{value}</div>
      <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800, color }}>
        {up ? "▲" : "▼"} {Math.abs(delta)}%<span style={{ opacity: 0.6, marginLeft: 6 }}>前日比</span>
      </div>
    </div>
  );
}

/** ====== 表示用フォーマット ====== */
function yen(n: number) {
  return "¥" + Math.round(n).toLocaleString();
}
function num(n: number) {
  return Math.round(n).toLocaleString();
}
function pct01(n: number) {
  return (n * 100).toFixed(1) + "%";
}

export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 16 }}>Marketing & Sales Dashboard</h1>

      {/* Today KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 16 }}>
        {todayKpi.map((k) => (
          <TodayKpiCard key={k.label} {...k} />
        ))}
      </div>

      {/* 投資→成果（上段：投資 / 下段：成果3段） */}
      <div style={{ marginBottom: 16 }}>
        <Card title={`日次：投資→成果（${month}/01〜${month}/31）`}>
          {/* 上段：投資 */}
          <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 6 }}>上段：投資（円）</div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v) => yen(v)} />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    if (name === "digitalSpend") return [yen(value), "デジタル投資"];
                    if (name === "tvSpend") return [yen(value), "テレビ投資"];
                    return [value, name];
                  }}
                />
                <Legend />
                {/* 色を分ける */}
                <Line type="monotone" dataKey="digitalSpend" name="デジタル投資" dot={false} stroke="#2563eb" />
                <Line type="monotone" dataKey="tvSpend" name="テレビ投資" dot={false} stroke="#f97316" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ height: 16 }} />

          {/* 成果：1段目（検索数・ツイート数） */}
          <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 6 }}>成果①：検索数・ツイート数（件）</div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v) => num(v)} />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    if (name === "search") return [num(value), "検索数"];
                    if (name === "tweets") return [num(value), "ツイート数"];
                    return [value, name];
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="search" name="検索数" dot={false} stroke="#7c3aed" />
                <Line type="monotone" dataKey="tweets" name="ツイート数" dot={false} stroke="#16a34a" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ height: 16 }} />

          {/* 成果：2段目（売上・粗利） */}
          <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 6 }}>成果②：売上・粗利（円）</div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v) => yen(v)} />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    if (name === "sales") return [yen(value), "売上"];
                    if (name === "grossProfit") return [yen(value), "粗利"];
                    return [value, name];
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="sales" name="売上" dot={false} stroke="#111827" />
                <Line type="monotone" dataKey="grossProfit" name="粗利" dot={false} stroke="#dc2626" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ height: 16 }} />

          {/* 成果：3段目（EC比率・粗利率） */}
          <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 6 }}>
            成果③：EC比率・粗利率（%） ※売上と粗利の差の説明に使う
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v) => `${Math.round(v * 100)}%`} domain={[0, 1]} />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    if (name === "ecShare") return [pct01(value), "EC比率"];
                    if (name === "grossMargin") return [pct01(value), "粗利率"];
                    return [value, name];
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="ecShare" name="EC比率" dot={false} stroke="#0ea5e9" />
                <Line type="monotone" dataKey="grossMargin" name="粗利率" dot={false} stroke="#a855f7" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
            ねらい：TV投資↓・デジタル投資↑ → 検索/話題↑ → 売上/粗利↑ を日次で追い、さらに EC比率や粗利率の変化で「売上と粗利のズレ（利益率差）」を説明。
          </div>
        </Card>
      </div>

      {/* A/Bパネル（そのまま） */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card title="A. LTV（ブランド）">
          <div style={{ fontWeight: 900, marginBottom: 8, fontSize: 13 }}>ブランド想起</div>
          <MetricRow label="TV：GRP" value="320" />
          <MetricRow label="TV：フリークエンシー" value="3.1" />
          <MetricRow label="デジタル：ビューアブルリーチ" value="1.2M" />
          <MetricRow label="デジタル：VTR" value="28%" />

          <div style={{ fontWeight: 900, margin: "14px 0 8px", fontSize: 13 }}>行為・態度形成</div>
          <MetricRow label="TV：ブランドリフト" value="+4.2pt" />
          <MetricRow label="デジタル：ブランドリフト" value="+2.8pt" />

          <div style={{ fontWeight: 900, margin: "14px 0 8px", fontSize: 13 }}>指名検索</div>
          <MetricRow label="ブランド検索数" value="82,140" />
          <MetricRow label="検索購入率" value="3.4%" />
          <MetricRow label="EC送客" value="54,220" />
          <MetricRow label="商品詳細ページ流入" value="31,800" />
          <MetricRow label="店頭来店" value="12,400" />
        </Card>

        <Card title="B. 商品ヒット">
          <div style={{ fontWeight: 900, marginBottom: 8, fontSize: 13 }}>商品発見最大化</div>
          <MetricRow label="TV：リーチ" value="4.8M" />
          <MetricRow label="デジタル：検索数" value="120,400" />
          <MetricRow label="広告接触者の商品名想起" value="18%" />

          <div style={{ fontWeight: 900, margin: "14px 0 8px", fontSize: 13 }}>話題化</div>
          <MetricRow label="SNSのUGC数" value="2,180" />
          <MetricRow label="口コミ数" value="640" />
          <MetricRow label="レビュー数" value="1,020" />

          <div style={{ fontWeight: 900, margin: "14px 0 8px", fontSize: 13 }}>商品検索</div>
          <MetricRow label="商品名検索量" value="58,900" />

          <div style={{ fontWeight: 900, margin: "14px 0 8px", fontSize: 13 }}>クリエイティブ</div>
          <MetricRow label="特徴の伝達度合い（調査）" value="7.8/10" />

          <div style={{ fontWeight: 900, margin: "14px 0 8px", fontSize: 13 }}>売上関連</div>
          <MetricRow label="店頭売上比率" value="62%" />
          <MetricRow label="EC購入率" value="38%" />
          <MetricRow label="初速購入数" value="3,280" />
        </Card>
      </div>

      {/* 週次：売上・粗利（参考） */}
      <Card title="売上・粗利（週次推移・参考）">
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklySales} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" name="売上" />
              <Bar dataKey="grossProfit" name="粗利" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </main>
  );
}

