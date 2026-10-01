"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace("/login");
    } else if (!isLoading && currentUser && !allowedRoles.includes(currentUser.role)) {
      // Logged in but wrong role — redirect to their own dashboard
      const roleMap: Record<UserRole, string> = {
        MASTER: "/master",
        MANAGER: "/admin",
        ADMIN: "/admin",
        BENDAHARA: "/bendahara",
        ANGGOTA: "/anggota",
      };
      router.replace(roleMap[currentUser.role]);
    }
  }, [currentUser, isLoading, router, allowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat sistem...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return null;
  }

  return <>{children}</>;
}
