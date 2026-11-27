/**
 * Заглушка «пусто»: иконка, заголовок, описание и действие. Используется во всех доменах и в QueryState.
 */
import { Inbox } from "lucide-react";

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-muted text-fg-muted">
        <Icon className="size-6" />
      </span>
      <h3 className="mt-4 font-bold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
