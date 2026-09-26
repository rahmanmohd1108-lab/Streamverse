import { Folder } from "lucide-react";
import { SimpleCrud } from "@/components/streamverse/admin/simple-crud";

export default function AdminCategoriesPage() {
  return (
    <SimpleCrud
      resource="categories"
      title="Categories"
      description="Editorial collections (e.g. Trending, New Releases)."
      icon={Folder}
      apiBase="/api/admin/categories"
    />
  );
}
