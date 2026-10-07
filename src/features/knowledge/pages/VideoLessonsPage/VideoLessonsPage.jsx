import { FOLDER_TYPE } from "@/entities/knowledge/knowledgeApi";
import { LibraryView } from "@/features/knowledge/components/LibraryView";

export default function VideoLessonsPage() {
  return (
    <LibraryView
      library="video"
      folderType={FOLDER_TYPE.VIDEO}
      accept="video/*,.ppt,.pptx,.pps,.ppsx,.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
    />
  );
}
