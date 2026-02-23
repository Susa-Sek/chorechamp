"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { redirect } from "next/navigation";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    redirect("/auth/login");
  }

  return <>{children}</>;
}