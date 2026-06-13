import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { api, getApiErrorMessage } from "@/lib/api";
import { dummyUser } from "@/lib/dummy-data";
import type {
  API_SUCCESS,
  LOGIN_PAYLOAD,
  LOGIN_RESPONSE,
  ME_RESPONSE,
  USER,
} from "@/lib/types";

export default function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const useGetCurrentUser = () =>
    useQuery({
      queryKey: ["get-current-user"],
      queryFn: async () => {
        try {
          const { data } = await api.get<API_SUCCESS<ME_RESPONSE>>("/auth/me");
          return data.data?.user || dummyUser;
        } catch {
          return dummyUser;
        }
      },
      retry: false,
      staleTime: 5 * 60 * 1000,
    });

  const useLogin = () =>
    useMutation({
      mutationKey: ["login"],
      mutationFn: async (payload: LOGIN_PAYLOAD) => {
        const { data } = await api.post<API_SUCCESS<LOGIN_RESPONSE>>(
          "/auth/login",
          payload,
        );
        return data.data.user;
      },
      onSuccess: (user) => {
        queryClient.setQueryData<USER>(["get-current-user"], user);
        void navigate({ to: "/boards" });
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, "Invalid email or password"));
      },
    });

  const useLogout = () =>
    useMutation({
      mutationKey: ["logout"],
      mutationFn: async () => {
        await api.post("/auth/logout");
      },
      onSuccess: () => {
        queryClient.clear();
        void navigate({ to: "/login" });
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });

  return { useGetCurrentUser, useLogin, useLogout };
}
