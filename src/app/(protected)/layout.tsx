"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setTimeoutReached(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Redirect if not authenticated after loading completes
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !timeoutReached) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, timeoutReached, router]);

  if (isLoading && !timeoutReached) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  // If timeout reached and still loading, try to show content anyway
  // The middleware handles the actual auth check
  if (timeoutReached && isLoading) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}