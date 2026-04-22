import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Terminal, Settings, RefreshCw, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

const API_BASE = "http://localhost:8000";

interface ServiceStatus {
  name: string;
  status: string;
  image: string;
}

const App: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [logs, setLogs] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const resp = await axios.get(`${API_BASE}/system/status`);
      setServices(resp.data);
    } catch (e) {
      console.error("Failed to fetch status");
    }
  };

  const analyzeLogs = async () => {
    setLoading(true);
    try {
      const resp = await axios.post(`${API_BASE}/ai/analyze`, { logs });
      setAnalysis(resp.data);
    } catch (e) {
      setAnalysis({ error: "Analysis failed" });
    }
    setLoading(false);
  };

  const restartService = async (name: string) => {
    try {
      await axios.post(`${API_BASE}/healing/restart/${name}`);
      fetchStatus();
    } catch (e) {
      alert("Restart failed");
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const data = [
    { name: '10:00', cpu: 45, mem: 32 },
    { name: '10:05', cpu: 52, mem: 34 },
    { name: '10:10', cpu: 48, mem: 35 },
    { name: '10:15', cpu: 61, mem: 40 },
    { name: '10:20', cpu: 55, mem: 38 },
    { name: '10:25', cpu: 67, mem: 42 },
  ];

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">AutoOps AI</h1>
          <p className="text-slate-400">Self-Healing DevOps Orchestrator</p>
        </div>
        <div className="flex gap-4">
          <div className="glass px-4 py-2 flex items-center gap-2">
            <ShieldCheck className="text-emerald-400" />
            <span className="text-sm font-medium">System Secure</span>
          </div>
          <button className="btn btn-primary flex items-center gap-2" onClick={fetchStatus}>
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Health Status */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="text-indigo-400" /> Infrastructure Metrics
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="cpu" stroke="#6366f1" fillOpacity={1} fill="url(#colorCpu)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ShieldCheck className="text-purple-400" /> Managed Services
              </h3>
              <div className="space-y-4 overflow-y-auto max-h-60 pr-2">
                {services.map(s => (
                  <div key={s.name} className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.image.split(':')[0]}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`status-badge ${s.status === 'running' ? 'status-running' : 'status-stopped'}`}>
                        {s.status}
                      </span>
                      <button onClick={() => restartService(s.name)} className="p-1 hover:text-indigo-400 transition-colors">
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Log Analyzer */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Terminal className="text-amber-400" /> AI Log Analyzer (Ollama)
            </h3>
            <textarea 
              className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-4 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
              placeholder="Paste logs here for AI analysis..."
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
            />
            <button 
              className="btn btn-primary w-full disabled:opacity-50"
              onClick={analyzeLogs}
              disabled={loading || !logs}
            >
              {loading ? "Analyzing..." : "Analyze Logs"}
            </button>

            {analysis && (
              <div className="mt-6 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold mb-2">
                  <ShieldCheck size={20} /> AI Diagnosis
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs uppercase text-slate-500 font-bold">Root Cause:</span>
                    <p className="text-sm">{analysis.cause || analysis.error}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-slate-500 font-bold">Suggestion:</span>
                    <p className="text-sm text-emerald-400">{analysis.suggestion}</p>
                  </div>
                  {analysis.severity && (
                    <div className={`text-xs inline-block px-2 py-1 rounded font-bold ${analysis.severity === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {analysis.severity}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Alerts & Events */}
        <div className="space-y-8">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
            <div className="space-y-4">
              <div className="flex gap-4 p-3 rounded-lg border-l-4 border-red-500 bg-red-500/5">
                <AlertTriangle className="text-red-500 shrink-0" size={20} />
                <div>
                  <div className="text-sm font-semibold">Database Connection Error</div>
                  <div className="text-xs text-slate-500">Service: autoops-backend • 2 mins ago</div>
                </div>
              </div>
              <div className="flex gap-4 p-3 rounded-lg border-l-4 border-amber-500 bg-amber-500/5">
                <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                <div>
                  <div className="text-sm font-semibold">High Disk Usage</div>
                  <div className="text-xs text-slate-500">Service: node-exporter • 15 mins ago</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Healing History</h3>
            <div className="space-y-3">
              {[
                { time: '10:24', action: 'Restarted', target: 'redis-cache' },
                { time: '09:15', action: 'Scaled', target: 'web-api' },
              ].map((h, i) => (
                <div key={i} className="text-sm flex justify-between items-center text-slate-400">
                  <span>{h.time} - {h.action} <span className="text-slate-200">{h.target}</span></span>
                  <ShieldCheck size={14} className="text-emerald-500" />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;
