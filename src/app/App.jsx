/**
 * Корневой компонент: Redux store, тема MUI, тосты/подтверждения и роутер.
 */
import { Provider } from "react-redux";
import { RouterProvider } from "react-router";
import { FeedbackProvider } from "@/shared/ui";
import { MuiProvider } from "./providers/MuiProvider";
import { router } from "./router";
import { store } from "./store";

export default function App() {
  return (
    <Provider store={store}>
      <MuiProvider>
        <FeedbackProvider>
          <RouterProvider router={router} />
        </FeedbackProvider>
      </MuiProvider>
    </Provider>
  );
}
