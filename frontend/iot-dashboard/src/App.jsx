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

// 4. Main Application
export default function App() {
  // State for sensor readings
  const [data, setData] = useState({
    temp: 24.5,
    humidity: 45,
    ldr: 500,
    motion: false,
    timestamp: new Date().toISOString()
  });

  const [history, setHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(true);

  // Simulation of receiving data via WebSocket/API
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random sensor fluctuation
      const newTemp = parseFloat((24 + Math.random() * 5 - 2.5).toFixed(1));
      const newHum = Math.floor(40 + Math.random() * 20);
      const newLdr = Math.floor(Math.random() * 1024);
      const newMotion = Math.random() > 0.8; // 20% chance of motion

      const newData = {
        temp: newTemp,
        humidity: newHum,
        ldr: newLdr,
        motion: newMotion,
        timestamp: new Date().toISOString()
      };

      setData(newData);
      
      // Keep last 10 readings for potential graphing
      setHistory(prev => [...prev.slice(-9), newData]);
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  // Determine Temp Status
  const getTempStatus = (t) => {
    if (t > 28) return { text: 'Warm', color: 'text-orange-500' };
    if (t < 18) return { text: 'Cool', color: 'text-blue-500' };
    return { text: 'Optimal', color: 'text-emerald-500' };
  };

  const tempStatus = getTempStatus(data.temp);

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
            value={data.temp} 
            unit="°C" 
            icon={Thermometer} 
            color="text-indigo-400"
            subtext={tempStatus.text}
            trend={data.temp > 28 ? 'danger' : 'safe'}
          />

          {/* Humidity */}
          <StatCard 
            title="Humidity" 
            value={data.humidity} 
            unit="%" 
            icon={Droplets} 
            color="text-cyan-400"
            subtext={data.humidity > 60 ? 'High' : 'Normal'}
            trend={data.humidity > 60 ? 'danger' : 'safe'}
          />

          {/* Light Intensity (Custom Binning Logic) */}
          <LightCard value={data.ldr} />

          {/* Motion */}
          <MotionCard isMotionDetected={data.motion} />

        </div>

        {/* Secondary Section: History & Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Simple Visualization: Temperature History */}
          <div className="lg:col-span-2 bg-slate-900 rounded-xl p-6 border border-slate-800">
            <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
              <Activity size={20} className="text-indigo-500" />
              Recent Activity
            </h3>
            
            <div className="h-64 flex items-end justify-between gap-2">
              {history.map((reading, i) => {
                 // Calculate height based on temp (scale 0-40)
                 const heightPercent = Math.min((reading.temp / 40) * 100, 100);
                 const isHigh = reading.temp > 28;
                 
                 return (
                   <div key={i} className="w-full flex flex-col items-center gap-2 group">
                     <div className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity absolute mb-8">
                       {reading.temp}°
                     </div>
                     <div 
                        className={`w-full rounded-t-sm transition-all duration-500 ${isHigh ? 'bg-indigo-500' : 'bg-slate-700 hover:bg-slate-600'}`}
                        style={{ height: `${heightPercent}%` }}
                     />
                     <div className="text-[10px] text-slate-600 font-mono hidden sm:block">
                        {new Date(reading.timestamp).getSeconds()}s
                     </div>
                   </div>
                 )
              })}
              {history.length === 0 && (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  Waiting for data stream...
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