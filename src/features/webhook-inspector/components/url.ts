import type { Endpoint } from "../store";

export function buildEndpointPath(endpoint: Endpoint): string {
  return `/api/hook/${endpoint.id}/${endpoint.createdAt}/${endpoint.sig}`;
}

export function buildEndpointUrl(endpoint: Endpoint): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://usetiny.app";
  return `${origin}${buildEndpointPath(endpoint)}`;
}
