import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const BoardsListing = lazy(
  () => import("./components/listing"),
);

export const Route = createFileRoute("/_authenticated/boards/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <BoardsListing />;
}
