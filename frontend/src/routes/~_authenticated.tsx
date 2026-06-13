import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { api } from "@/lib/api";
import type { API_SUCCESS, ME_RESPONSE } from "@/lib/types";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    try {
      await api.get<API_SUCCESS<ME_RESPONSE>>("/auth/me");
    } catch {
      throw redirect({
        to: "/login",
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <Outlet />;
}
