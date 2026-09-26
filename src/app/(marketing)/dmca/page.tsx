import { redirect } from "next/navigation";

// The footer links to /dmca; the canonical page lives at /copyright.
// Mirror it as a redirect to avoid duplicate-content SEO issues.
export default function DmcaPage() {
  redirect("/copyright");
}
