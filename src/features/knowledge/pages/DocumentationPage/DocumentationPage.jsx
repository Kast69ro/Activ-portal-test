/**
 * Документация — LibraryView для папок типа DOCUMENTATION.
 * Маршрут: /documentation. Доступ: все вошедшие (управление — Admin).
 */
import { FOLDER_TYPE } from "@/entities/knowledge/knowledgeApi";
import { LibraryView } from "@/features/knowledge/components/LibraryView";

export default function DocumentationPage() {
  return (
    <LibraryView
      library="documentation"
      folderType={FOLDER_TYPE.DOCUMENTATION}
      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp"
    />
  );
}
