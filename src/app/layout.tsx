import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { TabBar } from "@/components/TabBar";
import { OfflineBanner } from "@/components/OfflineBanner";
import { ServiceWorker } from "@/components/ServiceWorker";
import { CommunityAccess } from "@/components/CommunityAccess";

// Display: tight, slightly quirky grotesque for headings and the wordmark.
const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

// Body and data: the Plex family, whose origins are in computing — a small
// nod to the subject, and it holds up at small sizes on a phone.
const body = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Community ICT Hub",
  description:
    "Empowerment Technologies Quarter 1 modules and quizzes. Works without a connection.",
  applicationName: "Community ICT Hub",
  appleWebApp: { capable: true, title: "Community ICT Hub", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#191a3d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body>
        <div className="shell">
          <OfflineBanner />
          <div className="content"><CommunityAccess>{children}</CommunityAccess></div>
          <TabBar />
        </div>
        <ServiceWorker />
      </body>
    </html>
  );
}
