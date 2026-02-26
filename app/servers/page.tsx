"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ServerData {
  EndPoint: string;
  Data: {
    clients: number;
    svMaxclients: number;
    hostname: string;
    gametype: string;
    mapname: string;
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

export default function ServersPage() {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [antiCheatMap, setAntiCheatMap] = useState<AntiCheatMap>({});

  useEffect(() => {
    async function loadData() {
      try {
        // โหลดข้อมูล CSV
        const csvResponse = await fetch("/server_list.csv");
        const csvText = await csvResponse.text();
        
        const map: AntiCheatMap = {};
        const lines = csvText.split("\n").slice(1); // ข้าม header
        
        lines.forEach(line => {
          const [serverName, antiCheat] = line.split(",").map(s => s.trim());
          if (serverName && antiCheat) {
            map[serverName.toLowerCase()] = antiCheat;
          }
        });
        
        setAntiCheatMap(map);

        // โหลดข้อมูลเซิร์ฟเวอร์จาก API
        const apiResponse = await fetch(
          "https://www.demoxshop.com/api_proxy.php?locale=th-TH"
        );
        const data = await apiResponse.json();
        
        if (Array.isArray(data)) {
          setServers(data);
        } else {
          setServers([]);
        }
      } catch (err) {
        setError("ไม่สามารถโหลดข้อมูลได้");
        // Silent error handling
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

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
    const badges: { [key: string]: string } = {
      "GHOSTX": "bg-red-100 text-red-800 border-red-300",
      "CRCBOY": "bg-blue-100 text-blue-800 border-blue-300",
      "Launcher": "bg-green-100 text-green-800 border-green-300",
      "กันโปรของตัวเอง": "bg-yellow-100 text-yellow-800 border-yellow-300",
      "ไม่มีระบบ Anti-Cheat": "bg-gray-100 text-gray-800 border-gray-300"
    };

    return badges[antiCheat] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 dark:text-gray-300">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{error}</p>
          <Link href="/" className="text-indigo-600 hover:underline">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:underline mb-4"
          >
            ← กลับหน้าหลัก
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🖥️ รายการเซิร์ฟเวอร์ FiveM
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            พบ {servers.length} เซิร์ฟเวอร์
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servers.map((server, index) => {
            const antiCheat = getAntiCheat(server.Data.hostname);
            const badgeClass = getAntiCheatBadge(antiCheat);
            const cleanHostname = server.Data.hostname.replace(/\^[0-9]/g, "");

            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex-1 pr-2">
                    {cleanHostname}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badgeClass} whitespace-nowrap`}>
                    🛡️ {antiCheat}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">ผู้เล่น:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {server.Data.clients} / {server.Data.svMaxclients}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">โหมด:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {server.Data.gametype}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">แผนที่:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {server.Data.mapname}
                    </span>
                  </div>
                  {server.Data.connectEndPoints && server.Data.connectEndPoints[0] && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400 text-xs">
                        IP: {server.Data.connectEndPoints[0]}
                      </span>
                    </div>
                  )}
                </div>

                {server.Data.vars?.sv_projectDesc && (
                  <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {server.Data.vars.sv_projectDesc.replace(/\^[0-9]/g, "")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
