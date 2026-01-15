import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MILI OS - Control Center",
  description: "Sistema operativo personal de productividad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#050505] text-zinc-200 min-h-screen selection:bg-purple-500/30`}
      >
        {/* Envoltura principal para efectos globales de entrada */}
        <main className="relative">
          {children}
        </main>

        {/* NOTIFICACIONES ESTILO TERMINAL PREMIUM */}
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(24, 24, 27, 0.8)', // Zinc-900 con transparencia
              color: '#fff',
              border: '1px solid rgba(168, 85, 247, 0.2)', // Borde sutil morado
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 'bold',
              letterSpacing: '0.02em',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
              padding: '12px 20px',
            },
            success: {
              iconTheme: {
                primary: '#a855f7', // Púrpura MILI OS
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
              style: {
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }
            }
          }} 
        />
      </body>
    </html>
  );
}