import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { TabBar } from "@/components/TabBar";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ServiceWorker } from "@/components/ServiceWorker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "E-SMMAp",
  description:
    "Empowerment Technologies Quarter 1 modules and quizzes for Pasay City South High School. Works without a connection.",
  applicationName: "E-SMMAp",
  appleWebApp: { capable: true, title: "E-SMMAp", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#1e6b52",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body>
        <div className="shell">
          <OfflineBanner />
          <div className="content">{children}</div>
          <TabBar />
        </div>
        <ServiceWorker />
      </body>
    </html>
  );
}
