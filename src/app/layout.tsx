import type { Metadata } from "next";
import { Nunito, Playfair_Display, Dancing_Script } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hamperly - Curated With Love",
  description: "Create and manage premium corporate gift hampers with ease.",
};

import { CartProvider } from "@/contexts/CartContext";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${playfair.variable} ${dancingScript.variable} font-sans h-full antialiased text-foreground bg-background`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
