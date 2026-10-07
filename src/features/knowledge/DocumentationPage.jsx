import { FOLDER_TYPE } from "@/entities/knowledge/knowledgeApi";
import { LibraryPage } from "./LibraryPage";

export default function DocumentationPage() {
  return (
    <LibraryPage
      library="documentation"
      folderType={FOLDER_TYPE.DOCUMENTATION}
      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp"
    />
  );
}
