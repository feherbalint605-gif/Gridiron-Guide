import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

// Define the response types based on the schema and routes manifest
// We are trusting the types from @shared/routes, but explicitly typing hook returns helps IDEs

export function usePositions() {
  return useQuery({
    queryKey: [api.positions.list.path],
    queryFn: async () => {
      const res = await fetch(api.positions.list.path);
      if (!res.ok) throw new Error("Failed to fetch positions");
      // Validate with Zod schema from api definition
      return api.positions.list.responses[200].parse(await res.json());
    },
  });
}

export function usePosition(id: string) {
  return useQuery({
    queryKey: [api.positions.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.positions.get.path, { id });
      const res = await fetch(url);
      
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch position details");
      
      return api.positions.get.responses[200].parse(await res.json());
    },
    enabled: !!id, // Only fetch if ID is present
  });
}
