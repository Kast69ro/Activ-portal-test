import Card from "@mui/material/Card";
import { useGetMeQuery } from "@/features/chat/api";
import { ChatSidebar } from "./components/ChatSidebar";
import { ChatThread } from "./components/ChatThread";
import { useChatSocket } from "@/features/chat/model/useChatSocket";

export default function ChatPage() {
  const { data: me } = useGetMeQuery();
  useChatSocket(me);

  return (
    <Card sx={{ display: "flex", height: "calc(100dvh - 64px - 64px)", minHeight: 560, overflow: "hidden" }}>
      <ChatSidebar me={me} />
      <ChatThread me={me} />
    </Card>
  );
}
