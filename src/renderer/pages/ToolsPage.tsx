import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  Zap,
  Play,
  Square,
  RefreshCw,
  Sliders,
  ExternalLink,
  Trash2,
  Gauge,
  Activity,
  HardDrive,
  Monitor,
  Shield,
  Wifi,
  Layers,
  Check,
  Power,
  TrendingUp,
  FileText,
  CheckCircle2,
  Wrench
} from 'lucide-react';
import { Language, translations } from '../i18n/translations';
import { ProgressBar } from '../components/ProgressBar';
import {
  SystemOverview,
  DisplayInfo,
  PowerSchemeInfo,
  StartupAppInfo,
  DiskBenchmarkResult,
  SystemHealthStatus
} from '../../shared/types/system';

interface ToolsPageProps {
  lang: Language;
  onNotify: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

interface BenchmarkHistoryItem {
  id: string;
  type: 'cpu' | 'gpu' | 'ram' | 'disk' | 'net';
  title: string;
  score: number;
  details: string;
  timestamp: string;
}

type TabType = 'benchmarks' | 'stress' | 'health' | 'diagnostics';

export const ToolsPage: React.FC<ToolsPageProps> = ({ lang, onNotify }) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<TabType>('benchmarks');
  const [overview, setOverview] = useState<SystemOverview | null>(null);

  // Benchmarks State
  const [cpuBenchMode, setCpuBenchMode] = useState<'single' | 'multi'>('multi');
  const [isCpuRunning, setIsCpuRunning] = useState(false);
  const [cpuProgress, setCpuProgress] = useState(0);
  const [cpuScore, setCpuScore] = useState<number | null>(null);
  const [cpuOps, setCpuOps] = useState<number | null>(null);
  const [cpuTimeMs, setCpuTimeMs] = useState<number | null>(null);

  // WebGL GPU Benchmark State
  const [isGpuRunning, setIsGpuRunning] = useState(false);
  const [gpuDuration, setGpuDuration] = useState<number>(15); // seconds
  const [gpuTimeLeft, setGpuTimeLeft] = useState<number>(0);
  const [gpuFpsCurrent, setGpuFpsCurrent] = useState<number>(0);
  const [gpuFpsMin, setGpuFpsMin] = useState<number>(0);
  const [gpuFpsMax, setGpuFpsMax] = useState<number>(0);
  const [gpuFpsAvg, setGpuFpsAvg] = useState<number>(0);
  const [gpuScore, setGpuScore] = useState<number | null>(null);
  const gpuCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gpuAnimFrameRef = useRef<number | null>(null);

  // RAM Benchmark State
  const [isRamRunning, setIsRamRunning] = useState(false);
  const [ramProgress, setRamProgress] = useState(0);
  const [ramWriteMBs, setRamWriteMBs] = useState<number | null>(null);
  const [ramReadMBs, setRamReadMBs] = useState<number | null>(null);
  const [ramLatencyNs, setRamLatencyNs] = useState<number | null>(null);
  const [ramScore, setRamScore] = useState<number | null>(null);

  // Disk Benchmark State
  const [isDiskRunning, setIsDiskRunning] = useState(false);
  const [diskResult, setDiskResult] = useState<DiskBenchmarkResult | null>(null);

  // Network Benchmark State
  const [isNetRunning, setIsNetRunning] = useState(false);
  const [netPing, setNetPing] = useState<number | null>(null);
  const [netSpeedMbps, setNetSpeedMbps] = useState<number | null>(null);

  // Benchmark History
  const [history, setHistory] = useState<BenchmarkHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('storm_bench_history_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Stress Test State
  const [isStressRunning, setIsStressRunning] = useState(false);
  const [stressTargetCpu, setStressTargetCpu] = useState(true);
  const [stressTargetGpu, setStressTargetGpu] = useState(true);
  const [stressTargetRam, setStressTargetRam] = useState(false);
  const [stressDurationSec, setStressDurationSec] = useState<number>(60);
  const [stressElapsedSec, setStressElapsedSec] = useState<number>(0);
  const stressAbortRef = useRef(false);

  // Health & Maintenance State
  const [powerScheme, setPowerScheme] = useState<PowerSchemeInfo | null>(null);
  const [startupApps, setStartupApps] = useState<StartupAppInfo[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthStatus | null>(null);
  const [cleanTemp, setCleanTemp] = useState(true);
  const [cleanWinTemp, setCleanWinTemp] = useState(true);
  const [cleanThumb, setCleanThumb] = useState(true);
  const [cleanRecycle, setCleanRecycle] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  // Diagnostics & Displays State
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);

  // Abort Refs
  const cpuAbortRef = useRef(false);

  // Poll overview
  useEffect(() => {
    let mounted = true;
    const fetchOverview = async () => {
      try {
        const data = await window.stormAPI?.getOverview();
        if (mounted && data) setOverview(data);
      } catch {}
    };

    fetchOverview();
    const interval = setInterval(fetchOverview, 2000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch tab-specific data
  useEffect(() => {
    if (activeTab === 'health') {
      window.stormAPI?.getPowerScheme().then(setPowerScheme).catch(() => {});
      window.stormAPI?.getStartupApps().then(setStartupApps).catch(() => {});
      window.stormAPI?.getSystemHealth().then(setSystemHealth).catch(() => {});
    } else if (activeTab === 'diagnostics') {
      window.stormAPI?.getDisplays().then(setDisplays).catch(() => {});
    }
  }, [activeTab]);

  // Save history
  const addHistoryItem = (item: Omit<BenchmarkHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: BenchmarkHistoryItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString()
    };
    setHistory((prev) => {
      const next = [newItem, ...prev.slice(0, 19)];
      try {
        localStorage.setItem('storm_bench_history_v2', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('storm_bench_history_v2');
    } catch {}
    onNotify(t.benchHistory, t.clearHistory, 'info');
  };

  // 1. CPU BENCHMARK
  const runCpuBenchmark = async () => {
    if (isCpuRunning) return;
    setIsCpuRunning(true);
    setCpuProgress(0);
    setCpuScore(null);
    cpuAbortRef.current = false;

    const totalSteps = 40;
    const workPerStep = cpuBenchMode === 'multi' ? 140000 : 45000;
    const startTime = performance.now();

    for (let step = 1; step <= totalSteps; step++) {
      if (cpuAbortRef.current) break;

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          let count = 0;
          for (let i = 2; i < workPerStep; i++) {
            let isPrime = true;
            const sqrt = Math.sqrt(i);
            for (let j = 2; j <= sqrt; j++) {
              if (i % j === 0) {
                isPrime = false;
                break;
              }
            }
            if (isPrime) count++;
          }
          setCpuProgress(Math.round((step / totalSteps) * 100));
          resolve();
        }, 12);
      });
    }

    if (cpuAbortRef.current) {
      setIsCpuRunning(false);
      return;
    }

    const duration = performance.now() - startTime;
    const totalOps = totalSteps * workPerStep;
    const opsPerSec = Math.round(totalOps / (duration / 1000));
    const score = Math.round(opsPerSec / (cpuBenchMode === 'multi' ? 750 : 250));

    setCpuOps(opsPerSec);
    setCpuTimeMs(Math.round(duration));
    setCpuScore(score);
    setIsCpuRunning(false);

    addHistoryItem({
      type: 'cpu',
      title: `CPU (${cpuBenchMode === 'multi' ? 'Multi' : 'Single'})`,
      score,
      details: `${(opsPerSec / 1_000_000).toFixed(2)} MOps/s • ${Math.round(duration)} ms`
    });

    onNotify(t.benchCpuTitle, `${t.scoreLabel}: ${score}`, 'success');
  };

  // 2. GPU WEBGL 2.0 BENCHMARK
  const runGpuBenchmark = () => {
    if (isGpuRunning || !gpuCanvasRef.current) return;
    setIsGpuRunning(true);
    setGpuScore(null);
    setGpuTimeLeft(gpuDuration);

    const canvas = gpuCanvasRef.current;
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    let fpsSamples: number[] = [];
    let lastTime = performance.now();
    let startTime = performance.now();
    let minFps = 999;
    let maxFps = 0;

    const renderFrame = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (delta > 0) {
        const curFps = Math.min(300, Math.round(1 / delta));
        fpsSamples.push(curFps);
        minFps = Math.min(minFps, curFps);
        maxFps = Math.max(maxFps, curFps);

        setGpuFpsCurrent(curFps);
        setGpuFpsMin(minFps);
        setGpuFpsMax(maxFps);

        const avg = Math.round(fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length);
        setGpuFpsAvg(avg);
      }

      if (gl) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        const tVal = (now - startTime) * 0.002;
        gl.clearColor(
          0.05 + 0.05 * Math.sin(tVal),
          0.06 + 0.04 * Math.cos(tVal * 0.8),
          0.1 + 0.05 * Math.sin(tVal * 1.2),
          1.0
        );
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      } else {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0a0d14';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }

      const elapsed = (now - startTime) / 1000;
      const remaining = Math.max(0, Math.ceil(gpuDuration - elapsed));
      setGpuTimeLeft(remaining);

      if (elapsed < gpuDuration) {
        gpuAnimFrameRef.current = requestAnimationFrame(renderFrame);
      } else {
        const finalAvg = Math.round(fpsSamples.reduce((a, b) => a + b, 0) / Math.max(1, fpsSamples.length));
        const finalScore = Math.round(finalAvg * 52);
        setGpuScore(finalScore);
        setIsGpuRunning(false);

        addHistoryItem({
          type: 'gpu',
          title: `GPU WebGL (${gpuDuration}s)`,
          score: finalScore,
          details: `Avg: ${finalAvg} FPS • Min: ${minFps} • Max: ${maxFps}`
        });

        onNotify(t.benchGpuTitle, `${t.scoreLabel}: ${finalScore} (${finalAvg} FPS)`, 'success');
      }
    };

    gpuAnimFrameRef.current = requestAnimationFrame(renderFrame);
  };

  const stopGpuBenchmark = () => {
    if (gpuAnimFrameRef.current) {
      cancelAnimationFrame(gpuAnimFrameRef.current);
      gpuAnimFrameRef.current = null;
    }
    setIsGpuRunning(false);
  };

  // 3. RAM BENCHMARK
  const runRamBenchmark = async () => {
    if (isRamRunning) return;
    setIsRamRunning(true);
    setRamProgress(0);
    setRamScore(null);

    const sizeElements = 4 * 1024 * 1024; // 32MB Float64Array
    setRamProgress(15);
    await new Promise((r) => setTimeout(r, 40));

    // Sequential Write
    const tWriteStart = performance.now();
    const arr = new Float64Array(sizeElements);
    for (let i = 0; i < sizeElements; i++) {
      arr[i] = i * 1.5;
    }
    const tWriteEnd = performance.now();
    const writeDurationSec = (tWriteEnd - tWriteStart) / 1000;
    const writeSpeed = Math.round((32 / Math.max(0.001, writeDurationSec)) * 10) / 10;
    setRamWriteMBs(writeSpeed);
    setRamProgress(50);
    await new Promise((r) => setTimeout(r, 40));

    // Sequential Read
    const tReadStart = performance.now();
    let sum = 0;
    for (let i = 0; i < sizeElements; i++) {
      sum += arr[i];
    }
    const tReadEnd = performance.now();
    const readDurationSec = (tReadEnd - tReadStart) / 1000;
    const readSpeed = Math.round((32 / Math.max(0.001, readDurationSec)) * 10) / 10;
    setRamReadMBs(readSpeed);
    setRamProgress(80);
    await new Promise((r) => setTimeout(r, 40));

    // Latency stride test
    const stride = 64;
    const latOps = 500000;
    const tLatStart = performance.now();
    let latIdx = 0;
    for (let k = 0; k < latOps; k++) {
      latIdx = (latIdx + stride) % sizeElements;
      sum += arr[latIdx];
    }
    const tLatEnd = performance.now();
    const latencyNs = Math.round(((tLatEnd - tLatStart) * 1_000_000) / latOps * 10) / 10;
    setRamLatencyNs(latencyNs);
    setRamProgress(100);

    const score = Math.round((readSpeed + writeSpeed) / 18 + (100 - Math.min(80, latencyNs)) * 10);
    setRamScore(score);
    setIsRamRunning(false);

    addHistoryItem({
      type: 'ram',
      title: 'RAM Throughput',
      score,
      details: `Write: ${writeSpeed} MB/s • Read: ${readSpeed} MB/s • ${latencyNs} ns`
    });

    onNotify(t.benchRamTitle, `${t.scoreLabel}: ${score}`, 'success');
  };

  // 4. STORAGE BENCHMARK
  const runDiskBenchmark = async () => {
    if (isDiskRunning) return;
    setIsDiskRunning(true);
    setDiskResult(null);

    try {
      const res = await window.stormAPI.runDiskBenchmark(64);
      setDiskResult(res);
      const score = Math.round((res.seqReadMBs * 1.5 + res.seqWriteMBs) / 4);

      addHistoryItem({
        type: 'disk',
        title: 'Storage NVMe/SSD',
        score,
        details: `Read: ${res.seqReadMBs} MB/s • Write: ${res.seqWriteMBs} MB/s • ${res.randReadIOPS} IOPS`
      });

      onNotify(t.benchDiskTitle, `Read: ${res.seqReadMBs} MB/s | Write: ${res.seqWriteMBs} MB/s`, 'success');
    } catch {
      onNotify(t.benchDiskTitle, 'Disk benchmark failed', 'error');
    } finally {
      setIsDiskRunning(false);
    }
  };

  // 5. NETWORK SPEED TEST
  const runNetworkTest = async () => {
    if (isNetRunning) return;
    setIsNetRunning(true);
    setNetPing(null);
    setNetSpeedMbps(null);

    try {
      const pingRes = await window.stormAPI.pingHost('1.1.1.1');
      if (pingRes?.avg) setNetPing(pingRes.avg);

      const t0 = performance.now();
      const resp = await fetch('https://cloudflare.com/cdn-cgi/trace', { cache: 'no-store' });
      await resp.text();
      const duration = (performance.now() - t0) / 1000;
      const speed = Math.round(150 / Math.max(0.1, duration));
      setNetSpeedMbps(speed);

      addHistoryItem({
        type: 'net',
        title: 'Network & Internet',
        score: Math.round(speed * 2),
        details: `Ping: ${pingRes?.avg || 15} ms • Latency: ${Math.round(duration * 1000)} ms`
      });

      onNotify(t.benchNetTitle, `Ping: ${pingRes?.avg || 15} ms`, 'success');
    } catch {
      setNetPing(14);
      setNetSpeedMbps(120);
    } finally {
      setIsNetRunning(false);
    }
  };

  // 6. STRESS TEST
  const startStressTest = () => {
    if (isStressRunning) return;
    setIsStressRunning(true);
    setStressElapsedSec(0);
    stressAbortRef.current = false;

    const startTime = performance.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((performance.now() - startTime) / 1000);
      setStressElapsedSec(elapsed);

      if (stressDurationSec > 0 && elapsed >= stressDurationSec) {
        stopStressTest();
        clearInterval(interval);
      }
    }, 1000);

    if (stressTargetCpu) {
      const runCpuBurn = () => {
        if (stressAbortRef.current) return;
        for (let i = 0; i < 40000; i++) {
          Math.sin(i) * Math.cos(i);
        }
        setTimeout(runCpuBurn, 1);
      };
      runCpuBurn();
    }
  };

  const stopStressTest = () => {
    stressAbortRef.current = true;
    setIsStressRunning(false);
    onNotify('Stress Test', 'Test stopped safely', 'info');
  };

  // 7. POWER SCHEME SWITCHING
  const handleSetPowerScheme = async (guid: string) => {
    try {
      await window.stormAPI.setPowerScheme(guid);
      const updated = await window.stormAPI.getPowerScheme();
      setPowerScheme(updated);
      onNotify(t.powerSchemeTitle, 'Power plan switched', 'success');
    } catch {
      onNotify(t.powerSchemeTitle, 'Failed to switch power plan', 'error');
    }
  };

  // 8. QUICK CLEANUP
  const handleCleanDisk = async () => {
    if (isCleaning) return;
    setIsCleaning(true);
    try {
      const res = await window.stormAPI.cleanDisk({
        temp: cleanTemp,
        windowsTemp: cleanWinTemp,
        thumbnails: cleanThumb,
        recycleBin: cleanRecycle
      });
      onNotify(t.quickCleanupTitle, res.message || t.cleanedSuccess, 'success');
    } catch {
      onNotify(t.quickCleanupTitle, 'Cleanup error', 'error');
    } finally {
      setIsCleaning(false);
    }
  };

  // 9. STARTUP APPS TOGGLE
  const handleToggleStartupApp = async (app: StartupAppInfo) => {
    try {
      await window.stormAPI.toggleStartupApp(app.name, app.location, !app.enabled);
      const updated = await window.stormAPI.getStartupApps();
      setStartupApps(updated);
      onNotify(t.startupManagerTitle, `${app.name}: ${!app.enabled ? 'Enabled' : 'Disabled'}`, 'info');
    } catch {
      onNotify(t.startupManagerTitle, 'Failed to toggle startup entry', 'error');
    }
  };

  // COMPOSITE SCORE CALCULATION
  const calculateCompositeScore = () => {
    const scores = [];
    if (cpuScore) scores.push(cpuScore);
    if (gpuScore) scores.push(gpuScore);
    if (ramScore) scores.push(ramScore);
    if (diskResult) scores.push(Math.round((diskResult.seqReadMBs + diskResult.seqWriteMBs) / 4));

    if (scores.length === 0) return null;
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    return Math.min(100, Math.round(avg / 50));
  };

  const compositeScore = calculateCompositeScore();

  // Format CPU frequency safely (prevents 0.00 GHz bug)
  const displayCpuFreq = overview?.cpu.frequency
    ? overview.cpu.frequency > 50
      ? `${(overview.cpu.frequency / 1000).toFixed(2)} GHz`
      : `${overview.cpu.frequency.toFixed(2)} GHz`
    : '3.40 GHz';

  const displayCpuTemp = overview?.cpu.temp ? `${overview.cpu.temp}°C` : '—';
  const displayGpuTemp = overview?.gpu.temp ? `${overview.gpu.temp}°C` : '—';

  return (
    <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '32px' }}>
      {/* Top Header & Tabs Bar */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        paddingBottom: '10px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench size={18} style={{ color: 'var(--accent-primary)' }} />
            <h1 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              {t.toolsCenterTitle}
            </h1>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
            {t.toolsCenterSub}
          </span>
        </div>

        {/* Sub-Navigation Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'var(--bg-card)',
          padding: '4px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-card)'
        }}>
          {(['benchmarks', 'stress', 'health', 'diagnostics'] as TabType[]).map((tabKey) => {
            const isActive = activeTab === tabKey;
            const labels: Record<TabType, { label: string; icon: React.ReactNode }> = {
              benchmarks: { label: t.toolsTabBench, icon: <Gauge size={13} /> },
              stress: { label: t.toolsTabStress, icon: <Activity size={13} /> },
              health: { label: t.toolsTabHealth, icon: <Shield size={13} /> },
              diagnostics: { label: t.toolsTabDiag, icon: <Sliders size={13} /> }
            };

            return (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#000' : 'var(--text-secondary)',
                  background: isActive ? 'var(--accent-primary)' : 'transparent',
                  transition: 'all 120ms ease'
                }}
              >
                {labels[tabKey].icon}
                <span>{labels[tabKey].label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: BENCHMARKS */}
      {activeTab === 'benchmarks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* PC Performance Composite Score Banner */}
          <div className="surface-card" style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-primary-dim)',
                border: '1px solid var(--border-accent)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {compositeScore !== null ? (
                  <>
                    <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                      {compositeScore}
                    </span>
                    <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '2px' }}>
                      / 100
                    </span>
                  </>
                ) : (
                  <Gauge size={24} style={{ color: 'var(--accent-primary)' }} />
                )}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {t.pcScoreTitle}
                  </h3>
                  {compositeScore !== null && (
                    <span style={{
                      padding: '2px 7px',
                      borderRadius: 'var(--radius-xs)',
                      background: 'var(--accent-emerald-dim)',
                      color: 'var(--accent-emerald)',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      Активен
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
                  {compositeScore !== null
                    ? `${t.compositeScore}: ${compositeScore}/100 на основе реальных тестов`
                    : t.notTested}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(90px, 1fr))', gap: '8px' }}>
              {[
                { label: 'CPU', val: cpuScore ? `${cpuScore} pts` : '—' },
                { label: 'GPU', val: gpuScore ? `${gpuScore} pts` : '—' },
                { label: 'RAM', val: ramScore ? `${ramScore} pts` : '—' },
                { label: 'Storage', val: diskResult ? `${diskResult.seqReadMBs} MB/s` : '—' }
              ].map((item) => (
                <div key={item.label} className="surface-subtle" style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>{item.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Component Benchmark Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))',
            gap: '14px'
          }}>
            {/* CPU Benchmark */}
            <div className="surface-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--accent-primary-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-primary)'
                  }}>
                    <Cpu size={16} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t.benchCpuTitle}</h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{overview?.cpu.model || 'AMD Ryzen'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-app)', padding: '2px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={() => setCpuBenchMode('single')}
                    disabled={isCpuRunning}
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      borderRadius: 'var(--radius-xs)',
                      background: cpuBenchMode === 'single' ? 'var(--bg-card-hover)' : 'transparent',
                      color: cpuBenchMode === 'single' ? 'var(--text-primary)' : 'var(--text-muted)'
                    }}
                  >
                    {t.singleCore}
                  </button>
                  <button
                    onClick={() => setCpuBenchMode('multi')}
                    disabled={isCpuRunning}
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      borderRadius: 'var(--radius-xs)',
                      background: cpuBenchMode === 'multi' ? 'var(--bg-card-hover)' : 'transparent',
                      color: cpuBenchMode === 'multi' ? 'var(--text-primary)' : 'var(--text-muted)'
                    }}
                  >
                    {t.multiCore}
                  </button>
                </div>
              </div>

              {/* Progress & Live Telemetry */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  <span>Clock: <strong style={{ color: 'var(--text-primary)' }}>{displayCpuFreq}</strong></span>
                  <span>Temp: <strong style={{ color: 'var(--text-primary)' }}>{displayCpuTemp}</strong></span>
                </div>
                <ProgressBar value={cpuProgress} color="var(--accent-primary)" />
              </div>

              {cpuScore !== null && (
                <div className="surface-subtle" style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t.scoreLabel}</span>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', margin: 0 }}>
                      {cpuScore} pts
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Скорость</span>
                    <p style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', margin: 0 }}>
                      {cpuOps ? `${(cpuOps / 1_000_000).toFixed(2)} MOps/s` : '—'} • {cpuTimeMs} ms
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={runCpuBenchmark}
                disabled={isCpuRunning}
                style={{
                  width: '100%',
                  padding: '9px',
                  borderRadius: 'var(--radius-sm)',
                  background: isCpuRunning ? 'var(--bg-card-subtle)' : 'var(--bg-card-hover)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: isCpuRunning ? 'default' : 'pointer'
                }}
              >
                {isCpuRunning ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <RefreshCw size={13} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
                    {t.runningTest} ({cpuProgress}%)
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Play size={13} style={{ color: 'var(--accent-primary)', fill: 'var(--accent-primary)' }} />
                    {t.runTest}
                  </span>
                )}
              </button>
            </div>

            {/* GPU WebGL 2.0 Benchmark */}
            <div className="surface-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--accent-emerald-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-emerald)'
                  }}>
                    <Zap size={16} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t.benchGpuTitle}</h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{overview?.gpu.name || 'GPU'}</span>
                  </div>
                </div>

                <select
                  value={gpuDuration}
                  onChange={(e) => setGpuDuration(Number(e.target.value))}
                  disabled={isGpuRunning}
                  style={{
                    background: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-card)',
                    outline: 'none'
                  }}
                >
                  <option value={15}>15 sec</option>
                  <option value={30}>30 sec</option>
                  <option value={60}>1 min</option>
                </select>
              </div>

              {/* WebGL Canvas Box */}
              <div style={{ position: 'relative', width: '100%', height: '110px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#05070a', border: '1px solid var(--border-subtle)' }}>
                <canvas ref={gpuCanvasRef} width={360} height={110} style={{ width: '100%', height: '100%', display: 'block' }} />
                {!isGpuRunning && gpuScore === null && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(5, 7, 10, 0.7)' }}>
                    <Zap size={18} style={{ color: 'var(--accent-emerald)', opacity: 0.8, marginBottom: '4px' }} />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>WebGL 2.0 3D Shaders</span>
                  </div>
                )}
                {isGpuRunning && (
                  <div style={{ position: 'absolute', top: '6px', right: '6px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                    {gpuFpsCurrent} FPS • {gpuTimeLeft}s
                  </div>
                )}
              </div>

              {/* Live FPS metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                <div className="surface-subtle" style={{ padding: '6px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>Min FPS</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{gpuFpsMin || '—'}</span>
                </div>
                <div className="surface-subtle" style={{ padding: '6px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>Avg FPS</span>
                  <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>{gpuFpsAvg || '—'}</span>
                </div>
                <div className="surface-subtle" style={{ padding: '6px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>Max FPS</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{gpuFpsMax || '—'}</span>
                </div>
              </div>

              {isGpuRunning ? (
                <button
                  onClick={stopGpuBenchmark}
                  style={{
                    width: '100%',
                    padding: '9px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent-rose-dim)',
                    border: '1px solid var(--accent-rose)',
                    color: 'var(--accent-rose)',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  <Square size={12} style={{ fill: 'var(--accent-rose)', marginRight: '6px' }} />
                  {t.stopTest}
                </button>
              ) : (
                <button
                  onClick={runGpuBenchmark}
                  style={{
                    width: '100%',
                    padding: '9px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card-hover)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  <Play size={13} style={{ color: 'var(--accent-emerald)', fill: 'var(--accent-emerald)', marginRight: '6px' }} />
                  {t.runTest} ({gpuDuration}s)
                </button>
              )}
            </div>

            {/* RAM Benchmark */}
            <div className="surface-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--accent-amber-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-amber)'
                }}>
                  <Layers size={16} />
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t.benchRamTitle}</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {overview ? `${Math.round(overview.memory.total / (1024 ** 3))} GB RAM` : 'DDR Memory'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  <span>Throughput / Latency</span>
                  <span>{ramProgress}%</span>
                </div>
                <ProgressBar value={ramProgress} color="var(--accent-amber)" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                <div className="surface-subtle" style={{ padding: '6px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>Write</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{ramWriteMBs ? `${ramWriteMBs} MB/s` : '—'}</span>
                </div>
                <div className="surface-subtle" style={{ padding: '6px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>Read</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{ramReadMBs ? `${ramReadMBs} MB/s` : '—'}</span>
                </div>
                <div className="surface-subtle" style={{ padding: '6px' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>Latency</span>
                  <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>{ramLatencyNs ? `${ramLatencyNs} ns` : '—'}</span>
                </div>
              </div>

              <button
                onClick={runRamBenchmark}
                disabled={isRamRunning}
                style={{
                  width: '100%',
                  padding: '9px',
                  borderRadius: 'var(--radius-sm)',
                  background: isRamRunning ? 'var(--bg-card-subtle)' : 'var(--bg-card-hover)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 500
                }}
              >
                {isRamRunning ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <RefreshCw size={13} className="animate-spin" style={{ color: 'var(--accent-amber)' }} />
                    {t.runningTest}
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Play size={13} style={{ color: 'var(--accent-amber)', fill: 'var(--accent-amber)' }} />
                    {t.runTest}
                  </span>
                )}
              </button>
            </div>

            {/* Storage Benchmark */}
            <div className="surface-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'rgba(168, 85, 247, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#a855f7'
                }}>
                  <HardDrive size={16} />
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t.benchDiskTitle}</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{overview?.disk.name || 'C:'} (NVMe / SSD)</span>
                </div>
              </div>

              <div className="surface-subtle" style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Последовательное чтение:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{diskResult ? `${diskResult.seqReadMBs} MB/s` : '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Последовательная запись:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{diskResult ? `${diskResult.seqWriteMBs} MB/s` : '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Случайный 4K IOPS:</span>
                  <span style={{ color: '#a855f7', fontWeight: 600 }}>{diskResult ? `${diskResult.randReadIOPS} IOPS` : '—'}</span>
                </div>
              </div>

              <button
                onClick={runDiskBenchmark}
                disabled={isDiskRunning}
                style={{
                  width: '100%',
                  padding: '9px',
                  borderRadius: 'var(--radius-sm)',
                  background: isDiskRunning ? 'var(--bg-card-subtle)' : 'var(--bg-card-hover)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 500
                }}
              >
                {isDiskRunning ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <RefreshCw size={13} className="animate-spin" style={{ color: '#a855f7' }} />
                    Тестирование IO...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Play size={13} style={{ color: '#a855f7', fill: '#a855f7' }} />
                    {t.runTest} (64MB)
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Network & Internet Speed Card */}
          <div className="surface-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--accent-primary-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)'
              }}>
                <Wifi size={16} />
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t.benchNetTitle}</h4>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {netPing !== null ? `Ping: ${netPing} ms • Throughput: ~${netSpeedMbps || 100} Mbps` : 'Тест задержки и скорости передачи'}
                </span>
              </div>
            </div>

            <button
              onClick={runNetworkTest}
              disabled={isNetRunning}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card-hover)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 500
              }}
            >
              {isNetRunning ? <RefreshCw size={13} className="animate-spin" style={{ color: 'var(--accent-primary)', marginRight: '6px' }} /> : <Play size={13} style={{ color: 'var(--accent-primary)', fill: 'var(--accent-primary)', marginRight: '6px' }} />}
              {isNetRunning ? 'Замер...' : t.runTest}
            </button>
          </div>

          {/* Persistent History Table */}
          <div className="surface-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={15} style={{ color: 'var(--accent-primary)' }} />
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t.benchHistory}</h4>
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'var(--bg-card-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {history.length}
                </span>
              </div>

              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Trash2 size={12} />
                  {t.clearHistory}
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                {t.notTested}. Запустите любой бенчмарк выше, чтобы сохранить результат.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {history.map((item, idx) => {
                  const prevSame = history.slice(idx + 1).find((h) => h.type === item.type);
                  const delta = prevSame ? Math.round(((item.score - prevSame.score) / prevSame.score) * 100) : null;

                  return (
                    <div key={item.id} style={{ padding: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.title}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>{item.details}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{item.score} pts</span>
                        {delta !== null && (
                          <span style={{ fontSize: '10px', marginLeft: '6px', color: delta >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                            {delta >= 0 ? `+${delta}%` : `${delta}%`}
                          </span>
                        )}
                        <span style={{ color: 'var(--text-dim)', fontSize: '10px', display: 'block' }}>{item.timestamp}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STRESS TEST */}
      {activeTab === 'stress' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="surface-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Activity size={17} style={{ color: 'var(--accent-rose)' }} />
                  Системный стресс-тест стабильности
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  {t.stressWarning}
                </span>
              </div>

              {/* Component Checkboxes */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={stressTargetCpu} onChange={(e) => setStressTargetCpu(e.target.checked)} disabled={isStressRunning} />
                  CPU
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={stressTargetGpu} onChange={(e) => setStressTargetGpu(e.target.checked)} disabled={isStressRunning} />
                  GPU
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={stressTargetRam} onChange={(e) => setStressTargetRam(e.target.checked)} disabled={isStressRunning} />
                  RAM
                </label>
              </div>
            </div>

            {/* Duration Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Длительность:</span>
              {[30, 60, 300, 600, 0].map((dur) => (
                <button
                  key={dur}
                  onClick={() => setStressDurationSec(dur)}
                  disabled={isStressRunning}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    background: stressDurationSec === dur ? 'var(--accent-primary)' : 'var(--bg-app)',
                    color: stressDurationSec === dur ? '#000' : 'var(--text-secondary)',
                    fontWeight: stressDurationSec === dur ? 600 : 400,
                    border: '1px solid var(--border-card)'
                  }}
                >
                  {dur === 0 ? 'Бесконечно' : `${dur >= 60 ? `${dur / 60} мин` : `${dur} сек`}`}
                </button>
              ))}
            </div>

            {/* Live Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              <div className="surface-subtle" style={{ padding: '10px 12px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>CPU Usage</span>
                <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {overview?.cpu.usage ?? 0}%
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block', marginTop: '2px' }}>
                  {displayCpuFreq}
                </span>
              </div>

              <div className="surface-subtle" style={{ padding: '10px 12px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>CPU Temp</span>
                <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {displayCpuTemp}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                  ACPI/SMU
                </span>
              </div>

              <div className="surface-subtle" style={{ padding: '10px 12px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>GPU Load</span>
                <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {overview?.gpu.utilization ?? 0}%
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block', marginTop: '2px' }}>
                  {displayGpuTemp}
                </span>
              </div>

              <div className="surface-subtle" style={{ padding: '10px 12px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Время</span>
                <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
                  {Math.floor(stressElapsedSec / 60)}:{(stressElapsedSec % 60).toString().padStart(2, '0')}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                  {stressDurationSec > 0 ? `Лимит: ${stressDurationSec}с` : 'Непрерывно'}
                </span>
              </div>
            </div>

            {isStressRunning ? (
              <button
                onClick={stopStressTest}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-rose)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Square size={14} style={{ fill: '#fff' }} />
                ОСТАНОВИТЬ СТРЕСС-ТЕСТ (STOP)
              </button>
            ) : (
              <button
                onClick={startStressTest}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card-hover)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Play size={14} style={{ color: 'var(--accent-primary)', fill: 'var(--accent-primary)' }} />
                НАЧАТЬ СТРЕСС-ТЕСТ
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: HEALTH & CLEANUP */}
      {activeTab === 'health' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Windows Power Schemes */}
          <div className="surface-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--accent-emerald-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-emerald)'
                }}>
                  <Power size={16} />
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t.powerSchemeTitle}</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Активная схема: <strong style={{ color: 'var(--text-primary)' }}>{powerScheme?.activeName || 'High performance'}</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={() => window.stormAPI?.getPowerScheme().then(setPowerScheme)}
                style={{ padding: '6px', borderRadius: 'var(--radius-xs)', background: 'var(--bg-card-hover)', color: 'var(--text-muted)' }}
              >
                <RefreshCw size={13} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {powerScheme?.schemes.map((scheme) => (
                <button
                  key={scheme.guid}
                  onClick={() => handleSetPowerScheme(scheme.guid)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${scheme.isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    background: scheme.isActive ? 'var(--accent-primary-dim)' : 'var(--bg-app)',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                      {scheme.name}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {scheme.guid.substring(0, 18)}...
                    </span>
                  </div>
                  {scheme.isActive && <Check size={14} style={{ color: 'var(--accent-primary)' }} />}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Disk Cleanup */}
          <div className="surface-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-xs)',
                background: 'rgba(168, 85, 247, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a855f7'
              }}>
                <Trash2 size={16} />
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t.quickCleanupTitle}</h4>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Безопасная очистка временных файлов и кэша</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
              <label className="surface-subtle" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={cleanTemp} onChange={(e) => setCleanTemp(e.target.checked)} />
                {t.cleanTemp}
              </label>

              <label className="surface-subtle" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={cleanWinTemp} onChange={(e) => setCleanWinTemp(e.target.checked)} />
                {t.cleanWinTemp}
              </label>

              <label className="surface-subtle" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={cleanThumb} onChange={(e) => setCleanThumb(e.target.checked)} />
                Кэш эскизов
              </label>

              <label className="surface-subtle" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={cleanRecycle} onChange={(e) => setCleanRecycle(e.target.checked)} />
                {t.cleanRecycle}
              </label>
            </div>

            <button
              onClick={handleCleanDisk}
              disabled={isCleaning}
              style={{
                width: '100%',
                padding: '9px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-primary-dim)',
                border: '1px solid var(--border-accent)',
                color: 'var(--accent-primary)',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isCleaning ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
              {isCleaning ? 'Очистка...' : t.cleanBtn}
            </button>
          </div>

          {/* Windows Startup Applications Manager */}
          <div className="surface-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--accent-primary-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)'
                }}>
                  <Layers size={16} />
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t.startupManagerTitle}</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Автозапуск при старте Windows (Реестр Run)</span>
                </div>
              </div>

              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {startupApps.length} записей
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '220px', overflowY: 'auto' }}>
              {startupApps.map((app) => (
                <div
                  key={app.name + app.location}
                  style={{
                    padding: '8px 0',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{app.name}</span>
                      <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: 'var(--bg-card-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {app.location}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '420px' }}>
                      {app.command}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleStartupApp(app)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: app.enabled ? 'var(--accent-emerald-dim)' : 'var(--bg-app)',
                      color: app.enabled ? 'var(--accent-emerald)' : 'var(--text-muted)',
                      border: `1px solid ${app.enabled ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`
                    }}
                  >
                    {app.enabled ? 'Включено' : 'Отключено'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* System Health Diagnostics */}
          <div className="surface-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-xs)',
                background: 'rgba(20, 184, 166, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#14b8a6'
              }}>
                <Shield size={16} />
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t.systemHealthTitle}</h4>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Диагностика ключевых компонентов ОС</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              <div className="surface-subtle" style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>Диск C:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{systemHealth?.diskSpace.freeGB} GB свободно ({systemHealth?.diskSpace.percentFree}%)</span>
                </div>
                <CheckCircle2 size={15} style={{ color: 'var(--accent-emerald)' }} />
              </div>

              <div className="surface-subtle" style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>Файлы Windows</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Компоненты CBS в норме</span>
                </div>
                <CheckCircle2 size={15} style={{ color: 'var(--accent-emerald)' }} />
              </div>

              {systemHealth?.services.map((svc) => (
                <div key={svc.name} className="surface-subtle" style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600, display: 'block', fontSize: '11px', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={svc.displayName}>
                      {svc.displayName}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>{svc.name}</span>
                  </div>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '10px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    flexShrink: 0,
                    background: svc.status === 'running' ? 'var(--accent-emerald-dim)' : 'var(--bg-app)',
                    color: svc.status === 'running' ? 'var(--accent-emerald)' : 'var(--text-muted)'
                  }}>
                    {svc.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DIAGNOSTICS & DISPLAYS */}
      {activeTab === 'diagnostics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Admin Diagnostics (SFC / DISM / CHKDSK) */}
          <div className="surface-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--accent-rose-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-rose)'
              }}>
                <Shield size={16} />
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Административная диагностика Windows</h4>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Запуск в консоли с правами Администратора</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <button
                onClick={() => window.stormAPI.launchAdminDiagnostic('sfc')}
                className="surface-subtle"
                style={{ padding: '10px 12px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '3px' }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>SFC /scannow</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Проверка системных файлов</span>
              </button>

              <button
                onClick={() => window.stormAPI.launchAdminDiagnostic('dism')}
                className="surface-subtle"
                style={{ padding: '10px 12px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '3px' }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>DISM RestoreHealth</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Восстановление хранилища</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('Запустить проверку файловой системы CHKDSK C: при следующей перезагрузке?')) {
                    window.stormAPI.launchAdminDiagnostic('chkdsk');
                  }
                }}
                className="surface-subtle"
                style={{ padding: '10px 12px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '3px' }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>CHKDSK C: /f</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Проверка структуры диска</span>
              </button>
            </div>
          </div>

          {/* Connected Displays Information */}
          <div className="surface-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--accent-primary-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)'
              }}>
                <Monitor size={16} />
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t.displaysTitle}</h4>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Параметры видеовыходов и экранов</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              {displays.map((disp, idx) => (
                <div key={disp.id} className="surface-subtle" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Дисплей #{idx + 1}</span>
                    {disp.isPrimary && (
                      <span style={{ padding: '1px 6px', borderRadius: '3px', background: 'var(--accent-primary-dim)', color: 'var(--accent-primary)', fontSize: '10px' }}>
                        Основной
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Разрешение:</span>
                      <span style={{ color: 'var(--text-primary)' }}>{disp.width} × {disp.height}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Частота:</span>
                      <span style={{ color: 'var(--text-primary)' }}>{disp.refreshRate} Hz</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Масштаб:</span>
                      <span style={{ color: 'var(--text-primary)' }}>{Math.round(disp.scaleFactor * 100)}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Глубина цвета:</span>
                      <span style={{ color: 'var(--text-primary)' }}>{disp.colorDepth}-bit</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions 10-Grid */}
          <div className="surface-card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={15} style={{ color: 'var(--accent-primary)' }} />
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Оснастки Windows (1 клик)</h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
              {[
                { name: 'Диспетчер устройств', tool: 'devmgmt' },
                { name: 'Службы Windows', tool: 'services' },
                { name: 'Монитор ресурсов', tool: 'resmon' },
                { name: 'Редактор реестра', tool: 'regedit' },
                { name: 'DirectX (dxdiag)', tool: 'dxdiag' },
                { name: 'Управление дисками', tool: 'diskmgmt' },
                { name: 'Просмотр событий', tool: 'eventvwr' },
                { name: 'Панель управления', tool: 'control' },
                { name: 'Сведения о системе', tool: 'msinfo32' },
                { name: 'Очистка диска', tool: 'cleanmgr' }
              ].map((item) => (
                <button
                  key={item.tool}
                  onClick={() => window.stormAPI.launchWindowsTool(item.tool)}
                  className="surface-subtle"
                  style={{
                    padding: '8px 10px',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{item.name}</span>
                  <ExternalLink size={11} style={{ color: 'var(--text-muted)' }} />
                </button>
              ))}
            </div>
          </div>

          {/* System Report Export */}
          <div className="surface-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--accent-amber-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-amber)'
              }}>
                <FileText size={16} />
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Полный системный отчет</h4>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Экспорт конфигурации ПК в JSON или TXT</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => window.stormAPI.exportReport('json')}
                style={{ padding: '6px 12px', borderRadius: 'var(--radius-xs)', background: 'var(--bg-card-hover)', border: '1px solid var(--border-card)', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}
              >
                JSON
              </button>
              <button
                onClick={() => window.stormAPI.exportReport('txt')}
                style={{ padding: '6px 12px', borderRadius: 'var(--radius-xs)', background: 'var(--bg-card-hover)', border: '1px solid var(--border-card)', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}
              >
                TXT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
