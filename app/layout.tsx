import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { Inter } from "next/font/google";
import { GlobalProvider } from "@/components/global-state";

export const metadata: Metadata = {
  title: "Liseberg VQ Pro",
  description: "Advanced virtual queue manager",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#050505",
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-indigo-500/30" style={{ fontFamily: inter.style.fontFamily }}>
        <GlobalProvider>
          <div className="max-w-md mx-auto min-h-screen flex flex-col relative">
            <div className="fixed top-[-10%] left-[-10%] w-[120%] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed top-[40%] right-[-20%] w-[80%] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
            <main className="flex-1 pb-28 relative z-10 px-6">
              {children}
            </main>
            <BottomNav />
          </div>
        </GlobalProvider>
      </body>
    </html>
  );
}