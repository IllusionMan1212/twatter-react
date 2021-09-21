/* eslint-disable react/react-in-jsx-scope */
import { createContext, ReactElement, useContext, useState } from "react";
import Toast from "components/toast";

const ToastContext = createContext((_text: string, _length: number) => void {});

export function ToastWrapper({ children }: any): ReactElement {
    const [toasts, setToasts] = useState([]);

    const setToastAttributes = (text: string, length: number) => {
        const id = (
            Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
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
