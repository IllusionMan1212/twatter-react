import { createContext, ReactElement, useContext, useState } from "react";
import Toast from "components/toast";
import { ContextWrapperProps } from "src/types/props";

const ToastContext = createContext(null);

export function ToastWrapper({ children }: ContextWrapperProps): ReactElement {
    const [toasts, setToasts] = useState([]);

    const setToastAttributes = (text: string, length: number) => {
        const id = (
            Date.now().toString(36) + Math.random().toString(36).substring(2, 5)
        ).toUpperCase();
        setToasts((toasts) => {
            return toasts.concat({ text: text, id: id });
        });

        setTimeout(() => {
            setToasts((toasts) => {
                return toasts.filter((toasts) => toasts.id != id);
            });
        }, length);
    };

    return (
        <>
            <div className="toasts">
                {toasts.map((toast) => {
                    return <Toast key={toast.id} text={toast.text}></Toast>;
                })}
            </div>
            <ToastContext.Provider value={setToastAttributes}>
                {children}
            </ToastContext.Provider>
        </>
    );
}

export function useToastContext(): (text: string, length: number) => void {
    return useContext(ToastContext);
}
