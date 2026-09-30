import { useTransition } from "react";
import { toast } from "sonner";
import { createWebhookEndpoint } from "../actions";
import { useWebhookInspectorStore } from "../store";

export function useCreateEndpoint() {
  const addEndpoint = useWebhookInspectorStore((s) => s.addEndpoint);
  const [creating, startTransition] = useTransition();

  const create = () =>
    startTransition(async () => {
      try {
        const result = await createWebhookEndpoint();
        if (result.ok) addEndpoint(result.endpoint);
        else toast.error(result.error);
      } catch {
        toast.error("Failed to create endpoint");
      }
    });

  return { creating, create };
}
