import { useState, useEffect, useCallback } from "react";
import { Eye, Wifi, WifiOff, Clock, Camera, RefreshCw, ChevronRight, Activity, Cpu, BarChart2, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import cataractImg from "figma:asset/2ceb8a4f8fa5d490847a95f8070bade231855497.png";

// ── API Railway ───────────────────────────────────────────
const API_URL = "https://web-production-08f648.up.railway.app";

// ── Tipe data ─────────────────────────────────────────────
type PredictResult = {
  id: number | null;
  label: string;
  prediksi: string;
  confidence: number;
  normal: number;
  immature: number;
  mature: number;
  waktu: string;
};

type HistoryRow = {
  id: number;
  prediksi: string;
  normal_pct: number;
  imm_pct: number;
  mat_pct: number;
  confidence: number;
  waktu: string;
};

type StatsData = {
  Normal: number;
  Immature: number;
  Mature: number;
  total: number;
};

// ── Helpers ───────────────────────────────────────────────
const getLabelColor = (label: string) => {
  if (label === "Normal")   return { bg: "bg-emerald-900/40", text: "text-emerald-400", dot: "bg-emerald-500", border: "border-emerald-700" };
  if (label === "Immature") return { bg: "bg-amber-900/40",   text: "text-amber-400",   dot: "bg-amber-500",   border: "border-amber-700"   };
  if (label === "Mature")   return { bg: "bg-red-900/40",     text: "text-red-400",     dot: "bg-red-500",     border: "border-red-800"     };
  return { bg: "bg-gray-800", text: "text-gray-400", dot: "bg-gray-500", border: "border-gray-700" };
};

const getLabelIcon = (label: string) => {
  if (label === "Normal")   return <CheckCircle2 size={14} className="text-emerald-400" />;
  if (label === "Immature") return <AlertCircle  size={14} className="text-amber-400"   />;
  if (label === "Mature")   return <AlertCircle  size={14} className="text-red-400"     />;
  return <Info size={14} />;
};

const labelDisplay = (label: string) =>
  label === "Normal" ? "Mata Normal" : label === "Immature" ? "Katarak Immature" : "Katarak Mature";

function useCurrentTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

// ═════════════════════════════════════════════════════════
export default function App() {
  const [activeTab, setActiveTab]     = useState<"latest" | "history" | "stats">("latest");
  const [connected, setConnected]     = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const now = useCurrentTime();

  // ── State Tangkapan (predict) ─────────────────────────
  const [predicting, setPredicting]   = useState(false);
  const [predictResult, setPredictResult] = useState<PredictResult | null>(null);
  const [predictError, setPredictError]   = useState<string | null>(null);
  const [previewUrl, setPreviewUrl]       = useState<string | null>(null);

  // ── State Riwayat ─────────────────────────────────────
  const [history, setHistory]         = useState<HistoryRow[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<HistoryRow | null>(null);

  // ── State Statistik ───────────────────────────────────
  const [statsData, setStatsData]     = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const timeStr = now.toLocaleTimeString("id-ID",  { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("id-ID",  { day: "2-digit", month: "long", year: "numeric" });

  // ── Cek koneksi API saat mount ────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/`)
      .then(r => { if (r.ok) setConnected(true); })
      .catch(() => setConnected(false));
  }, []);

  // ── Ambil riwayat dari MySQL ──────────────────────────
  const fetchHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const res  = await fetch(`${API_URL}/history?limit=50`);
      const data = await res.json();
      setHistory(data.data ?? []);
    } catch { /* ignore */ }
    finally { setHistLoading(false); }
  }, []);

  // ── Ambil statistik dari MySQL ────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res  = await fetch(`${API_URL}/stats`);
      const data = await res.json();
      setStatsData(data);
    } catch { /* ignore */ }
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => { fetchHistory(); fetchStats(); }, [fetchHistory, fetchStats]);

  // ── Upload foto → predict ─────────────────────────────
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setPredictResult(null);
    setPredictError(null);
    setPredicting(true);

    const formData = new FormData();
    formData.append("foto", file);   // field "foto" sesuai app.py

    try {
      const res  = await fetch(`${API_URL}/predict`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data: PredictResult = await res.json();
      setPredictResult(data);
      setConnected(true);
      // Refresh riwayat & statistik otomatis setelah predict berhasil
      fetchHistory();
      fetchStats();
    } catch (err) {
      setPredictError("Gagal konek ke API Railway. Periksa koneksi atau coba lagi.");
      setConnected(false);
      console.error(err);
    } finally {
      setPredicting(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory();
    fetchStats();
    setTimeout(() => setRefreshing(false), 1200);
  };

  // ── Warna hasil prediksi saat ini ─────────────────────
  const resultColors = predictResult ? getLabelColor(predictResult.label) : null;

  // ── Warna baris riwayat terpilih ──────────────────────
  const rowColors = selectedRow ? getLabelColor(selectedRow.prediksi) : null;

  // ─────────────────────────────────────────────────────
  //  SHARED SUB-COMPONENTS
  // ─────────────────────────────────────────────────────

  const KeteranganCard = () => (
    <div className="bg-[#1a2332] rounded-2xl shadow-lg p-4 border border-[#243044]">
      <div className="flex items-center gap-2 mb-3">
        <Info size={15} className="text-[#38bdf8]" />
        <h3 className="text-[14px] text-gray-300">Keterangan Klasifikasi</h3>
      </div>
      {[
        { label: "Normal",   desc: "Lensa mata jernih, tidak ditemukan kekeruhan.",          color: "bg-emerald-500" },
        { label: "Immature", desc: "Kekeruhan sebagian, lensa belum sepenuhnya keruh.",      color: "bg-amber-500"   },
        { label: "Mature",   desc: "Lensa mata sepenuhnya keruh, perlu tindakan medis.",     color: "bg-red-500"     },
      ].map(item => (
        <div key={item.label} className="flex items-start gap-2.5 mb-2">
          <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${item.color}`}></span>
          <div>
            <span className="text-[12px] text-gray-200" style={{ fontWeight: 600 }}>{item.label}:</span>
            <span className="text-[12px] text-gray-500"> {item.desc}</span>
          </div>
        </div>
      ))}
    </div>
  );

  // ── TAB: Tangkapan (predict) ──────────────────────────
  const TangkapanContent = () => (
    <div className="flex flex-col gap-4">
      {/* Upload area */}
      <div className="bg-[#1a2332] rounded-2xl shadow-lg overflow-hidden border border-[#243044]">
        <div className="px-4 pt-4 pb-3 flex items-center gap-2">
          <Camera size={18} className="text-[#34d399]" />
          <h2 className="text-[15px] text-gray-200">Analisis Foto Mata</h2>
        </div>

        <div className="mx-4 mb-4">
          <div className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-[#34d399] rounded-xl bg-[#0d2e24]/20">
            <div className="w-12 h-12 rounded-full bg-[#0d2e24] flex items-center justify-center">
              <Camera size={22} className="text-[#34d399]" />
            </div>
            <p className="text-[13px] text-gray-300" style={{ fontWeight: 600 }}>Pilih foto mata untuk dianalisis</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              style={{ display: "block" }}
              className="text-[12px] text-gray-400 w-full"
            />
          </div>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="mx-4 mb-4">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Preview Foto</p>
            <div className="rounded-xl overflow-hidden bg-gray-950" style={{ aspectRatio: "4/3" }}>
              <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* Loading */}
        {predicting && (
          <div className="mx-4 mb-4 flex items-center gap-3 px-4 py-3 bg-[#111a27] rounded-xl border border-[#243044]">
            <div className="w-4 h-4 border-2 border-[#34d399] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[13px] text-[#34d399]">Menganalisis foto ke API Railway...</span>
          </div>
        )}

        {/* Error */}
        {predictError && (
          <div className="mx-4 mb-4 px-4 py-3 bg-red-900/30 rounded-xl border border-red-800">
            <p className="text-[13px] text-red-400">{predictError}</p>
          </div>
        )}

        {/* Hasil predict */}
        {predictResult && resultColors && (
          <div className="mx-4 mb-4">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Hasil Analisis ML</p>
            <div className={`flex items-center gap-2 px-3 py-3 rounded-xl border ${resultColors.bg} ${resultColors.border} mb-3`}>
              <span className={`w-3 h-3 rounded-full ${resultColors.dot}`}></span>
              <div className="flex items-center gap-1.5">
                {getLabelIcon(predictResult.label)}
                <span className={`text-[15px] ${resultColors.text}`} style={{ fontWeight: 700 }}>
                  {labelDisplay(predictResult.label)}
                </span>
              </div>
              <span className={`ml-auto text-[13px] ${resultColors.text}`} style={{ fontWeight: 600 }}>
                {predictResult.confidence.toFixed(1)}%
              </span>
            </div>

            <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Distribusi Kepercayaan</p>
            {[
              { key: "normal",   label: "Normal",   value: predictResult.normal,   color: "bg-emerald-500" },
              { key: "immature", label: "Immature", value: predictResult.immature, color: "bg-amber-500"   },
              { key: "mature",   label: "Mature",   value: predictResult.mature,   color: "bg-red-500"     },
            ].map(item => (
              <div key={item.key} className="mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-[12px] text-gray-400">{item.label}</span>
                  <span className="text-[12px] text-gray-300" style={{ fontWeight: 600 }}>{item.value.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#111a27] overflow-hidden">
                  <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}

            <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-500">
              <Clock size={10} /> {predictResult.waktu}
              {predictResult.id && <span className="ml-auto text-[#34d399]">✓ Tersimpan ke DB #{predictResult.id}</span>}
            </div>
          </div>
        )}
      </div>

      <KeteranganCard />
    </div>
  );

  // ── TAB: Riwayat (dari MySQL) ─────────────────────────
  const RiwayatContent = () => (
    <div className="flex flex-col gap-4">
      <div className="bg-[#1a2332] rounded-2xl shadow-lg overflow-hidden border border-[#243044]">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="text-[#34d399]" />
            <h2 className="text-[15px] text-gray-200">Riwayat Deteksi</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 bg-[#111a27] border border-[#243044] px-2 py-0.5 rounded-full">
              {history.length} data
            </span>
            <button onClick={fetchHistory} className="w-7 h-7 rounded-full bg-[#0d2e24] flex items-center justify-center">
              <RefreshCw size={12} className={`text-[#34d399] ${histLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {histLoading && (
          <div className="flex items-center justify-center py-8 gap-2">
            <div className="w-4 h-4 border-2 border-[#34d399] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[12px] text-gray-500">Memuat dari MySQL...</span>
          </div>
        )}

        {!histLoading && history.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-[13px]">Belum ada data. Upload foto dulu!</div>
        )}

        <div className="divide-y divide-[#1e2d40]">
          {history.map(row => {
            const colors = getLabelColor(row.prediksi);
            const maxConf = Math.max(row.normal_pct, row.imm_pct, row.mat_pct);
            return (
              <button key={row.id} onClick={() => setSelectedRow(row === selectedRow ? null : row)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1e2d40] transition-colors text-left">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors.bg} border ${colors.border}`}>
                  {getLabelIcon(row.prediksi)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`} style={{ fontWeight: 600 }}>
                      {row.prediksi}
                    </span>
                    <span className="text-[11px] text-gray-500">#{row.id}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1">
                    <Clock size={10} className="shrink-0" /> {row.waktu}
                  </p>
                </div>
                <span className={`text-[13px] ${colors.text} shrink-0`} style={{ fontWeight: 600 }}>
                  {maxConf.toFixed(1)}%
                </span>
                <ChevronRight size={14} className="text-gray-600 shrink-0" />
              </button>
            );
          })}
        </div>

        {/* Detail baris terpilih */}
        {selectedRow && rowColors && (
          <div className="mx-4 mb-4 mt-2 p-4 bg-[#111a27] rounded-xl border border-[#243044]">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Detail #{selectedRow.id}</p>
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${rowColors.bg} ${rowColors.border} mb-3`}>
              <span className={`w-3 h-3 rounded-full ${rowColors.dot}`}></span>
              {getLabelIcon(selectedRow.prediksi)}
              <span className={`text-[14px] ${rowColors.text}`} style={{ fontWeight: 700 }}>{labelDisplay(selectedRow.prediksi)}</span>
              <span className={`ml-auto text-[13px] ${rowColors.text}`} style={{ fontWeight: 600 }}>{selectedRow.confidence.toFixed(1)}%</span>
            </div>
            {[
              { label: "Normal",   value: selectedRow.normal_pct, color: "bg-emerald-500" },
              { label: "Immature", value: selectedRow.imm_pct,    color: "bg-amber-500"   },
              { label: "Mature",   value: selectedRow.mat_pct,    color: "bg-red-500"     },
            ].map(item => (
              <div key={item.label} className="mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-[12px] text-gray-400">{item.label}</span>
                  <span className="text-[12px] text-gray-300" style={{ fontWeight: 600 }}>{item.value.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#1a2332] overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-4 py-3 bg-[#111a27] border-t border-[#243044] flex items-center gap-2">
          <Clock size={12} className="text-gray-600" />
          <span className="text-[11px] text-gray-500">Diperbarui: {dateStr}, {timeStr}</span>
        </div>
      </div>
    </div>
  );

  // ── TAB: Statistik (dari MySQL) ───────────────────────
  const StatistikContent = () => {
    const total = statsData?.total ?? 0;
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Scan",  value: total,                color: "text-[#34d399]" },
            { label: "Normal",      value: statsData?.Normal   ?? 0, color: "text-emerald-400" },
            { label: "Immature",    value: statsData?.Immature ?? 0, color: "text-amber-400"   },
            { label: "Mature",      value: statsData?.Mature   ?? 0, color: "text-red-400"     },
          ].map(s => (
            <div key={s.label} className="bg-[#1a2332] rounded-2xl shadow-lg p-3 border border-[#243044]">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
              {statsLoading
                ? <div className="w-8 h-7 bg-[#243044] rounded animate-pulse"></div>
                : <p className={`text-[28px] ${s.color}`} style={{ fontWeight: 700 }}>{s.value}</p>
              }
            </div>
          ))}
        </div>

        <div className="bg-[#1a2332] rounded-2xl shadow-lg p-4 border border-[#243044]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-[#34d399]" />
              <h3 className="text-[14px] text-gray-300">Proporsi Klasifikasi (MySQL)</h3>
            </div>
            <button onClick={fetchStats} className="w-7 h-7 rounded-full bg-[#0d2e24] flex items-center justify-center">
              <RefreshCw size={12} className={`text-[#34d399] ${statsLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
          {[
            { label: "Normal",   count: statsData?.Normal   ?? 0, color: "bg-emerald-500", text: "text-emerald-400" },
            { label: "Immature", count: statsData?.Immature ?? 0, color: "bg-amber-400",   text: "text-amber-400"   },
            { label: "Mature",   count: statsData?.Mature   ?? 0, color: "bg-red-500",     text: "text-red-400"     },
          ].map(item => (
            <div key={item.label} className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-[13px] text-gray-400">{item.label}</span>
                <div className="flex items-center gap-1">
                  <span className={`text-[13px] ${item.text}`} style={{ fontWeight: 600 }}>{item.count}</span>
                  <span className="text-[11px] text-gray-600">
                    ({total > 0 ? ((item.count / total) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
              </div>
              <div className="h-3 rounded-full bg-[#111a27] overflow-hidden">
                <div className={`h-full rounded-full ${item.color} transition-all duration-700`}
                  style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#1a2332] rounded-2xl shadow-lg p-4 border border-[#243044]">
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={15} className="text-[#34d399]" />
            <h3 className="text-[14px] text-gray-300">Informasi Sistem</h3>
          </div>
          {[
            { label: "Mikrokontroler",      value: "ESP32-CAM"              },
            { label: "Modul Kamera",        value: "OV3660 (3MP)"           },
            { label: "Metode Klasifikasi",  value: "CNN (TensorFlow/Keras)" },
            { label: "Database",            value: "MySQL (Railway)"        },
            { label: "Kategori",            value: "Normal · Immature · Mature" },
            { label: "Tanggal",             value: dateStr                  },
            { label: "Versi Sistem",        value: "v2.0.0"                 },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-[#243044] last:border-0">
              <span className="text-[12px] text-gray-500">{item.label}</span>
              <span className="text-[12px] text-gray-300" style={{ fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────
  //  HEADER
  // ─────────────────────────────────────────────────────
  const Header = () => (
    <div className="bg-[#1a2332] rounded-2xl shadow-lg p-4 border border-[#243044]">
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-[#0d2e24] px-3 py-1 rounded-full flex items-center gap-1.5 border border-[#1a5c42]">
          <Eye size={13} className="text-[#34d399]" />
          <span className="text-[11px] text-[#34d399] tracking-widest" style={{ fontWeight: 700 }}>KATARAK IoT DETECTOR</span>
        </div>
      </div>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow border border-[#243044]">
          <img src={cataractImg} alt="Katarak mata" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-[17px] leading-snug text-gray-100">
            Rancang Bangun Alat Deteksi Tingkat Kekeruhan Lensa Mata
          </h1>
          <p className="text-[12px] text-gray-500 mt-0.5">Berbasis IoT — ESP32-CAM</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-full bg-[#0d2e24] flex items-center justify-center">
          <Activity size={11} className="text-[#34d399]" />
        </div>
        <span className="text-[13px] text-gray-400">Sistem Deteksi Katarak · MySQL</span>
        <span className="ml-auto bg-[#2a2010] text-[#f59e0b] text-[11px] px-2 py-0.5 rounded-full border border-[#78500a]" style={{ fontWeight: 600 }}>2026</span>
      </div>
      <div className="flex gap-2">
        <div className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border ${connected ? "border-emerald-800 bg-emerald-900/30" : "border-red-800 bg-red-900/30"}`}>
          <span className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
          <div className="text-left">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Status API Railway</p>
            <p className={`text-[13px] ${connected ? "text-emerald-400" : "text-red-400"}`} style={{ fontWeight: 600 }}>
              {connected ? "Terhubung" : "Terputus"}
            </p>
          </div>
          {connected ? <Wifi size={16} className="ml-auto text-emerald-500" /> : <WifiOff size={16} className="ml-auto text-red-400" />}
        </div>
        <div className="bg-[#111a27] border border-[#243044] rounded-xl px-3 py-2.5 flex items-center gap-2 min-w-[105px]">
          <Clock size={14} className="text-[#34d399] shrink-0" />
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Waktu</p>
            <p className="text-[13px] text-gray-200" style={{ fontWeight: 600 }}>{timeStr}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const Tabs = () => (
    <div className="flex bg-[#111a27] rounded-2xl shadow-lg p-1 gap-1 border border-[#243044]">
      {[
        { key: "latest",  label: "Tangkapan", icon: <Camera size={13} />    },
        { key: "history", label: "Riwayat",   icon: <RefreshCw size={13} /> },
        { key: "stats",   label: "Statistik", icon: <BarChart2 size={13} /> },
      ].map(tab => (
        <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] transition-all ${
            activeTab === tab.key ? "bg-[#1a5c42] text-[#34d399] shadow" : "text-gray-500 hover:bg-[#1a2332] hover:text-gray-300"
          }`}>
          {tab.icon}
          <span style={{ fontWeight: activeTab === tab.key ? 600 : 400 }}>{tab.label}</span>
        </button>
      ))}
    </div>
  );

  // ─────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0b1120]">

      {/* ── MOBILE ── */}
      <div className="lg:hidden flex justify-center">
        <div className="w-full max-w-md min-h-screen flex flex-col pb-6 px-3 pt-4 gap-3">
          <Header />
          <Tabs />
          {activeTab === "latest"  && <TangkapanContent />}
          {activeTab === "history" && <RiwayatContent />}
          {activeTab === "stats"   && <StatistikContent />}
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <Eye size={12} className="text-[#34d399]" />
            <p className="text-[11px] text-gray-600">Deteksi Katarak IoT — ESP32-CAM · 2026</p>
          </div>
        </div>
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden lg:flex flex-col min-h-screen">
        {/* Top Bar */}
        <div className="bg-[#0f1929] border-b border-[#1e2d40] px-8 py-3 flex items-center gap-4 shadow-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#243044] shadow-sm">
              <img src={cataractImg} alt="Katarak" className="w-full h-full object-cover" />
            </div>
            <div className="bg-[#0d2e24] px-3 py-1 rounded-full flex items-center gap-1.5 border border-[#1a5c42]">
              <Eye size={13} className="text-[#34d399]" />
              <span className="text-[11px] text-[#34d399] tracking-widest" style={{ fontWeight: 700 }}>KATARAK IoT DETECTOR</span>
            </div>
          </div>
          <div className="flex-1">
            <span className="text-[14px] text-gray-200" style={{ fontWeight: 600 }}>
              Rancang Bangun Alat Deteksi Tingkat Kekeruhan Lensa Mata
            </span>
            <span className="text-[13px] text-gray-500 ml-2">— Berbasis IoT · ESP32-CAM</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[12px] ${connected ? "border-emerald-800 bg-emerald-900/30 text-emerald-400" : "border-red-800 bg-red-900/30 text-red-400"}`}>
              <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
              {connected ? "API Terhubung" : "API Terputus"}
              {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
            </div>
            <button onClick={handleRefresh}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#243044] bg-[#1a2332] text-[12px] text-gray-400 ${refreshing ? "opacity-60" : ""}`}>
              <RefreshCw size={13} className={refreshing ? "animate-spin text-[#34d399]" : ""} />
              Refresh
            </button>
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-[#34d399]" />
              <span className="text-[13px] text-gray-200" style={{ fontWeight: 600 }}>{timeStr}</span>
              <span className="text-[12px] text-gray-500">· {dateStr}</span>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="bg-[#0f1929] border-b border-[#1e2d40] px-8 flex gap-1 pt-2">
          {[
            { key: "latest",  label: "Tangkapan Foto", icon: <Camera size={14} />    },
            { key: "history", label: "Riwayat",        icon: <RefreshCw size={14} /> },
            { key: "stats",   label: "Statistik",      icon: <BarChart2 size={14} /> },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-[13px] border-b-2 transition-all ${
                activeTab === tab.key
                  ? "border-[#34d399] text-[#34d399] bg-[#0d2e24]/50"
                  : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-[#1a2332]"
              }`}>
              {tab.icon}
              <span style={{ fontWeight: activeTab === tab.key ? 600 : 400 }}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 px-8 py-6 overflow-auto">

          {/* TANGKAPAN — Desktop 2 kolom */}
          {activeTab === "latest" && (
            <div className="grid grid-cols-2 gap-6 max-w-6xl mx-auto">
              {/* Kiri: upload + preview */}
              <div className="flex flex-col gap-5">
                <div className="bg-[#1a2332] rounded-2xl shadow-lg overflow-hidden border border-[#243044]">
                  <div className="px-5 pt-5 pb-3 flex items-center gap-2">
                    <Camera size={18} className="text-[#34d399]" />
                    <h2 className="text-[15px] text-gray-200">Analisis Foto Mata</h2>
                  </div>
                  <div className="mx-5 mb-5">
                    <div className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-[#34d399] rounded-xl bg-[#0d2e24]/20">
                      <div className="w-12 h-12 rounded-full bg-[#0d2e24] flex items-center justify-center">
                        <Camera size={22} className="text-[#34d399]" />
                      </div>
                      <p className="text-[13px] text-gray-300" style={{ fontWeight: 600 }}>Pilih foto mata untuk dianalisis</p>
                      <input type="file" accept="image/*" onChange={handleUpload}
                        style={{ display: "block" }} className="text-[12px] text-gray-400 w-full" />
                    </div>
                  </div>

                  {previewUrl && (
                    <div className="mx-5 mb-5">
                      <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Preview Foto</p>
                      <div className="rounded-xl overflow-hidden bg-gray-950" style={{ aspectRatio: "4/3" }}>
                        <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}

                  {predicting && (
                    <div className="mx-5 mb-5 flex items-center gap-3 px-4 py-3 bg-[#111a27] rounded-xl border border-[#243044]">
                      <div className="w-4 h-4 border-2 border-[#34d399] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[13px] text-[#34d399]">Menganalisis foto ke API Railway...</span>
                    </div>
                  )}

                  {predictError && (
                    <div className="mx-5 mb-5 px-4 py-3 bg-red-900/30 rounded-xl border border-red-800">
                      <p className="text-[13px] text-red-400">{predictError}</p>
                    </div>
                  )}
                </div>
                <KeteranganCard />
              </div>

              {/* Kanan: hasil predict */}
              <div className="flex flex-col gap-5">
                {predictResult && resultColors ? (
                  <div className="bg-[#1a2332] rounded-2xl shadow-lg p-5 border border-[#243044]">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-3">Hasil Analisis ML</p>
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-4 border ${resultColors.bg} ${resultColors.border}`}>
                      <span className={`w-3 h-3 rounded-full ${resultColors.dot}`}></span>
                      <div className="flex items-center gap-1.5">
                        {getLabelIcon(predictResult.label)}
                        <span className={`text-[16px] ${resultColors.text}`} style={{ fontWeight: 700 }}>
                          {labelDisplay(predictResult.label)}
                        </span>
                      </div>
                      <span className={`ml-auto text-[14px] ${resultColors.text}`} style={{ fontWeight: 700 }}>
                        {predictResult.confidence.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-3">Distribusi Kepercayaan</p>
                    {[
                      { key: "normal",   label: "Normal",   value: predictResult.normal,   color: "bg-emerald-500" },
                      { key: "immature", label: "Immature", value: predictResult.immature, color: "bg-amber-500"   },
                      { key: "mature",   label: "Mature",   value: predictResult.mature,   color: "bg-red-500"     },
                    ].map(item => (
                      <div key={item.key} className="mb-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-[13px] text-gray-400">{item.label}</span>
                          <span className="text-[13px] text-gray-300" style={{ fontWeight: 600 }}>{item.value.toFixed(1)}%</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-[#111a27] overflow-hidden">
                          <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: `${item.value}%` }} />
                        </div>
                      </div>
                    ))}
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-500 border-t border-[#243044] pt-3">
                      <Clock size={10} /> {predictResult.waktu}
                      {predictResult.id && <span className="ml-auto text-[#34d399]">✓ DB #{predictResult.id}</span>}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#1a2332] rounded-2xl p-8 border border-[#243044] flex flex-col items-center justify-center gap-3 text-center">
                    <Eye size={32} className="text-[#243044]" />
                    <p className="text-[14px] text-gray-500">Upload foto mata untuk melihat hasil analisis ML</p>
                  </div>
                )}

                {/* Info perangkat */}
                <div className="bg-[#1a2332] rounded-2xl shadow-lg p-5 border border-[#243044]">
                  <div className="flex items-center gap-2 mb-3">
                    <Cpu size={15} className="text-[#34d399]" />
                    <h3 className="text-[14px] text-gray-300">Informasi Perangkat</h3>
                  </div>
                  {[
                    { label: "Device",           value: "ESP32-CAM"        },
                    { label: "Resolusi Kamera",  value: "OV3660 — 2048x1536" },
                    { label: "Total Deteksi DB", value: `${statsData?.total ?? 0} data` },
                    { label: "Status MySQL",     value: connected ? "Terhubung ✓" : "Belum terhubung" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-[#243044] last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                        <span className="text-[12px] text-gray-500">{item.label}</span>
                      </div>
                      <span className="text-[12px] text-gray-300" style={{ fontWeight: 500 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RIWAYAT — Desktop wide 2 kolom */}
          {activeTab === "history" && (
            <div className="max-w-6xl mx-auto">
              <div className="bg-[#1a2332] rounded-2xl shadow-lg overflow-hidden border border-[#243044]">
                <div className="px-6 pt-5 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw size={16} className="text-[#34d399]" />
                    <h2 className="text-[15px] text-gray-200">Riwayat Deteksi (MySQL)</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 bg-[#111a27] border border-[#243044] px-2 py-0.5 rounded-full">{history.length} data</span>
                    <button onClick={fetchHistory} className="w-7 h-7 rounded-full bg-[#0d2e24] flex items-center justify-center">
                      <RefreshCw size={12} className={`text-[#34d399] ${histLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>

                {histLoading && (
                  <div className="flex items-center justify-center py-10 gap-2">
                    <div className="w-5 h-5 border-2 border-[#34d399] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[13px] text-gray-500">Memuat dari MySQL...</span>
                  </div>
                )}

                {!histLoading && history.length === 0 && (
                  <div className="text-center py-10 text-gray-500">Belum ada data. Upload foto dulu!</div>
                )}

                <div className="grid grid-cols-2 divide-x divide-[#1e2d40]">
                  {history.map(row => {
                    const colors = getLabelColor(row.prediksi);
                    const maxConf = Math.max(row.normal_pct, row.imm_pct, row.mat_pct);
                    return (
                      <button key={row.id} onClick={() => setSelectedRow(row === selectedRow ? null : row)}
                        className={`flex items-center gap-4 px-6 py-4 hover:bg-[#1e2d40] transition-colors text-left border-b border-[#1e2d40] ${selectedRow?.id === row.id ? "bg-[#1e2d40]" : ""}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors.bg} border ${colors.border}`}>
                          {getLabelIcon(row.prediksi)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`} style={{ fontWeight: 600 }}>{row.prediksi}</span>
                            <span className="text-[11px] text-gray-500">#{row.id}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 flex items-center gap-1"><Clock size={10} className="shrink-0" /> {row.waktu}</p>
                        </div>
                        <span className={`text-[13px] ${colors.text} shrink-0`} style={{ fontWeight: 600 }}>{maxConf.toFixed(1)}%</span>
                        <ChevronRight size={14} className="text-gray-600 shrink-0" />
                      </button>
                    );
                  })}
                </div>

                {selectedRow && rowColors && (
                  <div className="mx-6 my-4 p-4 bg-[#111a27] rounded-xl border border-[#243044]">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Detail #{selectedRow.id}</p>
                    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${rowColors.bg} ${rowColors.border} mb-3`}>
                      <span className={`w-3 h-3 rounded-full ${rowColors.dot}`}></span>
                      {getLabelIcon(selectedRow.prediksi)}
                      <span className={`text-[14px] ${rowColors.text}`} style={{ fontWeight: 700 }}>{labelDisplay(selectedRow.prediksi)}</span>
                      <span className={`ml-auto text-[13px] ${rowColors.text}`} style={{ fontWeight: 600 }}>{selectedRow.confidence.toFixed(1)}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Normal",   value: selectedRow.normal_pct, color: "bg-emerald-500", text: "text-emerald-400" },
                        { label: "Immature", value: selectedRow.imm_pct,    color: "bg-amber-500",   text: "text-amber-400"   },
                        { label: "Mature",   value: selectedRow.mat_pct,    color: "bg-red-500",     text: "text-red-400"     },
                      ].map(item => (
                        <div key={item.label} className="bg-[#1a2332] p-3 rounded-xl border border-[#243044]">
                          <p className="text-[11px] text-gray-500 mb-1">{item.label}</p>
                          <p className={`text-[20px] ${item.text}`} style={{ fontWeight: 700 }}>{item.value.toFixed(1)}%</p>
                          <div className="h-1.5 rounded-full bg-[#243044] mt-2 overflow-hidden">
                            <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-600 mt-2 flex items-center gap-1"><Clock size={10} /> {selectedRow.waktu}</p>
                  </div>
                )}

                <div className="px-6 py-3 bg-[#111a27] border-t border-[#243044] flex items-center gap-2">
                  <Clock size={12} className="text-gray-600" />
                  <span className="text-[11px] text-gray-500">Diperbarui: {dateStr}, {timeStr}</span>
                </div>
              </div>
            </div>
          )}

          {/* STATISTIK — Desktop */}
          {activeTab === "stats" && (
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Total Scan",  value: statsData?.total    ?? 0, sub: "Dari MySQL",    color: "text-[#34d399]",    border: "border-[#34d399]"    },
                  { label: "Normal",      value: statsData?.Normal   ?? 0, sub: "Mata Sehat",    color: "text-emerald-400",  border: "border-emerald-500"  },
                  { label: "Immature",    value: statsData?.Immature ?? 0, sub: "Katarak Awal",  color: "text-amber-400",    border: "border-amber-500"    },
                  { label: "Mature",      value: statsData?.Mature   ?? 0, sub: "Katarak Lanjut",color: "text-red-400",      border: "border-red-500"      },
                ].map(s => (
                  <div key={s.label} className={`bg-[#1a2332] rounded-2xl shadow-lg p-5 border-t-4 ${s.border} border-x border-b border-[#243044]`}>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
                    {statsLoading
                      ? <div className="w-12 h-9 bg-[#243044] rounded animate-pulse my-1"></div>
                      : <p className={`text-[36px] ${s.color}`} style={{ fontWeight: 700 }}>{s.value}</p>
                    }
                    <p className="text-[12px] text-gray-500">{s.sub}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="bg-[#1a2332] rounded-2xl shadow-lg p-5 border border-[#243044]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BarChart2 size={16} className="text-[#34d399]" />
                      <h3 className="text-[14px] text-gray-300">Proporsi Klasifikasi (Real-time)</h3>
                    </div>
                    <button onClick={fetchStats} className="w-7 h-7 rounded-full bg-[#0d2e24] flex items-center justify-center">
                      <RefreshCw size={12} className={`text-[#34d399] ${statsLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                  {[
                    { label: "Normal",   count: statsData?.Normal   ?? 0, color: "bg-emerald-500", text: "text-emerald-400" },
                    { label: "Immature", count: statsData?.Immature ?? 0, color: "bg-amber-400",   text: "text-amber-400"   },
                    { label: "Mature",   count: statsData?.Mature   ?? 0, color: "bg-red-500",     text: "text-red-400"     },
                  ].map(item => {
                    const total = statsData?.total ?? 0;
                    return (
                      <div key={item.label} className="mb-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-[13px] text-gray-400">{item.label}</span>
                          <div className="flex items-center gap-1">
                            <span className={`text-[13px] ${item.text}`} style={{ fontWeight: 600 }}>{item.count}</span>
                            <span className="text-[11px] text-gray-600">({total > 0 ? ((item.count / total) * 100).toFixed(0) : 0}%)</span>
                          </div>
                        </div>
                        <div className="h-4 rounded-full bg-[#111a27] overflow-hidden">
                          <div className={`h-full rounded-full ${item.color} transition-all duration-700`}
                            style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-[#1a2332] rounded-2xl shadow-lg p-5 border border-[#243044]">
                  <div className="flex items-center gap-2 mb-4">
                    <Cpu size={15} className="text-[#34d399]" />
                    <h3 className="text-[14px] text-gray-300">Informasi Sistem</h3>
                  </div>
                  {[
                    { label: "Mikrokontroler",     value: "ESP32-CAM"              },
                    { label: "Modul Kamera",       value: "OV3660 (3MP)"           },
                    { label: "Metode Klasifikasi", value: "CNN (TensorFlow/Keras)" },
                    { label: "Database",           value: "MySQL (Railway)"        },
                    { label: "Kategori",           value: "Normal · Immature · Mature" },
                    { label: "Tanggal",            value: dateStr                  },
                    { label: "Versi Sistem",       value: "v2.0.0"                 },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#243044] last:border-0">
                      <span className="text-[12px] text-gray-500">{item.label}</span>
                      <span className="text-[13px] text-gray-300" style={{ fontWeight: 500 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-1.5 max-w-6xl mx-auto">
            <Eye size={12} className="text-[#34d399]" />
            <p className="text-[11px] text-gray-600">Deteksi Katarak IoT — ESP32-CAM · 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
