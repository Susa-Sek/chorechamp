import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { HouseholdProvider } from "@/components/household/household-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChoreChamp - Gamification für deinen Haushalt",
  description: "Mach deinen Haushalt zum Spiel. Sammle Punkte, steige Levels auf und löse Belohnungen ein.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <AuthProvider>
          <HouseholdProvider>
            {children}
          </HouseholdProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}