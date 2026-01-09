import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast"; //

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
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        {/* Configuración de notificaciones profesionales */}
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: '#18181b', // Zinc-900
              color: '#fff',
              border: '1px solid #27272a', // Zinc-800
              borderRadius: '16px',
              fontSize: '14px'
            },
          }} 
        />
      </body>
    </html>
  );
}