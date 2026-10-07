import { createContext, useContext } from "react";

export const ToastContext = createContext(null);
export const ConfirmContext = createContext(null);

/** toast.success / error / warning / info */
export const useToast = () => useContext(ToastContext);

/** await confirm({ title, description?, danger?, confirmText? }) → true / false */
export const useConfirm = () => useContext(ConfirmContext);
