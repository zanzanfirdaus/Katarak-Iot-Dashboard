import { useState, useEffect } from "react";
import { Eye, Wifi, WifiOff, Clock, Camera, RefreshCw, ChevronRight, Activity, Cpu, BarChart2, AlertCircle, CheckCircle2, Info, Upload } from "lucide-react";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import cataractImg from "figma:asset/2ceb8a4f8fa5d490847a95f8070bade231855497.png";

// =============================================
// GANTI INI DENGAN LINK RAILWAY KAMU!
// =============================================
const API_URL = "https://web-production-08f648.up.railway.app";

// --- Mock Data ---
const eyeImages = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1770662082961-5c4dafcf173f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxodW1hbiUyMGV5ZSUyMGNsb3NlJTIwdXAlMjBtZWRpY2FsfGVufDF8fHx8MTc3NTMxNTAwM3ww&ixlib=rb-4.1.0&q=80&w=1080",
    label: "Normal",
    confidence: { normal: 91.4, immature: 6.2, mature: 2.4 },
    timestamp: "04 Apr 2026, 12:25:10",
    patientId: "FOTO-001",
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1761086555461-1098623cb04b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleWUlMjBpcmlzJTIwYmx1ZSUyMGNsb3NlJTIwbWFjcm98ZW58MXx8fHwxNzc1MzE1MDA2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    label: "Immature",
    confidence: { normal: 12.3, immature: 74.5, mature: 13.2 },
    timestamp: "04 Apr 2026, 11:58:44",
    patientId: "FOTO-002",
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1758656321505-95bf802f9a4c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXRhcmFjdCUyMGV5ZSUyMG9waHRoYWxtb2xvZ3klMjBleGFtaW5hdGlvbnxlbnwxfHx8fDE3NzUzMTUwMDZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    label: "Mature",
    confidence: { normal: 3.1, immature: 11.8, mature: 85.1 },
    timestamp: "04 Apr 2026, 11:30:22",
    patientId: "FOTO-003",
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1682663947178-4f652a459e2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxleWUlMjByZXRpbmElMjBzY2FuJTIwZGlhZ25vc3RpY3xlbnwxfHx8fDE3NzUzMTUwMDl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    label: "Immature",
    confidence: { normal: 8.6, immature: 81.2, mature: 10.2 },
    timestamp: "04 Apr 2026, 10:55:05",
    patientId: "FOTO-004",
  },
];

const getLabelColor = (label: string) => {
  if (label === "Normal") return { bg: "bg-emerald-900/40", text: "text-emerald-400", dot: "bg-emerald-500", border: "border-emerald-700" };
  if (label === "Immature") return { bg: "bg-amber-900/40", text: "text-amber-400", dot: "bg-amber-500", border: "border-amber-700" };
  if (label === "Mature") return { bg: "bg-red-900/40", text: "text-red-400", dot: "bg-red-500", border: "border-red-800" };
  return { bg: "bg-gray-800", text: "text-gray-400", dot: "bg-gray-500", border: "border-gray-700" };
};

const getLabelIcon = (label: string) => {
  if (label === "Normal") return <CheckCircle2 size={14} className="text-emerald-400" />;
  if (label === "Immature") return <AlertCircle size={14} className="text-amber-400" />;
  if (label === "Mature") return <AlertCircle size={14} className="text-red-400" />;
  return <Info size={14} />;
};

function useCurrentTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

export default function App() {
  const [connected, setConnected] = useState(true);
  const [selectedImg, setSelectedImg] = useState(eyeImages[0]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"latest" | "history" | "stats" | "upload">("latest");
  const now = useCurrentTime();

  // ===== STATE UPLOAD =====
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<null | {
    label: string;
    confidence: number;
    normal?: number;
    immature?: number;
    mature?: number;
  }>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  // ===== FUNGSI UPLOAD FOTO KE API =====
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview foto yang diupload
    const objectUrl = URL.createObjectURL(file);
    setUploadedImageUrl(objectUrl);
    setUploadResult(null);
    setUploadError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Gagal konek ke API");

      const data = await res.json();
      setUploadResult(data);
    } catch (err) {
      setUploadError("Gagal konek ke API Railway. Pastikan API aktif!");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const stats = {
    total: eyeImages.length,
    normal: eyeImages.filter((e) => e.label === "Normal").length,
    immature: eyeImages.filter((e) => e.label === "Immature").length,
    mature: eyeImages.filter((e) => e.label === "Mature").length,
  };

  const labelColors = getLabelColor(selectedImg.label);

  // ===== SHARED COMPONENTS =====

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
        <span className="text-[13px] text-gray-400">Sistem Deteksi Katarak</span>
        <span className="ml-auto bg-[#2a2010] text-[#f59e0b] text-[11px] px-2 py-0.5 rounded-full border border-[#78500a]" style={{ fontWeight: 600 }}>2026</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setConnected(!connected)}
          className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border ${connected ? "border-emerald-800 bg-emerald-900/30" : "border-red-800 bg-red-900/30"}`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
          <div className="text-left">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Status Koneksi</p>
            <p className={`text-[13px] ${connected ? "text-emerald-400" : "text-red-400"}`} style={{ fontWeight: 600 }}>
              {connected ? "Terhubung" : "Terputus"}
            </p>
          </div>
          {connected ? <Wifi size={16} className="ml-auto text-emerald-500" /> : <WifiOff size={16} className="ml-auto text-red-400" />}
        </button>
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

  const DeviceInfoCard = () => (
    <div className="bg-[#1a2332] rounded-2xl shadow-lg p-4 border border-[#243044]">
      <div className="flex items-center gap-2 mb-3">
        <Cpu size={15} className="text-[#34d399]" />
        <h3 className="text-[14px] text-gray-300">Informasi Perangkat</h3>
      </div>
      <div className="space-y-2">
        {[
          { label: "Device", value: "ESP32-CAM" },
          { label: "Resolusi Kamera", value: "OV2640 — 1600×1200" },
          { label: "Terakhir Kirim", value: connected ? selectedImg.timestamp : "--" },
          { label: "Jumlah Foto", value: connected ? `${eyeImages.length} foto` : "--" },
        ].map((item) => (
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
  );

  const KeteranganCard = () => (
    <div className="bg-[#1a2332] rounded-2xl shadow-lg p-4 border border-[#243044]">
      <div className="flex items-center gap-2 mb-3">
        <Info size={15} className="text-[#38bdf8]" />
        <h3 className="text-[14px] text-gray-300">Keterangan Klasifikasi</h3>
      </div>
      {[
        { label: "Normal", desc: "Lensa mata jernih, tidak ditemukan kekeruhan.", color: "bg-emerald-500" },
        { label: "Immature", desc: "Kekeruhan sebagian, lensa belum sepenuhnya keruh.", color: "bg-amber-500" },
        { label: "Mature", desc: "Lensa mata sepenuhnya keruh, perlu tindakan medis.", color: "bg-red-500" },
      ].map((item) => (
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

  const ImageCard = () => (
    <div className="bg-[#1a2332] rounded-2xl shadow-lg overflow-hidden border border-[#243044]">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera size={18} className="text-[#34d399]" />
          <h2 className="text-[15px] text-gray-200">Tangkapan Terbaru</h2>
        </div>
        <button
          onClick={handleRefresh}
          className={`w-8 h-8 rounded-full bg-[#0d2e24] flex items-center justify-center ${refreshing ? "animate-spin" : ""}`}
        >
          <RefreshCw size={14} className="text-[#34d399]" />
        </button>
      </div>
      <div className="relative mx-4 rounded-xl overflow-hidden bg-gray-950" style={{ aspectRatio: "4/3" }}>
        <ImageWithFallback
          src={selectedImg.url}
          alt="ESP32-CAM capture"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)" }}>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-white text-[11px]" style={{ fontWeight: 600 }}>Hasil Foto ESP32-CAM</span>
          </div>
          <span className="text-white text-[10px] bg-black/40 px-2 py-0.5 rounded-full">{selectedImg.patientId}</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)" }}>
          <p className="text-white text-[11px] opacity-80">{selectedImg.timestamp}</p>
        </div>
      </div>

      {/* Classification Result */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Hasil Klasifikasi</p>
        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${labelColors.bg} ${labelColors.border}`}>
          <span className={`w-3 h-3 rounded-full ${labelColors.dot}`}></span>
          <div className="flex items-center gap-1.5">
            {getLabelIcon(selectedImg.label)}
            <span className={`text-[15px] ${labelColors.text}`} style={{ fontWeight: 700 }}>
              {selectedImg.label === "Normal" ? "Mata Normal" : selectedImg.label === "Immature" ? "Katarak Immature" : "Katarak Mature"}
            </span>
          </div>
          <span className={`ml-auto text-[13px] ${labelColors.text}`} style={{ fontWeight: 600 }}>
            {Math.max(selectedImg.confidence.normal, selectedImg.confidence.immature, selectedImg.confidence.mature).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Confidence Bars */}
      <div className="px-4 pb-4">
        <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2 mt-1">Distribusi Kepercayaan</p>
        {[
          { key: "normal", label: "Normal", value: selectedImg.confidence.normal, color: "bg-emerald-500" },
          { key: "immature", label: "Immature", value: selectedImg.confidence.immature, color: "bg-amber-500" },
          { key: "mature", label: "Mature", value: selectedImg.confidence.mature, color: "bg-red-500" },
        ].map((item) => (
          <div key={item.key} className="mb-2">
            <div className="flex justify-between mb-1">
              <span className="text-[12px] text-gray-400">{item.label}</span>
              <span className="text-[12px] text-gray-300" style={{ fontWeight: 600 }}>{item.value.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#111a27] overflow-hidden">
              <div
                className={`h-full rounded-full ${item.color} transition-all duration-700`}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ===== UPLOAD CARD =====
  const UploadCard = () => {
    const resultColors = uploadResult ? getLabelColor(uploadResult.label) : null;
    return (
      <div className="bg-[#1a2332] rounded-2xl shadow-lg overflow-hidden border border-[#243044]">
        <div className="px-4 pt-4 pb-3 flex items-center gap-2">
          <Upload size={18} className="text-[#34d399]" />
          <h2 className="text-[15px] text-gray-200">Uji Foto Manual</h2>
        </div>

        {/* Upload Area */}
        <div className="mx-4 mb-4">
          <label className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-[#243044] rounded-xl cursor-pointer hover:border-[#34d399] hover:bg-[#0d2e24]/20 transition-all">
            <div className="w-12 h-12 rounded-full bg-[#0d2e24] flex items-center justify-center">
              <Camera size={22} className="text-[#34d399]" />
            </div>
            <div className="text-center">
              <p className="text-[13px] text-gray-300" style={{ fontWeight: 600 }}>Klik untuk upload foto mata</p>
              <p className="text-[11px] text-gray-500 mt-1">JPG, PNG, JPEG — Maks 10MB</p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Preview Foto */}
        {uploadedImageUrl && (
          <div className="mx-4 mb-4">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Preview Foto</p>
            <div className="rounded-xl overflow-hidden bg-gray-950" style={{ aspectRatio: "4/3" }}>
              <img src={uploadedImageUrl} alt="Upload preview" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* Loading */}
        {uploading && (
          <div className="mx-4 mb-4 flex items-center gap-3 px-4 py-3 bg-[#111a27] rounded-xl border border-[#243044]">
            <div className="w-4 h-4 border-2 border-[#34d399] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[13px] text-[#34d399]">Menganalisis foto ke API...</span>
          </div>
        )}

        {/* Error */}
        {uploadError && (
          <div className="mx-4 mb-4 px-4 py-3 bg-red-900/30 rounded-xl border border-red-800">
            <p className="text-[13px] text-red-400">{uploadError}</p>
          </div>
        )}

        {/* Hasil */}
        {uploadResult && resultColors && (
          <div className="mx-4 mb-4">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Hasil Analisis AI</p>
            <div className={`flex items-center gap-2 px-3 py-3 rounded-xl border ${resultColors.bg} ${resultColors.border} mb-3`}>
              <span className={`w-3 h-3 rounded-full ${resultColors.dot}`}></span>
              <div className="flex items-center gap-1.5">
                {getLabelIcon(uploadResult.label)}
                <span className={`text-[15px] ${resultColors.text}`} style={{ fontWeight: 700 }}>
                  {uploadResult.label === "Normal" ? "Mata Normal" : uploadResult.label === "Immature" ? "Katarak Immature" : "Katarak Mature"}
                </span>
              </div>
              <span className={`ml-auto text-[13px] ${resultColors.text}`} style={{ fontWeight: 600 }}>
                {uploadResult.confidence.toFixed(1)}%
              </span>
            </div>

            {/* Confidence bars jika ada detail */}
            {(uploadResult.normal !== undefined) && (
              <>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Distribusi Kepercayaan</p>
                {[
                  { key: "normal", label: "Normal", value: uploadResult.normal ?? 0, color: "bg-emerald-500" },
                  { key: "immature", label: "Immature", value: uploadResult.immature ?? 0, color: "bg-amber-500" },
                  { key: "mature", label: "Mature", value: uploadResult.mature ?? 0, color: "bg-red-500" },
                ].map((item) => (
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
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const HistoryCard = () => (
    <div className="bg-[#1a2332] rounded-2xl shadow-lg overflow-hidden border border-[#243044]">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw size={16} className="text-[#34d399]" />
          <h2 className="text-[15px] text-gray-200">Riwayat Tangkapan</h2>
        </div>
        <span className="text-[11px] text-gray-500 bg-[#111a27] border border-[#243044] px-2 py-0.5 rounded-full">{eyeImages.length} foto</span>
      </div>
      <div className="divide-y divide-[#1e2d40]">
        {eyeImages.map((img) => {
          const colors = getLabelColor(img.label);
          return (
            <button
              key={img.id}
              onClick={() => { setSelectedImg(img); setActiveTab("latest"); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1e2d40] transition-colors text-left"
            >
              <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-[#111a27]">
                <ImageWithFallback src={img.url} alt={img.label} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`} style={{ fontWeight: 600 }}>
                    {img.label}
                  </span>
                  <span className="text-[11px] text-gray-500">{img.patientId}</span>
                </div>
                <p className="text-[11px] text-gray-500 flex items-center gap-1">
                  <Clock size={10} className="shrink-0" /> {img.timestamp}
                </p>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  Kepercayaan: <span style={{ fontWeight: 600 }}>{Math.max(img.confidence.normal, img.confidence.immature, img.confidence.mature).toFixed(1)}%</span>
                </p>
              </div>
              <ChevronRight size={14} className="text-gray-600 shrink-0" />
            </button>
          );
        })}
      </div>
      <div className="px-4 py-3 bg-[#111a27] border-t border-[#243044] flex items-center gap-2">
        <Clock size={12} className="text-gray-600" />
        <span className="text-[11px] text-gray-500">Diperbarui: {dateStr}, {timeStr}</span>
      </div>
    </div>
  );

  const StatsCards = () => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Scan", value: stats.total, sub: "Foto Teranalisis", color: "text-[#34d399]" },
          { label: "Normal", value: stats.normal, sub: "Mata Sehat", color: "text-emerald-400" },
          { label: "Immature", value: stats.immature, sub: "Katarak Awal", color: "text-amber-400" },
          { label: "Mature", value: stats.mature, sub: "Katarak Lanjut", color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="bg-[#1a2332] rounded-2xl shadow-lg p-3 border border-[#243044]">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-[28px] ${s.color}`} style={{ fontWeight: 700 }}>{s.value}</p>
            <p className="text-[11px] text-gray-500">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#1a2332] rounded-2xl shadow-lg p-4 mt-3 border border-[#243044]">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={16} className="text-[#34d399]" />
          <h3 className="text-[14px] text-gray-300">Proporsi Klasifikasi</h3>
        </div>
        {[
          { label: "Normal", count: stats.normal, color: "bg-emerald-500", text: "text-emerald-400" },
          { label: "Immature", count: stats.immature, color: "bg-amber-400", text: "text-amber-400" },
          { label: "Mature", count: stats.mature, color: "bg-red-500", text: "text-red-400" },
        ].map((item) => (
          <div key={item.label} className="mb-3">
            <div className="flex justify-between mb-1">
              <span className="text-[13px] text-gray-400">{item.label}</span>
              <div className="flex items-center gap-1">
                <span className={`text-[13px] ${item.text}`} style={{ fontWeight: 600 }}>{item.count}</span>
                <span className="text-[11px] text-gray-600">({((item.count / stats.total) * 100).toFixed(0)}%)</span>
              </div>
            </div>
            <div className="h-3 rounded-full bg-[#111a27] overflow-hidden">
              <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: `${(item.count / stats.total) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#1a2332] rounded-2xl shadow-lg p-4 mt-3 border border-[#243044]">
        <div className="flex items-center gap-2 mb-3">
          <Cpu size={15} className="text-[#34d399]" />
          <h3 className="text-[14px] text-gray-300">Sistem</h3>
        </div>
        {[
          { label: "Mikrokontroler", value: "ESP32-CAM" },
          { label: "Modul Kamera", value: "OV2640 (2MP)" },
          { label: "Metode Klasifikasi", value: "Machine Learning / CNN" },
          { label: "Kategori", value: "Normal · Immature · Mature" },
          { label: "Tanggal", value: dateStr },
          { label: "Versi Sistem", value: "v1.0.0" },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-[#243044] last:border-0">
            <span className="text-[12px] text-gray-500">{item.label}</span>
            <span className="text-[12px] text-gray-300" style={{ fontWeight: 500 }}>{item.value}</span>
          </div>
        ))}
      </div>
    </>
  );

  const Tabs = () => (
    <div className="flex bg-[#111a27] rounded-2xl shadow-lg p-1 gap-1 border border-[#243044]">
      {[
        { key: "latest", label: "Tangkapan", icon: <Camera size={13} /> },
        { key: "history", label: "Riwayat", icon: <RefreshCw size={13} /> },
        { key: "stats", label: "Statistik", icon: <BarChart2 size={13} /> },
        { key: "upload", label: "Uji Foto", icon: <Upload size={13} /> },
      ].map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key as typeof activeTab)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] transition-all ${
            activeTab === tab.key ? "bg-[#1a5c42] text-[#34d399] shadow" : "text-gray-500 hover:bg-[#1a2332] hover:text-gray-300"
          }`}
        >
          {tab.icon}
          <span style={{ fontWeight: activeTab === tab.key ? 600 : 400 }}>{tab.label}</span>
        </button>
      ))}
    </div>
  );

  const Footer = () => (
    <div className="mt-4 flex items-center justify-center gap-1.5">
      <Eye size={12} className="text-[#34d399]" />
      <p className="text-[11px] text-gray-600">Deteksi Katarak IoT — ESP32-CAM · 2026</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b1120]">

      {/* ==============================
          MOBILE LAYOUT (< lg)
      ============================== */}
      <div className="lg:hidden flex justify-center">
        <div className="w-full max-w-md min-h-screen flex flex-col pb-6 px-3 pt-4 gap-3">
          <Header />
          <Tabs />
          {activeTab === "latest" && (
            <>
              <ImageCard />
              <DeviceInfoCard />
              <KeteranganCard />
            </>
          )}
          {activeTab === "history" && <HistoryCard />}
          {activeTab === "stats" && <StatsCards />}
          {activeTab === "upload" && (
            <>
              <UploadCard />
              <KeteranganCard />
            </>
          )}
          <Footer />
        </div>
      </div>

      {/* ==============================
          DESKTOP LAYOUT (>= lg)
      ============================== */}
      <div className="hidden lg:flex flex-col min-h-screen">
        {/* Desktop Top Bar */}
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
            <button
              onClick={() => setConnected(!connected)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[12px] ${connected ? "border-emerald-800 bg-emerald-900/30 text-emerald-400" : "border-red-800 bg-red-900/30 text-red-400"}`}
            >
              <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
              {connected ? "Terhubung" : "Terputus"}
              {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
            </button>
            <div className="flex items-center gap-1.5 text-gray-400">
              <Clock size={14} className="text-[#34d399]" />
              <span className="text-[13px] text-gray-200" style={{ fontWeight: 600 }}>{timeStr}</span>
              <span className="text-[12px] text-gray-500">· {dateStr}</span>
            </div>
          </div>
        </div>

        {/* Desktop Tab Bar */}
        <div className="bg-[#0f1929] border-b border-[#1e2d40] px-8 flex gap-1 pt-2">
          {[
            { key: "latest", label: "Tangkapan Foto", icon: <Camera size={14} /> },
            { key: "history", label: "Riwayat", icon: <RefreshCw size={14} /> },
            { key: "stats", label: "Statistik", icon: <BarChart2 size={14} /> },
            { key: "upload", label: "Uji Foto Manual", icon: <Upload size={14} /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-[13px] border-b-2 transition-all ${
                activeTab === tab.key
                  ? "border-[#34d399] text-[#34d399] bg-[#0d2e24]/50"
                  : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-[#1a2332]"
              }`}
            >
              {tab.icon}
              <span style={{ fontWeight: activeTab === tab.key ? 600 : 400 }}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Desktop Content */}
        <div className="flex-1 px-8 py-6 overflow-auto">

          {activeTab === "latest" && (
            <div className="grid grid-cols-2 gap-6 max-w-6xl mx-auto">
              <div className="flex flex-col gap-5">
                <div className="bg-[#1a2332] rounded-2xl shadow-lg overflow-hidden border border-[#243044]">
                  <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera size={18} className="text-[#34d399]" />
                      <h2 className="text-[15px] text-gray-200">Tangkapan Terbaru</h2>
                    </div>
                    <button
                      onClick={handleRefresh}
                      className={`w-8 h-8 rounded-full bg-[#0d2e24] flex items-center justify-center ${refreshing ? "animate-spin" : ""}`}
                    >
                      <RefreshCw size={14} className="text-[#34d399]" />
                    </button>
                  </div>
                  <div className="mx-5 rounded-xl overflow-hidden bg-gray-950 relative" style={{ aspectRatio: "4/3" }}>
                    <ImageWithFallback src={selectedImg.url} alt="ESP32-CAM capture" className="w-full h-full object-cover" />
                    <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)" }}>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="text-white text-[11px]" style={{ fontWeight: 600 }}>Hasil Foto ESP32-CAM</span>
                      </div>
                      <span className="text-white text-[10px] bg-black/40 px-2 py-0.5 rounded-full">{selectedImg.patientId}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 px-3 py-2" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)" }}>
                      <p className="text-white text-[11px] opacity-80">{selectedImg.timestamp}</p>
                    </div>
                  </div>
                  <div className="px-5 pt-4 pb-5">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-2">Pilih Foto Lain</p>
                    <div className="grid grid-cols-4 gap-2">
                      {eyeImages.map((img) => {
                        const c = getLabelColor(img.label);
                        return (
                          <button
                            key={img.id}
                            onClick={() => setSelectedImg(img)}
                            className={`relative rounded-lg overflow-hidden border-2 transition-all ${selectedImg.id === img.id ? "border-[#34d399]" : "border-[#243044]"}`}
                            style={{ aspectRatio: "1/1" }}
                          >
                            <ImageWithFallback src={img.url} alt={img.label} className="w-full h-full object-cover" />
                            <div className={`absolute bottom-0 left-0 right-0 py-0.5 text-center text-[9px] ${c.bg} ${c.text}`} style={{ fontWeight: 600 }}>
                              {img.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <div className="bg-[#1a2332] rounded-2xl shadow-lg p-5 border border-[#243044]">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-3">Hasil Klasifikasi</p>
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-4 border ${labelColors.bg} ${labelColors.border}`}>
                    <span className={`w-3 h-3 rounded-full ${labelColors.dot}`}></span>
                    <div className="flex items-center gap-1.5">
                      {getLabelIcon(selectedImg.label)}
                      <span className={`text-[16px] ${labelColors.text}`} style={{ fontWeight: 700 }}>
                        {selectedImg.label === "Normal" ? "Mata Normal" : selectedImg.label === "Immature" ? "Katarak Immature" : "Katarak Mature"}
                      </span>
                    </div>
                    <span className={`ml-auto text-[14px] ${labelColors.text}`} style={{ fontWeight: 700 }}>
                      {Math.max(selectedImg.confidence.normal, selectedImg.confidence.immature, selectedImg.confidence.mature).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-3">Distribusi Kepercayaan</p>
                  {[
                    { key: "normal", label: "Normal", value: selectedImg.confidence.normal, color: "bg-emerald-500" },
                    { key: "immature", label: "Immature", value: selectedImg.confidence.immature, color: "bg-amber-500" },
                    { key: "mature", label: "Mature", value: selectedImg.confidence.mature, color: "bg-red-500" },
                  ].map((item) => (
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
                </div>
                <div className="bg-[#1a2332] rounded-2xl shadow-lg p-5 border border-[#243044]">
                  <div className="flex items-center gap-2 mb-3">
                    <Cpu size={15} className="text-[#34d399]" />
                    <h3 className="text-[14px] text-gray-300">Informasi Perangkat</h3>
                  </div>
                  {[
                    { label: "Device", value: "ESP32-CAM" },
                    { label: "Resolusi Kamera", value: "OV2640 — 1600×1200" },
                    { label: "Terakhir Kirim", value: connected ? selectedImg.timestamp : "--" },
                    { label: "Jumlah Foto", value: connected ? `${eyeImages.length} foto` : "--" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-[#243044] last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                        <span className="text-[12px] text-gray-500">{item.label}</span>
                      </div>
                      <span className="text-[12px] text-gray-300" style={{ fontWeight: 500 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-[#1a2332] rounded-2xl shadow-lg p-5 border border-[#243044]">
                  <div className="flex items-center gap-2 mb-3">
                    <Info size={15} className="text-[#38bdf8]" />
                    <h3 className="text-[14px] text-gray-300">Keterangan Klasifikasi</h3>
                  </div>
                  {[
                    { label: "Normal", desc: "Lensa mata jernih, tidak ditemukan kekeruhan.", color: "bg-emerald-500" },
                    { label: "Immature", desc: "Kekeruhan sebagian, lensa belum sepenuhnya keruh.", color: "bg-amber-500" },
                    { label: "Mature", desc: "Lensa mata sepenuhnya keruh, perlu tindakan medis.", color: "bg-red-500" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-2.5 mb-2">
                      <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${item.color}`}></span>
                      <div>
                        <span className="text-[12px] text-gray-200" style={{ fontWeight: 600 }}>{item.label}:</span>
                        <span className="text-[12px] text-gray-500"> {item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="max-w-6xl mx-auto">
              <div className="bg-[#1a2332] rounded-2xl shadow-lg overflow-hidden border border-[#243044]">
                <div className="px-6 pt-5 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw size={16} className="text-[#34d399]" />
                    <h2 className="text-[15px] text-gray-200">Riwayat Tangkapan</h2>
                  </div>
                  <span className="text-[11px] text-gray-500 bg-[#111a27] border border-[#243044] px-2 py-0.5 rounded-full">{eyeImages.length} foto</span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-[#1e2d40]">
                  {eyeImages.map((img) => {
                    const colors = getLabelColor(img.label);
                    return (
                      <button
                        key={img.id}
                        onClick={() => { setSelectedImg(img); setActiveTab("latest"); }}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-[#1e2d40] transition-colors text-left border-b border-[#1e2d40]"
                      >
                        <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 bg-[#111a27]">
                          <ImageWithFallback src={img.url} alt={img.label} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`} style={{ fontWeight: 600 }}>{img.label}</span>
                            <span className="text-[11px] text-gray-500">{img.patientId}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 flex items-center gap-1">
                            <Clock size={10} className="shrink-0" /> {img.timestamp}
                          </p>
                          <p className="text-[12px] text-gray-400 mt-0.5">
                            Kepercayaan: <span style={{ fontWeight: 600 }}>{Math.max(img.confidence.normal, img.confidence.immature, img.confidence.mature).toFixed(1)}%</span>
                          </p>
                        </div>
                        <ChevronRight size={14} className="text-gray-600 shrink-0" />
                      </button>
                    );
                  })}
                </div>
                <div className="px-6 py-3 bg-[#111a27] border-t border-[#243044] flex items-center gap-2">
                  <Clock size={12} className="text-gray-600" />
                  <span className="text-[11px] text-gray-500">Diperbarui: {dateStr}, {timeStr}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "stats" && (
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Total Scan", value: stats.total, sub: "Foto Teranalisis", color: "text-[#34d399]", border: "border-[#34d399]" },
                  { label: "Normal", value: stats.normal, sub: "Mata Sehat", color: "text-emerald-400", border: "border-emerald-500" },
                  { label: "Immature", value: stats.immature, sub: "Katarak Awal", color: "text-amber-400", border: "border-amber-500" },
                  { label: "Mature", value: stats.mature, sub: "Katarak Lanjut", color: "text-red-400", border: "border-red-500" },
                ].map((s) => (
                  <div key={s.label} className={`bg-[#1a2332] rounded-2xl shadow-lg p-5 border-t-4 ${s.border} border-x border-b border-[#243044]`}>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
                    <p className={`text-[36px] ${s.color}`} style={{ fontWeight: 700 }}>{s.value}</p>
                    <p className="text-[12px] text-gray-500">{s.sub}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="bg-[#1a2332] rounded-2xl shadow-lg p-5 border border-[#243044]">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart2 size={16} className="text-[#34d399]" />
                    <h3 className="text-[14px] text-gray-300">Proporsi Klasifikasi</h3>
                  </div>
                  {[
                    { label: "Normal", count: stats.normal, color: "bg-emerald-500", text: "text-emerald-400" },
                    { label: "Immature", count: stats.immature, color: "bg-amber-400", text: "text-amber-400" },
                    { label: "Mature", count: stats.mature, color: "bg-red-500", text: "text-red-400" },
                  ].map((item) => (
                    <div key={item.label} className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-[13px] text-gray-400">{item.label}</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[13px] ${item.text}`} style={{ fontWeight: 600 }}>{item.count}</span>
                          <span className="text-[11px] text-gray-600">({((item.count / stats.total) * 100).toFixed(0)}%)</span>
                        </div>
                      </div>
                      <div className="h-4 rounded-full bg-[#111a27] overflow-hidden">
                        <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: `${(item.count / stats.total) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-[#1a2332] rounded-2xl shadow-lg p-5 border border-[#243044]">
                  <div className="flex items-center gap-2 mb-4">
                    <Cpu size={15} className="text-[#34d399]" />
                    <h3 className="text-[14px] text-gray-300">Informasi Sistem</h3>
                  </div>
                  {[
                    { label: "Mikrokontroler", value: "ESP32-CAM" },
                    { label: "Modul Kamera", value: "OV2640 (2MP)" },
                    { label: "Metode Klasifikasi", value: "Machine Learning / CNN" },
                    { label: "Kategori", value: "Normal · Immature · Mature" },
                    { label: "Tanggal", value: dateStr },
                    { label: "Versi Sistem", value: "v1.0.0" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#243044] last:border-0">
                      <span className="text-[12px] text-gray-500">{item.label}</span>
                      <span className="text-[13px] text-gray-300" style={{ fontWeight: 500 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* UPLOAD TAB — Desktop */}
          {activeTab === "upload" && (
            <div className="grid grid-cols-2 gap-6 max-w-6xl mx-auto">
              <UploadCard />
              <div className="flex flex-col gap-5">
                <KeteranganCard />
                <div className="bg-[#1a2332] rounded-2xl p-5 border border-[#243044]">
                  <div className="flex items-center gap-2 mb-3">
                    <Info size={15} className="text-[#38bdf8]" />
                    <h3 className="text-[14px] text-gray-300">Cara Penggunaan</h3>
                  </div>
                  {[
                    "Klik area upload dan pilih foto mata",
                    "Foto akan dikirim ke API Railway",
                    "AI akan menganalisis tingkat katarak",
                    "Hasil ditampilkan dalam detik",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3 mb-3">
                      <span className="w-5 h-5 rounded-full bg-[#0d2e24] border border-[#1a5c42] flex items-center justify-center text-[11px] text-[#34d399] shrink-0" style={{ fontWeight: 700 }}>{i + 1}</span>
                      <span className="text-[12px] text-gray-400">{step}</span>
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
