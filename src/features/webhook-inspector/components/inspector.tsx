"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useStoreHydration } from "@/hooks/use-store-hydration";
import { FullscreenLoading } from "@/components/fullscreen-loading";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Webhook } from "lucide-react";
import { type CapturedRequest, useWebhookInspectorStore } from "../store";
import { useCreateEndpoint } from "./use-create-endpoint";
import { EndpointTabs } from "./endpoint-tabs";
import { UrlDisplay } from "./url-display";
import { RequestList } from "./request-list";
import { RequestDetail } from "./request-detail";
import { Button } from "@/components/ui/button";

export default function Inspector() {
  const rehydrated = useStoreHydration(useWebhookInspectorStore);
  const endpoints = useWebhookInspectorStore((s) => s.endpoints);
  const endpointOrder = useWebhookInspectorStore((s) => s.endpointOrder);
  const activeEndpointId = useWebhookInspectorStore((s) => s.activeEndpointId);
  const appendRequest = useWebhookInspectorStore((s) => s.appendRequest);
  const { creating, create } = useCreateEndpoint();

  const activeEndpoint = activeEndpointId ? endpoints[activeEndpointId] : null;

  useEffect(() => {
    if (!activeEndpoint) return;
    const es = new EventSource(
      `/api/hook/${activeEndpoint.id}/${activeEndpoint.createdAt}/${activeEndpoint.sig}/stream`,
    );
    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as CapturedRequest;
        appendRequest(activeEndpoint.id, parsed);
      } catch {}
    };
    return () => es.close();
  }, [activeEndpoint, appendRequest]);

  if (!rehydrated) return <FullscreenLoading />;

  if (endpointOrder.length === 0) {
    return <EmptyState onCreate={create} creating={creating} />;
  }

  return (
    <div className="h-dvh flex flex-col">
      <header className="md:hidden bg-background px-4 py-2 flex items-center gap-2 border-b">
        <Link
          href="/"
          className="text-sm font-semibold hover:opacity-70 transition-opacity"
        >
          UseTiny
        </Link>
        <span className="text-sm text-muted-foreground">
          / Webhook Inspector
        </span>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <EndpointTabs />

        <main className="flex-1 flex flex-col min-w-0">
          {activeEndpoint ? (
            <>
              <UrlDisplay endpoint={activeEndpoint} />
              <div className="flex-1 flex overflow-hidden border-t">
                <RequestList endpointId={activeEndpoint.id} />
                <RequestDetail endpointId={activeEndpoint.id} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Select an endpoint to view its requests.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function EmptyState({
  onCreate,
  creating,
}: {
  onCreate: () => void;
  creating: boolean;
}) {
  return (
    <div className="h-dvh flex flex-col">
      <header className="bg-background px-4 py-2 flex items-center gap-2 border-b">
        <Link
          href="/"
          className="text-sm font-semibold hover:opacity-70 transition-opacity"
        >
          UseTiny
        </Link>
        <span className="text-sm text-muted-foreground">
          / Webhook Inspector
        </span>
      </header>
      <div className="flex-1 flex items-center justify-center px-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Webhook className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>Capture a webhook</EmptyTitle>
            <EmptyDescription>
              Get a unique URL and inspect every request that hits it. No
              sign-up — requests are kept locally in this browser.
            </EmptyDescription>
          </EmptyHeader>
          <Button onClick={onCreate} disabled={creating} className="mt-2">
            Create endpoint
          </Button>
        </Empty>
      </div>
    </div>
  );
}
