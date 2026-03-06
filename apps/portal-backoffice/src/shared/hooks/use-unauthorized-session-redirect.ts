import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/app/providers/auth-provider";
import { routes } from "@/shared/constants/routes";

export function useUnauthorizedSessionRedirect(hasUnauthorizedError: boolean): void {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    if (!hasUnauthorizedError) {
      return;
    }

    logout();
    navigate(routes.login, { replace: true });
  }, [hasUnauthorizedError, logout, navigate]);
}
