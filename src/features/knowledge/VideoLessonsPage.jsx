import { FOLDER_TYPE } from "@/entities/knowledge/knowledgeApi";
import { LibraryPage } from "./LibraryPage";

export default function VideoLessonsPage() {
  return (
    <LibraryPage
      library="video"
      folderType={FOLDER_TYPE.VIDEO}
      accept="video/*,.ppt,.pptx,.pps,.ppsx,.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
    />
  );
}
