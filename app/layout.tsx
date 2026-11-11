import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Montserrat } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/navigation/SiteHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "PriceScout - Compare grocery prices",
  description:
    "Compare grocery prices across stores, build a shopping list, and get the cheapest shopping plan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={montserrat.variable}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
