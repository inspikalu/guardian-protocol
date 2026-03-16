import type { Metadata } from "next";
import { Mona_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const monaSans = Mona_Sans({
  variable: "--font-mona",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Guardian Protocol | Next-Gen Security",
  description: "On-chain orchestration and security patterns for the Solana ecosystem.",
};

import { SolanaProvider } from "@/components/providers/solana-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${monaSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <SolanaProvider>
              {children}
            </SolanaProvider>
          </QueryProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
