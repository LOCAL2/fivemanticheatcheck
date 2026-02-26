"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface ServerData {
  EndPoint: string;
  Data: {
    clients: number;
    svMaxclients: number;
    hostname: string;
    gametype: string;
    mapname: string;
    iconVersion?: number;
    vars?: {
      sv_projectName?: string;
      sv_projectDesc?: string;
      tags?: string;
    };
    connectEndPoints?: string[];
  };
}

interface AntiCheatMap {
  [key: string]: string;
}

// Animated Counter Component
function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const prevValue = prevValueRef.current;
    if (prevValue === value) return;

    const startTime = Date.now();
    const difference = value - prevValue;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      // Easing function
      const easeOutQuad = (t: number) => t * (2 - t);
      const easedProgress = easeOutQuad(progress);
      
      const currentValue = Math.round(prevValue + difference * easedProgress);
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValueRef.current = value;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{displayValue}</>;
}

function ServerBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [servers, setServers] = useState<ServerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [antiCheatMap, setAntiCheatMap] = useState<AntiCheatMap>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const serversPerPage = 20;

  // Initialize from URL params
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    setCurrentPage(page);
    setSearchTerm(search);
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    async function loadData() {
      if (!isMounted) return;
      
      const startTime = Date.now();
      console.log('🔄 [FETCH START]', new Date().toLocaleTimeString('th-TH'));
      
      try {
        // โหลดทั้ง CSV และ API พร้อมกัน
        console.log('📡 Fetching CSV and API...');
        const [csvResponse, apiResponse] = await Promise.all([
          fetch("/server_list.csv"),
          fetch("https://www.demoxshop.com/api_proxy.php?locale=th-TH")
        ]);
        
        if (!isMounted) return;
        
        console.log('✅ Fetch completed in', Date.now() - startTime, 'ms');
        console.log('📄 CSV Status:', csvResponse.status);
        console.log('🌐 API Status:', apiResponse.status);
        
        const [csvText, data] = await Promise.all([
          csvResponse.text(),
          apiResponse.json()
        ]);
        
        if (!isMounted) return;
        
        console.log('📊 CSV Length:', csvText.length, 'bytes');
        
        // Parse CSV
        const map: AntiCheatMap = {};
        const lines = csvText.split("\n").slice(1);
        
        lines.forEach(line => {
          const [serverName, antiCheat] = line.split(",").map(s => s.trim());
          if (serverName && antiCheat) {
            map[serverName.toLowerCase()] = antiCheat;
          }
        });
        
        console.log('🗺️ Anti-Cheat Map Size:', Object.keys(map).length);
        setAntiCheatMap(map);

        console.log('📦 API Response type:', typeof data);
        console.log('📋 Is Array:', Array.isArray(data));
        console.log('🔢 Total servers received:', Array.isArray(data) ? data.length : 0);
        
        if (Array.isArray(data)) {
          // ใช้ callback function เพื่อเข้าถึง state ล่าสุด
          setServers(prevServers => {
            const currentCount = prevServers.length;
            const newCount = data.length;
            const threshold = Math.floor(currentCount * 0.8);
            
            console.log('📊 Current server count:', currentCount);
            console.log('📊 New server count:', newCount);
            console.log('📊 Threshold (80%):', threshold);
            
            if (currentCount > 0 && newCount < threshold) {
              console.warn('⚠️ [SKIP UPDATE] Incomplete data detected!');
              console.warn('   Expected at least:', threshold);
              console.warn('   Received:', newCount);
              console.warn('   Difference:', currentCount - newCount, 'servers missing');
              console.warn('   Percentage:', Math.round((newCount / currentCount) * 100) + '%');
              return prevServers; // ไม่ update
            }
            
            // ตรวจสอบ server ที่หายไป
            if (currentCount > 0) {
              const currentEndpoints = new Set(prevServers.map(s => s.EndPoint));
              const newEndpoints = new Set(data.map((s: ServerData) => s.EndPoint));
              
              const missing = [...currentEndpoints].filter(ep => !newEndpoints.has(ep));
              const added = [...newEndpoints].filter(ep => !currentEndpoints.has(ep));
              
              if (missing.length > 0) {
                console.log('❌ Missing servers:', missing.length);
                console.log('   Endpoints:', missing.slice(0, 5), missing.length > 5 ? '...' : '');
              }
              
              if (added.length > 0) {
                console.log('✨ New servers:', added.length);
                console.log('   Endpoints:', added.slice(0, 5), added.length > 5 ? '...' : '');
              }
              
              if (missing.length === 0 && added.length === 0) {
                console.log('✅ All servers present, no changes in server list');
              }
            }
            
            console.log('💾 Updating server state...');
            setLastUpdate(new Date());
            console.log('✅ [UPDATE SUCCESS] State updated at', new Date().toLocaleTimeString('th-TH'));
            
            return data; // update ด้วยข้อมูลใหม่
          });
        } else {
          console.error('❌ Data is not an array:', data);
        }
        
        console.log('⏱️ Total time:', Date.now() - startTime, 'ms');
        console.log('─────────────────────────────────────');
        
      } catch (err) {
        console.error('❌ [ERROR] Failed to load data:', err);
        console.error('   Error type:', err instanceof Error ? err.name : typeof err);
        console.error('   Error message:', err instanceof Error ? err.message : String(err));
        console.error('⏱️ Failed after:', Date.now() - startTime, 'ms');
        console.error('─────────────────────────────────────');
      } finally {
        // ตั้ง loading เป็น false เฉพาะครั้งแรก
        if (loading && isMounted) {
          console.log('🎬 Initial loading complete');
          setLoading(false);
        }
      }
    }

    console.log('🚀 [INIT] Starting data fetch cycle...');
    loadData();

    // Auto-refresh ทุก 5 วินาที
    console.log('⏰ Setting up auto-refresh (5s interval)');
    const interval = setInterval(() => {
      console.log('🔁 [AUTO-REFRESH] Triggered');
      loadData();
    }, 5000);

    // Cleanup interval เมื่อ component unmount
    return () => {
      console.log('🛑 Cleaning up auto-refresh interval');
      isMounted = false;
      clearInterval(interval);
    };
  }, []); // ลบ loading dependency

  const getAntiCheat = (hostname: string): string => {
    const cleanName = hostname
      .replace(/\^[0-9]/g, "")
      .replace(/[^\w\s]/g, "")
      .trim()
      .toLowerCase();

    for (const [serverName, antiCheat] of Object.entries(antiCheatMap)) {
      if (cleanName.includes(serverName) || serverName.includes(cleanName)) {
        return antiCheat;
      }
    }

    return "ไม่มีระบบ Anti-Cheat";
  };

  const getAntiCheatBadge = (antiCheat: string) => {
    const badges: { [key: string]: { bg: string; text: string; border: string; glow: string } } = {
      "GHOSTX": { 
        bg: "bg-gradient-to-r from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700", 
        text: "text-white", 
        border: "border-red-500/20",
        glow: "shadow-lg shadow-red-500/20"
      },
      "CRCBOY": { 
        bg: "bg-gradient-to-r from-blue-500 to-cyan-600 dark:from-blue-600 dark:to-cyan-700", 
        text: "text-white", 
        border: "border-blue-500/20",
        glow: "shadow-lg shadow-blue-500/20"
      },
      "Launcher": { 
        bg: "bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700", 
        text: "text-white", 
        border: "border-indigo-500/20",
        glow: "shadow-lg shadow-indigo-500/20"
      },
      "กันโปรของตัวเอง": { 
        bg: "bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700", 
        text: "text-white", 
        border: "border-amber-500/20",
        glow: "shadow-lg shadow-amber-500/20"
      },
      "ไม่มีระบบ Anti-Cheat": { 
        bg: "bg-gray-100 dark:bg-gray-800", 
        text: "text-gray-600 dark:text-gray-400", 
        border: "border-gray-300 dark:border-gray-700",
        glow: ""
      }
    };

    return badges[antiCheat] || badges["ไม่มีระบบ Anti-Cheat"];
  };

  const filteredServers = servers.filter(server => {
    if (!server?.Data?.hostname) return false;
    try {
      const cleanHostname = server.Data.hostname.replace(/\^[0-9]/g, "").toLowerCase();
      return cleanHostname.includes(searchTerm.toLowerCase());
    } catch (err) {
      return false;
    }
  }).sort((a, b) => {
    // เรียงจากจำนวนผู้เล่นมากไปน้อย
    const playersA = a.Data.clients || 0;
    const playersB = b.Data.clients || 0;
    return playersB - playersA;
  });

  // Pagination
  const totalPages = Math.ceil(filteredServers.length / serversPerPage);
  const startIndex = (currentPage - 1) * serversPerPage;
  const endIndex = startIndex + serversPerPage;
  const currentServers = filteredServers.slice(startIndex, endIndex);

  // Update URL and scroll to top
  const updatePage = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (searchTerm) {
      params.set('search', searchTerm);
    }
    router.push(`?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to page 1 when search changes
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    const params = new URLSearchParams();
    params.set('page', '1');
    if (value) {
      params.set('search', value);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            {/* Outer ring */}
            <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
            {/* Spinning gradient ring */}
            <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 border-r-purple-500 rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-white">กำลังโหลดข้อมูล</p>
            <p className="text-sm text-slate-400">กรุณารอสักครู่...</p>
          </div>
          {/* Loading dots animation */}
          <div className="flex justify-center gap-2 mt-6">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                  Server Fivem Anti Cheat Check
                </h1>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                    <p className="text-sm text-slate-400">
                      <span className="font-semibold text-white"><AnimatedCounter value={filteredServers.length} /></span> เซิร์ฟเวอร์ออนไลน์
                    </p>
                  </div>
                  {lastUpdate && (
                    <>
                      <div className="h-4 w-px bg-slate-700"></div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-slate-500">
                          อัพเดท: {lastUpdate.toLocaleTimeString('th-TH', { 
                            timeZone: 'Asia/Bangkok',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative group">
              <input
                type="text"
                placeholder="ค้นหาเซิร์ฟเวอร์..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-5 py-3.5 pl-12 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all backdrop-blur-sm"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Server List */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pagination Info */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            แสดง <span className="text-white font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredServers.length)}</span> จาก <span className="text-white font-semibold">{filteredServers.length}</span> เซิร์ฟเวอร์
          </p>
          <p className="text-sm text-slate-400">
            หน้า <span className="text-white font-semibold">{currentPage}</span> / <span className="text-white font-semibold">{totalPages}</span>
          </p>
        </div>

        <div className="space-y-4">
          {currentServers.map((server, index) => {
            const globalIndex = startIndex + index;
            const antiCheat = getAntiCheat(server.Data.hostname);
            const badge = getAntiCheatBadge(antiCheat);
            const cleanHostname = server.Data.hostname.replace(/\^[0-9]/g, "");
            const currentPlayers = server.Data.clients || 0;
            const maxPlayers = server.Data.svMaxclients || 0;
            const playerPercentage = maxPlayers > 0 ? (currentPlayers / maxPlayers) * 100 : 0;
            const serverIconUrl = server.Data.iconVersion 
              ? `https://servers-frontend.fivem.net/api/servers/icon/${server.EndPoint}/${server.Data.iconVersion}.png`
              : '';
            const serverIP = server.Data.connectEndPoints?.[0] || "N/A";
            const displayIP = serverIP.includes("private-placeholder.cfx.re") ? "-" : serverIP;
            const mapName = server.Data.mapname;
            const displayMap = mapName && (mapName.includes("discord.gg") || mapName.includes("https://")) ? "-" : mapName;

            return (
              <div
                key={server.EndPoint}
                className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10 flex flex-col gap-4">
                  {/* Server Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-shrink-0 relative group/icon">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-black shadow-2xl ring-2 ring-slate-800 group-hover/icon:ring-indigo-500/50 transition-all">
                          {serverIconUrl ? (
                            <img
                              src={serverIconUrl}
                              alt={cleanHostname}
                              className="w-full h-full object-cover group-hover/icon:scale-110 transition-transform duration-500"
                              loading="eager"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                // ลองโหลดใหม่อีกครั้ง
                                if (!target.dataset.retried) {
                                  target.dataset.retried = 'true';
                                  setTimeout(() => {
                                    target.src = serverIconUrl;
                                  }, 1000);
                                } else {
                                  // ถ้าโหลดไม่ได้จริงๆ แสดงเลขลำดับ
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-2xl bg-gradient-to-br from-indigo-600 to-purple-600">${globalIndex + 1}</div>`;
                                  }
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl bg-gradient-to-br from-indigo-600 to-purple-600">
                              {globalIndex + 1}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs font-bold rounded">#{globalIndex + 1}</span>
                          <h2 className="text-xl font-bold text-white truncate">
                            {cleanHostname}
                          </h2>
                        </div>
                        {server.Data.vars?.sv_projectDesc && (
                          <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                            {server.Data.vars.sv_projectDesc.replace(/\^[0-9]/g, "")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl px-3 py-3 border border-slate-700/50">
                        <p className="text-xs font-medium text-slate-500 mb-2">ผู้เล่น</p>
                        <p className="text-sm font-bold text-white mb-2">
                          <AnimatedCounter value={currentPlayers} /> / <AnimatedCounter value={maxPlayers} />
                        </p>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 rounded-full shadow-lg shadow-indigo-500/50"
                            style={{ width: `${Math.min(playerPercentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl px-3 py-3 border border-slate-700/50">
                        <p className="text-xs font-medium text-slate-500 mb-2">โหมดเกม</p>
                        <p className="text-sm font-semibold text-white truncate">
                          {server.Data.gametype}
                        </p>
                      </div>

                      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl px-3 py-3 border border-slate-700/50">
                        <p className="text-xs font-medium text-slate-500 mb-2">แผนที่</p>
                        <p className="text-sm font-semibold text-white truncate">
                          {displayMap}
                        </p>
                      </div>

                      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl px-3 py-3 border border-slate-700/50">
                        <p className="text-xs font-medium text-slate-500 mb-2">ไอพี</p>
                        <p className="text-xs font-mono font-semibold text-white truncate">
                          {displayIP}
                        </p>
                      </div>

                      {/* Anti-Cheat Badge */}
                      <div className={`${badge.bg} ${badge.text} ${badge.glow} rounded-xl px-4 py-3 backdrop-blur-sm relative overflow-hidden group/badge border-2 ${badge.border}`}>
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/badge:translate-x-full transition-transform duration-700"></div>
                        
                        <div className="relative z-10 text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-xs font-bold uppercase tracking-widest">
                              Anti-Cheat
                            </p>
                          </div>
                          <p className="text-lg font-black tracking-tight">{antiCheat}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredServers.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl text-slate-400">ไม่พบเซิร์ฟเวอร์ที่ค้นหา</p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => updatePage(1)}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              ««
            </button>
            <button
              onClick={() => updatePage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              «
            </button>
            
            {/* Page Numbers */}
            <div className="flex gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => updatePage(pageNum)}
                    className={`px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                      currentPage === pageNum
                        ? "bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500 text-white font-semibold"
                        : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => updatePage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              »
            </button>
            <button
              onClick={() => updatePage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              »»
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative border-t border-slate-800/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-xs text-slate-600">
              พัฒนาโดย <span className="text-indigo-400 font-semibold">Barron ItsHard</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 border-r-purple-500 rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-white">กำลังโหลดข้อมูล</p>
            <p className="text-sm text-slate-400">กรุณารอสักครู่...</p>
          </div>
          <div className="flex justify-center gap-2 mt-6">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    }>
      <ServerBrowser />
    </Suspense>
  );
}
