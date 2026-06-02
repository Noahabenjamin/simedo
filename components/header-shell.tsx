import { Header } from "./header";
import { getViewerSummary } from "@/lib/data/viewer";

// Server-side wrapper that fetches the signed-in viewer once per request
// and hands it to the client Header. Keeps the header reactive to auth
// state without forcing a client-side roundtrip on every page.

export async function HeaderShell() {
  const viewer = await getViewerSummary();
  return <Header viewer={viewer} />;
}
