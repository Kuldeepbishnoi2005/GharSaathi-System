import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import { Navigation } from '@/components/Navigation';
import { PwaRegister } from '@/components/PwaRegister';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'GharSaathi - Household Staff Attendance & Payment Tracker',
  description: 'Effortlessly track daily attendance and monthly payments for your household staff.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GharSaathi',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#183C32',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="bg-[#EAEBE6] sm:bg-[#EAEBE6] text-[#1A1C1B] min-h-screen flex justify-center" suppressHydrationWarning>
        <AuthProvider>
          <DataProvider>
            <PwaRegister />
            <div className="w-full max-w-md min-h-screen bg-[#F9F9F7] shadow-2xl relative flex flex-col sm:border-x sm:border-[#E2E3E0]">
              <Navigation />
              <main className="flex-1 pb-24">{children}</main>
            </div>
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
