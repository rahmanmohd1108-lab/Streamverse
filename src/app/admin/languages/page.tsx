import { Languages } from "lucide-react";
import { SimpleCrud } from "@/components/streamverse/admin/simple-crud";

export default function AdminLanguagesPage() {
  return (
    <SimpleCrud
      resource="languages"
      title="Languages"
      description="Audio / subtitle languages (e.g. English, Hindi)."
      icon={Languages}
      apiBase="/api/admin/languages"
    />
  );
}
