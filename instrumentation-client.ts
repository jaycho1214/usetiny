import posthog from "posthog-js";

if (process.env.NODE_ENV === "production") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: "/relay-aqZo",
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2025-05-24",
    capture_exceptions: true,
    // Inject lazy-loaded PostHog scripts into <head>: when they fail (e.g. ad
    // blockers), posthog-js swaps the <body> script tag mid-hydration, which
    // triggers React hydration error #418. React ignores foreign <head> tags.
    external_scripts_inject_target: "head",
  });
}
