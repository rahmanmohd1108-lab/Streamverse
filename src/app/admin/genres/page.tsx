import { Tag } from "lucide-react";
import { SimpleCrud } from "@/components/streamverse/admin/simple-crud";

export default function AdminGenresPage() {
  return (
    <SimpleCrud
      resource="genres"
      title="Genres"
      description="Categorize content by genre (e.g. Drama, Action)."
      icon={Tag}
      apiBase="/api/admin/genres"
    />
  );
}
