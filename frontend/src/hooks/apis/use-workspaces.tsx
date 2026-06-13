import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { dummyWorkspace } from "@/lib/dummy-data";
import type { API_SUCCESS, WORKSPACE, WORKSPACE_DETAILS } from "@/lib/types";

export default function useWorkspaces() {
  const useGetWorkspaces = () =>
    useQuery({
      queryKey: ["get-workspaces"],
      queryFn: async () => {
        try {
          const { data } = await api.get<API_SUCCESS<WORKSPACE[]>>("/workspaces");
          return data.data && data.data.length > 0 ? data.data : [dummyWorkspace];
        } catch {
          return [dummyWorkspace];
        }
      },
    });

  const useGetWorkspaceDetails = (workspaceId: string) =>
    useQuery({
      queryKey: ["get-workspace-details", workspaceId],
      queryFn: async () => {
        try {
          const { data } = await api.get<API_SUCCESS<WORKSPACE_DETAILS>>(
            `/workspaces/${workspaceId}`,
          );
          return data.data || dummyWorkspace;
        } catch {
          return dummyWorkspace;
        }
      },
      enabled: Boolean(workspaceId),
    });

  return { useGetWorkspaces, useGetWorkspaceDetails };
}
