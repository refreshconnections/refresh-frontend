// hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { App } from "@capacitor/app";
import { getWebsocketUrl } from "../hooks/utilities";

type MessageHandler = (msg: any) => void;

export function useWebSocket(onError?: (msg: string) => void) {
    const socketRef = useRef<WebSocket | null>(null);
    const listenersRef = useRef<Set<MessageHandler>>(new Set());
    const [connected, setConnected] = useState(false);
    const reconnectAttempts = useRef(0);
    const reconnectingRef = useRef(false);


    const MAX_RECONNECT_DELAY = 30000;

    const initialErrorDelayPassed = useRef(false);
    const hasShownOfflineToast = useRef(false);

    // Start a timer to allow errors after ~2 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            initialErrorDelayPassed.current = true;
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const handleOnline = () => {
            console.log("[WebSocket] Browser back online — attempting to reconnect");
            hasShownOfflineToast.current = false;
            if (!connected && localStorage.getItem("token")) {
                reconnectWithBackoff();
            }
        };

        const handleOffline = () => {
            console.warn("[WebSocket] Browser is offline");
            setConnected(false); // ✅ Reflect offline status in state
            if (!hasShownOfflineToast.current) {
                onError?.("You're offline. Messages can't send until you're reconnected.");
                hasShownOfflineToast.current = true;
            }
            socketRef.current?.close(); // Optional: force close dead connection
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // If app starts while offline
        if (!navigator.onLine) {
            handleOffline();
        }

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [connected]);

    const connect = useCallback(() => {

        if (!localStorage.getItem("token")) {
            console.warn("[WebSocket] Skipping connect — user not authenticated");
            return;
        }

        const state = socketRef.current?.readyState;
        if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
            return;
        }

        try {
            const ws = new WebSocket(getWebsocketUrl());
            socketRef.current = ws;

            ws.onopen = () => {
                reconnectAttempts.current = 0;
                setConnected(true);
                console.log("[WebSocket] Connected");
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                listenersRef.current.forEach((callback) => callback(data));
            };

            ws.onclose = (event) => {
                setConnected(false);
                console.warn("[WebSocket] Disconnected", event);
                reconnectWithBackoff();
            };

            ws.onerror = (event) => {
                console.error("[WebSocket] Error occurred", event);
                if (initialErrorDelayPassed.current) {
                    onError?.("We’re having trouble connecting. Retrying...");
                }
                ws.close(); // this triggers onclose
            };
        } catch (err) {
            console.error("[WebSocket] Failed to create connection", err);
            if (initialErrorDelayPassed.current) {
                onError?.("Unable to connect. Please check your connection.");
            }
        }
    }, []);


    const reconnectWithBackoff = () => {
        if (!localStorage.getItem("token") || !navigator.onLine || reconnectingRef.current) return;

        reconnectingRef.current = true;

        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, MAX_RECONNECT_DELAY);

        setTimeout(() => {
            reconnectAttempts.current += 1;
            reconnectingRef.current = false;
            connect();
        }, delay + Math.random() * 3000);
    };

    const send = (data: object | string) => {
        const msg = typeof data === "string" ? data : JSON.stringify(data);

        try {
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(msg);
            } else {
                console.warn("[WebSocket] Cannot send, socket not ready");
                if (initialErrorDelayPassed.current) {
                    onError?.("Your message couldn't be sent. Will try to reconnect...");
                }
            }
        } catch (err) {
            console.error("[WebSocket] Send failed:", err);
            if (initialErrorDelayPassed.current) {
                onError?.("Your message couldn’t be sent. Please check your connection.");
            }
            reconnectWithBackoff?.(); // Optional: trigger reconnection immediately
        }
    };

    const addListener = useCallback((cb: MessageHandler) => {
        listenersRef.current.add(cb);
        return () => {
            listenersRef.current.delete(cb); // ✅ this executes the delete but returns nothing (void)
        };
    }, []);



    useEffect(() => {
        console.log("connect use effect")

        const token = localStorage.getItem("token");
        if (token) {
            connect();
        }

        const resume = () => {
            console.log("[WebSocket] App resumed");

            // Reset error delay just like on mount
            initialErrorDelayPassed.current = false;
            setTimeout(() => {
                initialErrorDelayPassed.current = true;
            }, 3000);

            connect();
        };

        const pause = () => {
            console.log("[WebSocket] App paused");
            socketRef.current?.close();
        };

        App.addListener("resume", resume);
        App.addListener("pause", pause);

        return () => {
            socketRef.current?.close();
            App.removeAllListeners();
        };
    }, [connect]);

    useEffect(() => {
        const checkTokenAndReconnect = () => {
            const token = localStorage.getItem("token");
            if (token && socketRef.current?.readyState !== WebSocket.OPEN) {
                console.log("[WebSocket] Token detected — attempting to connect");
                connect();
            }
        };

        window.addEventListener("storage", checkTokenAndReconnect);
        return () => window.removeEventListener("storage", checkTokenAndReconnect);
    }, [connect]);

    const disconnect = () => {
        socketRef.current?.close();
        socketRef.current = null;
        if (connected) setConnected(false);
    };

    return {
        send,
        addListener,
        isConnected: connected,
        connect,
        disconnect,
    };
}
