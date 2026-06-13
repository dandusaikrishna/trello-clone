import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { routeTree } from "../../routeTree.gen";
import { Toaster } from "../ui/sonner";
import { TooltipProvider } from "../ui/tooltip";
import { QueryClientWrapper } from "./query-client-provider";
// import { ThemeProvider } from "./theme-provider";

// eslint-disable-next-line react-refresh/only-export-components
export const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function Providers() {
  return (
    <StrictMode>
      <QueryClientWrapper>
        {/* <ThemeProvider> */}
        <Toaster richColors />
        <TooltipProvider delayDuration={0} skipDelayDuration={0}>
          <RouterProvider router={router} />
        </TooltipProvider>
        {/* </ThemeProvider> */}
      </QueryClientWrapper>
    </StrictMode>
  );
}
