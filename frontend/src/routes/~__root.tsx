import { Outlet, createRootRoute, redirect } from "@tanstack/react-router";

export const Route = createRootRoute({
  beforeLoad: () => {
    // Check if user is trying to access a route that requires auth
    // If not authenticated, they can still view home but API calls will prompt for login
  },
  component: RootComponent,
});

function RootComponent() {
  return <Outlet />;
}
