import type {Metadata} from "next";
import {Plus_Jakarta_Sans, Fraunces, Dancing_Script} from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hamperly - Curated With Love",
  description: "Create and manage premium corporate gift hampers with ease.",
};

import {CartProvider} from "@/contexts/CartContext";
import {WishlistProvider} from "@/contexts/WishlistContext";
import NextTopLoader from "nextjs-toploader";
import {getCurrentUser} from "@/services/auth.service";
import {InviteInterceptor} from "@/components/ui/InviteInterceptor";

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const user = await getCurrentUser();
  const userId = user?.id || "guest";

  return (
    <html lang="en" className={`${jakarta.variable} ${fraunces.variable} ${dancingScript.variable} font-sans h-full antialiased text-foreground bg-background`}>
      <head>
        <title>Hamperly</title>
      </head>
      <body className="min-h-full flex flex-col">
        <NextTopLoader color="#B83D72" showSpinner={false} />
        <InviteInterceptor />
        <WishlistProvider userId={userId}>
          <CartProvider userId={userId}>{children}</CartProvider>
        </WishlistProvider>
      </body>
    </html>
  );
}
