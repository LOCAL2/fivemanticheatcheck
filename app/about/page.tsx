import Link from "next/link";

export default function AboutPage() {
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
        </div>

        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            ℹ️ เกี่ยวกับเว็บไซต์
          </h1>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                🎯 วัตถุประสงค์
              </h2>
              <p>
                เว็บไซต์นี้สร้างขึ้นเพื่อแสดงรายการเซิร์ฟเวอร์ FiveM ในประเทศไทย 
                พร้อมข้อมูลระบบ Anti-Cheat ที่แต่ละเซิร์ฟเวอร์ใช้งาน 
                เพื่อให้ผู้เล่นสามารถเลือกเซิร์ฟเวอร์ที่เหมาะสมได้ง่ายขึ้น
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                🔌 แหล่งข้อมูล
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="mb-2">
                  <strong>API Endpoint:</strong>
                </p>
                <code className="block bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm overflow-x-auto">
                  https://www.demoxshop.com/api_proxy.php?locale=th-TH
                </code>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                🛡️ ระบบ Anti-Cheat
              </h2>
              <p className="mb-4">
                ข้อมูลระบบ Anti-Cheat ถูกจัดเก็บในไฟล์ CSV และแสดงเป็น Badge บนแต่ละเซิร์ฟเวอร์:
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    GHOSTX
                  </span>
                  <span>- ระบบ Anti-Cheat ยอดนิยม</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    CRCBOY
                  </span>
                  <span>- ระบบ Anti-Cheat ทางเลือก</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Launcher
                  </span>
                  <span>- ใช้ Launcher ในการตรวจสอบ</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    กันโปรของตัวเอง
                  </span>
                  <span>- พัฒนาระบบเอง</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                    ไม่มีระบบ Anti-Cheat
                  </span>
                  <span>- ไม่มีข้อมูลหรือไม่ได้ใช้ระบบ</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                💻 เทคโนโลยี
              </h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Next.js 16 - React Framework</li>
                <li>TypeScript - Type Safety</li>
                <li>Tailwind CSS - Styling</li>
                <li>Server-side & Client-side Rendering</li>
              </ul>
            </section>

            <section className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                หมายเหตุ: ข้อมูลเซิร์ฟเวอร์และระบบ Anti-Cheat อาจมีการเปลี่ยนแปลง 
                กรุณาตรวจสอบกับเซิร์ฟเวอร์โดยตรงเพื่อความแม่นยำ
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
