import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

type QueryClientProviderProps = {
  children: React.ReactNode
}

export const queryClient = new QueryClient()

export function QueryClientWrapper({ children }: QueryClientProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
