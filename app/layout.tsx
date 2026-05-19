// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { AppSettingsProvider } from "@/contexts/app-settings-context";
import { ThemeProvider } from "@/providers/theme-provider";
import { MainLayout } from "@/components/layout/main-layout";
import QueryProvider from "@/providers/query-provider";
import localFont from 'next/font/local'
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });
// const inter = localFont({
//   src: [
//     {
//       path: './fonts/inter/static/Inter_18pt-Regular.woff2',
//       weight: '400',
//       style: 'normal',
//     },
//     {
//       path: './fonts/inter/static/Inter_24pt-BoldItalic.woff2',
//       weight: '700',
//       style: 'normal',
//     },
//     {
//       path: './fonts/inter/static/Inter_18pt-Italic.woff2', 
//       weight: '400',
//       style: 'italic',
//     },
//     {
//       path: './fonts/inter/static/Inter_24pt-Italic.woff2',
//       weight: '700',
//       style: 'italic',
//     },
//     // thin
//   ],
// })

export const metadata: Metadata = {
  title: {
    default: "Lutte Traditionnelle",
    template: "%s | Lutte Traditionnelle"
  },
  description: "Plateforme de gestion des compétitions de lutte traditionnelle",
  keywords: ["lutte", "traditionnelle", "compétition", "sport", "match", "lutteur"],
  authors: [{ name: "Lutte Traditionnelle" }],
  creator: "Lutte Traditionnelle",
  publisher: "Lutte Traditionnelle",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://lutte-traditionnelle.com",
    title: "Lutte Traditionnelle",
    description: "Plateforme de gestion des compétitions de lutte traditionnelle",
    siteName: "Lutte Traditionnelle",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lutte Traditionnelle",
    description: "Plateforme de gestion des compétitions de lutte traditionnelle",
    creator: "@lutte_traditionnelle",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <AppSettingsProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <Suspense fallback={null}>
                  <MainLayout>
                    {children}
                  </MainLayout>
                </Suspense>
              </ThemeProvider>
            </AppSettingsProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}