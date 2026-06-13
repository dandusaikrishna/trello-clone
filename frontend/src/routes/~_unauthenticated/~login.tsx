import { createFileRoute, redirect } from "@tanstack/react-router";
import { lazy } from "react";
import { api } from "@/lib/api";
import type { API_SUCCESS, ME_RESPONSE } from "@/lib/types";

const LoginPage = lazy(
  () => import("./components/login-page"),
);

export const Route = createFileRoute("/_unauthenticated/login")({
  beforeLoad: async () => {
    try {
      await api.get<API_SUCCESS<ME_RESPONSE>>("/auth/me");
      throw redirect({ to: "/boards" });
    } catch {
      return;
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <LoginPage />;
}
