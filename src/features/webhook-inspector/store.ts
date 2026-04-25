import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Endpoint {
  id: string;
  createdAt: number;
  sig: string;
  name: string;
}

export interface CapturedRequest {
  id: string;
  receivedAt: number;
  method: string;
  path: string;
  rawPath: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  contentType: string;
  size: number;
  bodyText?: string;
  bodyBase64?: string;
  truncated: boolean;
}

export const ENDPOINT_LIMIT = 20;
export const REQUESTS_PER_ENDPOINT = 200;

interface WebhookInspectorStore {
  endpoints: Record<string, Endpoint>;
  endpointOrder: string[];
  activeEndpointId: string | null;
  requests: Record<string, CapturedRequest[]>;
  selectedRequestId: Record<string, string | null>;

  addEndpoint: (endpoint: Omit<Endpoint, "name">) => void;
  renameEndpoint: (id: string, name: string) => void;
  deleteEndpoint: (id: string) => void;
  setActiveEndpoint: (id: string) => void;
  clearRequests: (id: string) => void;
  selectRequest: (endpointId: string, requestId: string | null) => void;
  appendRequest: (endpointId: string, request: CapturedRequest) => void;
}

function nextEndpointName(existing: Record<string, Endpoint>): string {
  const used = new Set(Object.values(existing).map((e) => e.name));
  let n = 1;
  while (used.has(`Endpoint ${n}`)) n++;
  return `Endpoint ${n}`;
}

export const useWebhookInspectorStore = create<WebhookInspectorStore>()(
  persist(
    (set, get) => ({
      endpoints: {},
      endpointOrder: [],
      activeEndpointId: null,
      requests: {},
      selectedRequestId: {},

      addEndpoint: (input) => {
        const state = get();
        if (state.endpointOrder.length >= ENDPOINT_LIMIT) return;
        if (state.endpoints[input.id]) return;
        const endpoint: Endpoint = {
          ...input,
          name: nextEndpointName(state.endpoints),
        };
        set({
          endpoints: { ...state.endpoints, [endpoint.id]: endpoint },
          endpointOrder: [...state.endpointOrder, endpoint.id],
          activeEndpointId: endpoint.id,
          requests: { ...state.requests, [endpoint.id]: [] },
          selectedRequestId: {
            ...state.selectedRequestId,
            [endpoint.id]: null,
          },
        });
      },

      renameEndpoint: (id, name) => {
        const state = get();
        const ep = state.endpoints[id];
        if (!ep) return;
        const trimmed = name.trim().slice(0, 60) || ep.name;
        set({
          endpoints: { ...state.endpoints, [id]: { ...ep, name: trimmed } },
        });
      },

      deleteEndpoint: (id) => {
        const state = get();
        if (!state.endpoints[id]) return;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: _e, ...endpoints } = state.endpoints;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: _r, ...requests } = state.requests;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: _s, ...selectedRequestId } = state.selectedRequestId;
        const endpointOrder = state.endpointOrder.filter((x) => x !== id);
        const activeEndpointId =
          state.activeEndpointId === id
            ? (endpointOrder[0] ?? null)
            : state.activeEndpointId;
        set({
          endpoints,
          endpointOrder,
          activeEndpointId,
          requests,
          selectedRequestId,
        });
      },

      setActiveEndpoint: (id) => {
        const state = get();
        if (!state.endpoints[id]) return;
        set({ activeEndpointId: id });
      },

      clearRequests: (id) => {
        const state = get();
        if (!state.requests[id]) return;
        set({
          requests: { ...state.requests, [id]: [] },
          selectedRequestId: { ...state.selectedRequestId, [id]: null },
        });
      },

      selectRequest: (endpointId, requestId) => {
        const state = get();
        set({
          selectedRequestId: {
            ...state.selectedRequestId,
            [endpointId]: requestId,
          },
        });
      },

      appendRequest: (endpointId, request) => {
        const state = get();
        if (!state.endpoints[endpointId]) return;
        const existing = state.requests[endpointId] ?? [];
        const next = [request, ...existing].slice(0, REQUESTS_PER_ENDPOINT);
        const currentSelected = state.selectedRequestId[endpointId] ?? null;
        set({
          requests: { ...state.requests, [endpointId]: next },
          selectedRequestId: {
            ...state.selectedRequestId,
            [endpointId]: currentSelected ?? request.id,
          },
        });
      },
    }),
    {
      name: "webhook-inspector-storage",
      version: 1,
      skipHydration: true,
    },
  ),
);
