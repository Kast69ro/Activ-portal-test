/**
 * Анимация диалогов: к затуханию MUI (Fade) добавляется лёгкий подъём и масштаб окна.
 * Подключается для всех Dialog через тему (src/app/providers/MuiProvider.jsx);
 * длительность — transitionDuration диалога из той же темы.
 */
import { forwardRef } from "react";
import Fade from "@mui/material/Fade";

const HIDDEN = "translateY(12px) scale(0.97)";
const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** timeout от Dialog — число или { enter, exit } */
const durationOf = (timeout, mode) => (typeof timeout === "number" ? timeout : (timeout?.[mode] ?? 225));

function animatePaper(node, keyframes, options) {
  if (reducedMotion()) return;
  node.querySelector(".MuiDialog-paper")?.animate?.(keyframes, options);
}

export const DialogTransition = forwardRef(function DialogTransition({ onEnter, onExit, ...props }, ref) {
  return (
    <Fade
      ref={ref}
      {...props}
      onEnter={(node, isAppearing) => {
        onEnter?.(node, isAppearing);
        animatePaper(node, [{ transform: HIDDEN }, { transform: "none" }], {
          duration: durationOf(props.timeout, "enter"),
          easing: "cubic-bezier(0.2, 0, 0, 1)",
          fill: "backwards",
        });
      }}
      onExit={(node) => {
        onExit?.(node);
        animatePaper(node, [{ transform: "none" }, { transform: HIDDEN }], {
          duration: durationOf(props.timeout, "exit"),
          easing: "cubic-bezier(0.4, 0, 1, 1)",
          fill: "forwards",
        });
      }}
    />
  );
});
