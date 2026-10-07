import { Suspense, lazy } from "react";
import { useSelector } from "react-redux";
import CircularProgress from "@mui/material/CircularProgress";
import { selectTheme } from "@/shared/model/settings";

// Пикер эмодзи весит ~300 КБ — грузим только когда его открыли
const Picker = lazy(() => import("emoji-picker-react"));

export function EmojiPicker({ onPick, width = 300, height = 380 }) {
  const theme = useSelector(selectTheme);
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center" style={{ width, height }}>
          <CircularProgress size={22} />
        </div>
      }
    >
      <Picker
        width={width}
        height={height}
        theme={theme}
        autoFocusSearch={false}
        lazyLoadEmojis
        onEmojiClick={(data) => onPick(data.emoji)}
      />
    </Suspense>
  );
}
