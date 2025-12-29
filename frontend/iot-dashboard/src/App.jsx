import React, { useState, useEffect, useRef } from 'react';
import {
  Thermometer,
  Droplets,
  Sun,
  Wind,
  Activity,
  Wifi,
  Zap,
  Eye,
  EyeOff,
  Moon,
  Lightbulb
} from 'lucide-react';

// --- Components ---

// 1. Stat Card Component
const StatCard = ({ title, value, unit, icon: Icon, color, subtext, trend }) => (
  <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg relative overflow-hidden group hover:border-slate-600 transition-all duration-300">
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
      <Icon size={80} />
    </div>

    <div className="relative z-10 flex flex-col h-full justify-between">
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-lg bg-opacity-20 ${color} bg-white`}>
          <Icon size={20} className={color.replace('text-', 'text-').replace('bg-', '')} />
        </div>
        <h3 className="text-slate-400 font-medium">{title}</h3>
      </div>

      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white tracking-tight">{value}</span>
          <span className="text-slate-500 font-medium">{unit}</span>
        </div>
        {subtext && (
          <p className={`text-sm mt-2 font-medium ${trend === 'danger' ? 'text-red-400' : 'text-emerald-400'}`}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  </div>
);

// 2. Light/LDR Specific Card with Binning
const LightCard = ({ value }) => {
  // Binning Logic
  let intensity = 'Low';
  let colorClass = 'text-slate-400';
  let bgClass = 'bg-slate-500';
  let Icon = Moon;

  if (value > 300 && value <= 700) {
    intensity = 'Medium';
    colorClass = 'text-yellow-400';
    bgClass = 'bg-yellow-500';
    Icon = Sun;
  } else if (value > 700) {
    intensity = 'High';
    colorClass = 'text-orange-400';
    bgClass = 'bg-orange-500';
    Icon = Lightbulb;
  }

  // Calculate percentage for progress bar (assuming 0-1023 range)
  const percentage = Math.min((value / 1023) * 100, 100);

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg bg-opacity-20 ${bgClass} bg-black`}>
            <Icon size={20} className={colorClass} />
          </div>
          <h3 className="text-slate-400 font-medium">Light Intensity</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 ${colorClass} border border-slate-700`}>
          {intensity}
        </span>
      </div>

      <div className="mb-4">
        <span className="text-4xl font-bold text-white tracking-tight">{value}</span>
        <span className="text-slate-500 ml-2">lux (raw)</span>
      </div>

      {/* Visual Bar */}
      <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-700">
        <div
          className={`h-full transition-all duration-500 ${bgClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
        <span>0</span>
        <span>MEDIUM (300-700)</span>
        <span>1024</span>
      </div>
    </div>
  );
};

// 3. Motion Sensor Card
const MotionCard = ({ isMotionDetected }) => (
  <div className={`rounded-xl p-6 border shadow-lg transition-all duration-500 ${isMotionDetected ? 'bg-red-900/20 border-red-500/50' : 'bg-slate-800 border-slate-700'}`}>
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-lg ${isMotionDetected ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
          {isMotionDetected ? <Eye size={20} /> : <EyeOff size={20} />}
        </div>
        <h3 className="text-slate-400 font-medium">Motion Sensor</h3>
      </div>
      <div className={`h-3 w-3 rounded-full ${isMotionDetected ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} />
    </div>

    <div className="mt-6">
      <h2 className={`text-2xl font-bold ${isMotionDetected ? 'text-red-400' : 'text-slate-500'}`}>
        {isMotionDetected ? 'MOVEMENT DETECTED' : 'No Movement'}
      </h2>
      <p className="text-slate-400 text-sm mt-1">
        {isMotionDetected ? 'Area is currently active' : 'Area is secure'}
      </p>
    </div>
  </div>
);

// API Base URL - change this if your backend runs on a different port
const API_BASE_URL = 'http://localhost:8000';

// 4. Main Application
export default function App() {
  // State for sensor readings
  const [data, setData] = useState({
    t: 0,
    h: 0,
    a: 0,
    p: false,
    timestamp: new Date().toISOString()
  });

  const [history, setHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null); // { index, x, y }

  // Fetch sensor data from backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/sensor-data`);
        if (!response.ok) throw new Error('API error');

        const newData = await response.json();
        setData(newData);
        setIsConnected(true);

        // Keep last 30 readings for graphing (1 minute at 2 second intervals)
        setHistory(prev => [...prev.slice(-29), newData]);
      } catch (error) {
        console.error('Failed to fetch sensor data:', error);
        setIsConnected(false);
      }
    };

    // Initial fetch
    fetchData();

    // Poll every 2 seconds
    const interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, []);

  // Determine Temp Status
  const getTempStatus = (t) => {
    if (t > 28) return { text: 'Warm', color: 'text-orange-500' };
    if (t < 18) return { text: 'Cool', color: 'text-blue-500' };
    return { text: 'Optimal', color: 'text-emerald-500' };
  };

  const tempStatus = getTempStatus(data.t);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Zap className="text-indigo-500" />
              IoT Home Control
            </h1>
            <p className="text-slate-500 mt-1">Real-time sensor monitoring dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              <Wifi size={16} />
              <span className="text-sm font-medium">{isConnected ? 'System Online' : 'Offline'}</span>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-500">Last Update</div>
              <div className="text-sm font-mono text-slate-300">
                {new Date(data.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </header>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Temperature */}
          <StatCard
            title="Temperature"
            value={data.t}
            unit="°C"
            icon={Thermometer}
            color="text-indigo-400"
            subtext={tempStatus.text}
            trend={data.t > 28 ? 'danger' : 'safe'}
          />

          {/* Humidity */}
          <StatCard
            title="Humidity"
            value={data.h}
            unit="%"
            icon={Droplets}
            color="text-cyan-400"
            subtext={data.h > 60 ? 'High' : 'Normal'}
            trend={data.h > 60 ? 'danger' : 'safe'}
          />

          {/* Light Intensity (Custom Binning Logic) */}
          <LightCard value={data.a} />

          {/* Motion */}
          <MotionCard isMotionDetected={data.p} />

        </div>

        {/* Secondary Section: History & Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Line Graph: Temperature, Humidity, and Light History */}
          <div className="lg:col-span-2 bg-slate-900 rounded-xl p-6 border border-slate-800">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Activity size={20} className="text-indigo-500" />
              Recent Activity
            </h3>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span className="text-slate-400">Temperature (°C)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                <span className="text-slate-400">Humidity (%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-slate-400">Light (scaled)</span>
              </div>
            </div>

            <div className="h-64 relative" onMouseLeave={() => setHoveredPoint(null)}>
              {history.length > 1 ? (
                <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={200 - y * 2}
                      x2="400"
                      y2={200 - y * 2}
                      stroke="#334155"
                      strokeWidth="1"
                      strokeDasharray="4"
                    />
                  ))}

                  {/* Vertical hover indicator line */}
                  {hoveredPoint !== null && (
                    <line
                      x1={(hoveredPoint / (history.length - 1)) * 400}
                      y1="0"
                      x2={(hoveredPoint / (history.length - 1)) * 400}
                      y2="200"
                      stroke="#64748b"
                      strokeWidth="1"
                      strokeDasharray="4"
                    />
                  )}

                  {/* Temperature Line (scale: 0-50°C mapped to 0-100) */}
                  <polyline
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={history.map((reading, i) => {
                      const x = (i / (history.length - 1)) * 400;
                      const y = 200 - Math.min((reading.t / 50) * 200, 200);
                      return `${x},${y}`;
                    }).join(' ')}
                  />

                  {/* Humidity Line (scale: 0-100%) */}
                  <polyline
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={history.map((reading, i) => {
                      const x = (i / (history.length - 1)) * 400;
                      const y = 200 - Math.min((reading.h / 100) * 200, 200);
                      return `${x},${y}`;
                    }).join(' ')}
                  />

                  {/* Light Line (scale: 0-1023 mapped to 0-100) */}
                  <polyline
                    fill="none"
                    stroke="#facc15"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={history.map((reading, i) => {
                      const x = (i / (history.length - 1)) * 400;
                      const y = 200 - Math.min((reading.a / 1023) * 200, 200);
                      return `${x},${y}`;
                    }).join(' ')}
                  />

                  {/* Interactive hover zones - invisible rectangles for easier hover */}
                  {history.map((reading, i) => {
                    const x = (i / (history.length - 1)) * 400;
                    const width = 400 / Math.max(history.length - 1, 1);
                    return (
                      <rect
                        key={`hover-${i}`}
                        x={x - width / 2}
                        y="0"
                        width={width}
                        height="200"
                        fill="transparent"
                        style={{ cursor: 'crosshair' }}
                        onMouseEnter={() => setHoveredPoint(i)}
                      />
                    );
                  })}

                  {/* Data points for Temperature */}
                  {history.map((reading, i) => {
                    const x = (i / (history.length - 1)) * 400;
                    const y = 200 - Math.min((reading.t / 50) * 200, 200);
                    const isHovered = hoveredPoint === i;
                    return (
                      <circle
                        key={`t-${i}`}
                        cx={x}
                        cy={y}
                        r={isHovered ? 6 : 4}
                        fill="#818cf8"
                        stroke={isHovered ? "#fff" : "none"}
                        strokeWidth="2"
                        style={{ transition: 'r 0.15s ease' }}
                      />
                    );
                  })}

                  {/* Data points for Humidity */}
                  {history.map((reading, i) => {
                    const x = (i / (history.length - 1)) * 400;
                    const y = 200 - Math.min((reading.h / 100) * 200, 200);
                    const isHovered = hoveredPoint === i;
                    return (
                      <circle
                        key={`h-${i}`}
                        cx={x}
                        cy={y}
                        r={isHovered ? 6 : 4}
                        fill="#22d3ee"
                        stroke={isHovered ? "#fff" : "none"}
                        strokeWidth="2"
                        style={{ transition: 'r 0.15s ease' }}
                      />
                    );
                  })}

                  {/* Data points for Light */}
                  {history.map((reading, i) => {
                    const x = (i / (history.length - 1)) * 400;
                    const y = 200 - Math.min((reading.a / 1023) * 200, 200);
                    const isHovered = hoveredPoint === i;
                    return (
                      <circle
                        key={`a-${i}`}
                        cx={x}
                        cy={y}
                        r={isHovered ? 6 : 4}
                        fill="#facc15"
                        stroke={isHovered ? "#fff" : "none"}
                        strokeWidth="2"
                        style={{ transition: 'r 0.15s ease' }}
                      />
                    );
                  })}
                </svg>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  Waiting for data stream...
                </div>
              )}

              {/* Tooltip */}
              {hoveredPoint !== null && history[hoveredPoint] && (
                <div
                  className="absolute bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl z-20 pointer-events-none"
                  style={{
                    left: `${Math.min(Math.max((hoveredPoint / (history.length - 1)) * 100, 15), 85)}%`,
                    top: '10px',
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="text-xs text-slate-400 mb-2 font-mono">
                    {new Date(history[hoveredPoint].timestamp).toLocaleTimeString()}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      <span className="text-slate-300">Temp:</span>
                      <span className="text-indigo-400 font-semibold">{history[hoveredPoint].t}°C</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                      <span className="text-slate-300">Humidity:</span>
                      <span className="text-cyan-400 font-semibold">{history[hoveredPoint].h}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span className="text-slate-300">Light:</span>
                      <span className="text-yellow-400 font-semibold">{history[hoveredPoint].a}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Incoming Data Stream Log */}
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 overflow-hidden flex flex-col">
            <h3 className="text-lg font-medium text-white mb-4">Incoming JSON</h3>
            <div className="flex-1 bg-black rounded-lg p-4 font-mono text-xs text-emerald-400 overflow-y-auto border border-slate-800 relative">
              <div className="absolute top-2 right-2 flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <pre>
                {JSON.stringify(data, null, 2)}
              </pre>
              <div className="mt-4 pt-4 border-t border-slate-800 text-slate-500">
                <p className="mb-2 text-slate-400 font-semibold">Sensor Logic:</p>
                <ul className="space-y-1 list-disc pl-4">
                  <li>LDR &lt; 300: <span className="text-slate-300">Low</span></li>
                  <li>LDR 300-700: <span className="text-yellow-500">Medium</span></li>
                  <li>LDR &gt; 700: <span className="text-orange-500">High</span></li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}