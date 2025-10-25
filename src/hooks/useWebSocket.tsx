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

    // ---------- Sensitivity controls (tuned to reduce false alarms) ----------
    const ERROR_GRACE_MS = 3000;                  // silence after mount/resume/visible/focus
    const TOAST_COOLDOWN_MS = 12000;              // general cooldown for toasts
    const RETRY_TOAST_DELAY_MS = 1500;            // delay before showing the retry toast
    const SUPPRESS_AFTER_CONNECT_MS = 5000;       // suppress retry toast shortly after a successful open
    const FAILS_BEFORE_TOAST = 2;                 // require 2 consecutive abnormal closes
    const REMINDER_TOAST_EVERY_MS = 30000;        // show the retry toast again while still disconnected
    const MIN_DISCONNECTED_MS_BEFORE_TOAST = 8000;// NEW: only toast if we've been down this long
    const ABNORMAL_RESET_WINDOW_MS = 20000;       // NEW: decay streak if there's a long quiet gap

    // ---------- Grace window ----------
    const initialErrorDelayPassed = useRef(false);
    const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resetErrorGrace = useCallback(() => {
        initialErrorDelayPassed.current = false;
        if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
        graceTimerRef.current = setTimeout(() => {
            initialErrorDelayPassed.current = true;
        }, ERROR_GRACE_MS);
    }, []);

    // Keep latest onError without re-binding functions
    const onErrorRef = useRef<typeof onError>();
    useEffect(() => {
        onErrorRef.current = onError;
    }, [onError]);

    // ---------- Centralized notifier (grace + cooldown + visibility) ----------
    const lastToastAtRef = useRef(0);
    const notifyError = (msg: string) => {
        if (!initialErrorDelayPassed.current) return;
        if (document.visibilityState !== "visible") return; // NEW: never toast while hidden
        const now = Date.now();
        if (now - lastToastAtRef.current < TOAST_COOLDOWN_MS) return;
        lastToastAtRef.current = now;
        onErrorRef.current?.(msg);
    };

    // ---------- Flags ----------
    const hasShownOfflineToast = useRef(false);
    const isOfflineRef = useRef(!navigator.onLine);
    const manualCloseRef = useRef(false);
    const isConnectedRef = useRef(false);

    // ---------- Retry/disconnect tracking ----------
    const lastOpenAtRef = useRef(0);
    const lastCloseAtRef = useRef(0); // NEW: for streak decay
    const disconnectedAtRef = useRef<number | null>(null); // NEW: gate toasts until truly down
    const abnormalCloseCountRef = useRef(0);
    const retryToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ---------- Periodic reminder while disconnected ----------
    const reminderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startReminderTimer = () => {
        if (reminderTimerRef.current) return;
        const tick = () => {
            if (
                isConnectedRef.current ||
                manualCloseRef.current ||
                isOfflineRef.current ||
                document.visibilityState !== "visible"
            ) {
                stopReminderTimer();
                return;
            }
            // Only remind if we've been down long enough
            if (
                disconnectedAtRef.current &&
                Date.now() - disconnectedAtRef.current >= MIN_DISCONNECTED_MS_BEFORE_TOAST
            ) {
                notifyError("We’re having trouble connecting. Retrying...");
            }
            reminderTimerRef.current = setTimeout(tick, REMINDER_TOAST_EVERY_MS);
        };
        reminderTimerRef.current = setTimeout(tick, REMINDER_TOAST_EVERY_MS);
    };
    const stopReminderTimer = () => {
        if (reminderTimerRef.current) {
            clearTimeout(reminderTimerRef.current);
            reminderTimerRef.current = null;
        }
    };

    const logEnv = async () => {
        // Capacitor platform
        let platform = "web";
        try {
            // If @capacitor/device is installed you can get richer info, but this is enough
            // const info = await Device.getInfo();
            // platform = info.platform;
            // Keeping it simple without extra imports:
            platform = (window as any)?.Capacitor?.getPlatform?.() ?? platform;
        } catch { }
        console.info("[WS][env]", {
            platform,
            origin: window.location?.origin,
            visibility: document.visibilityState,
            online: navigator.onLine,
        });
    };

    // ---------- Online/Offline listeners (mount once) ----------
    useEffect(() => {
        const handleOnline = () => {
            isOfflineRef.current = false;
            hasShownOfflineToast.current = false;

            const state = socketRef.current?.readyState;
            const notConnected = state !== WebSocket.OPEN && state !== WebSocket.CONNECTING;

            if (notConnected && localStorage.getItem("token")) {
                reconnectWithBackoff();
            }
        };

        const handleOffline = () => {
            isOfflineRef.current = true;
            setConnected(false);
            isConnectedRef.current = false;
            stopReminderTimer();
            if (!hasShownOfflineToast.current) {
                notifyError("You’re offline. Messages can’t send until you’re reconnected.");
                hasShownOfflineToast.current = true;
            }
            manualCloseRef.current = true; // Intentionally close while offline to prevent thrash
            socketRef.current?.close();
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        if (!navigator.onLine) handleOffline();

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // mount once

    // ---------- Visibility/focus gates (mount once) ----------
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === "visible") {
                resetErrorGrace(); // 3s suppression after tab becomes visible
            }
        };
        const onFocus = () => resetErrorGrace(); // 3s after window focus
        const onPageShow = (_e: PageTransitionEvent) => {
            resetErrorGrace(); // pageshow fires on bfcache restore (iOS Safari)
        };

        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("focus", onFocus);
        window.addEventListener("pageshow", onPageShow as any);

        return () => {
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("pageshow", onPageShow as any);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // mount once

    // ---------- Connect (stable; only refs) ----------
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
            manualCloseRef.current = false;
            const ws = new WebSocket(getWebsocketUrl());
            console.log("[[ws url: ws]]", getWebsocketUrl())
            console.log("[[ws]]", ws)
            
            socketRef.current = ws;

            ws.onopen = () => {
                reconnectAttempts.current = 0;
                setConnected(true);
                isConnectedRef.current = true;
                lastToastAtRef.current = 0; // reset global toast cooldown on good connect
                lastOpenAtRef.current = Date.now();
                disconnectedAtRef.current = null; // NEW: clear gate
                abnormalCloseCountRef.current = 0;
                if (retryToastTimerRef.current) {
                    clearTimeout(retryToastTimerRef.current);
                    retryToastTimerRef.current = null;
                }
                stopReminderTimer();
                console.log("[WebSocket] Connected");
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                listenersRef.current.forEach((cb) => cb(data));
            };

            ws.onclose = (event) => {
                setConnected(false);
                isConnectedRef.current = false;
                lastCloseAtRef.current = Date.now();
                if (!disconnectedAtRef.current) disconnectedAtRef.current = lastCloseAtRef.current; // NEW
                console.warn("[WebSocket] Disconnected", { code: event.code, reason: event.reason });

                // suppress when intentional or offline
                if (manualCloseRef.current || isOfflineRef.current) return;

                // auth-ish close—stop retrying until user reauths
                if (event.code === 4001 || event.code === 4401 || /auth|unauthor/i.test(event.reason || "")) {
                    notifyError("Session problem. Please sign in again.");
                    stopReminderTimer();
                    return;
                }

                // Decay the abnormal streak if it has been quiet for a while
                if (lastCloseAtRef.current - lastOpenAtRef.current > ABNORMAL_RESET_WINDOW_MS) {
                    abnormalCloseCountRef.current = 0;
                }

                // Only consider abnormal closes for the retry toast
                const isAbnormal = !(event.code === 1000 || event.code === 1001);
                if (isAbnormal) abnormalCloseCountRef.current += 1;
                else abnormalCloseCountRef.current = 0;

                // Suppress noisy closes that happen shortly after a good connect
                const justConnected = Date.now() - lastOpenAtRef.current < SUPPRESS_AFTER_CONNECT_MS;

                // NEW: require we’ve actually been disconnected for a minimum window
                const disconnectedLongEnough =
                    disconnectedAtRef.current !== null &&
                    Date.now() - disconnectedAtRef.current >= MIN_DISCONNECTED_MS_BEFORE_TOAST;

                const shouldToast =
                    isAbnormal &&
                    !justConnected &&
                    abnormalCloseCountRef.current >= FAILS_BEFORE_TOAST &&
                    disconnectedLongEnough;

                // Delay the specific retry toast; cancel if we reconnect before it fires
                if (shouldToast) {
                    if (retryToastTimerRef.current) clearTimeout(retryToastTimerRef.current);
                    retryToastTimerRef.current = setTimeout(() => {
                        if (!isConnectedRef.current && !manualCloseRef.current && !isOfflineRef.current) {
                            notifyError("We’re having trouble connecting. Retrying...");
                            startReminderTimer(); // keep reminding every 30s until we reconnect
                        }
                        retryToastTimerRef.current = null;
                    }, RETRY_TOAST_DELAY_MS);
                }

                reconnectWithBackoff();
            };

            // onerror can be noisy; rely on onclose for UX + retry
            ws.onerror = (event) => {
                console.error("[WebSocket] Error occurred", event);
            };
        } catch (err) {
            console.error("[WebSocket] Failed to create connection", err);
            notifyError("Unable to connect. Please check your connection.");
        }
    }, []);

    // ---------- Reconnect with backoff (stable) ----------
    const reconnectWithBackoff = useCallback(() => {
        if (!localStorage.getItem("token") || !navigator.onLine || reconnectingRef.current) return;

        reconnectingRef.current = true;
        const delay = Math.min(1000 * 2 ** reconnectAttempts.current, MAX_RECONNECT_DELAY);
        setTimeout(() => {
            reconnectAttempts.current += 1;
            reconnectingRef.current = false;
            connect();
        }, delay + Math.random() * 3000);
    }, [connect]);

    // ---------- send ----------
    const send = (data: object | string) => {
        const msg = typeof data === "string" ? data : JSON.stringify(data);
        try {
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(msg);
            } else {
                console.warn("[WebSocket] Cannot send, socket not ready");
                notifyError("Your message couldn’t be sent. Will try to reconnect...");
            }
        } catch (err) {
            console.error("[WebSocket] Send failed:", err);
            notifyError("Your message couldn’t be sent. Please check your connection.");
            reconnectWithBackoff?.();
        }
    };

    const addListener = useCallback((cb: MessageHandler) => {
        listenersRef.current.add(cb);
        return () => {
            listenersRef.current.delete(cb);
        };
    }, []);

    // ---------- Mount: start grace, initial connect, app listeners (mount once) ----------
    useEffect(() => {
        resetErrorGrace();

        if (localStorage.getItem("token")) {
            connect();
        }

        const resume = () => {
            console.log("[WebSocket] App resumed");
            resetErrorGrace(); // 3s suppression after resume
            connect();
        };

        const pause = () => {
            console.log("[WebSocket] App paused");
            manualCloseRef.current = true;
            stopReminderTimer();
            socketRef.current?.close();
        };

        App.addListener("resume", resume);
        App.addListener("pause", pause);

        return () => {
            manualCloseRef.current = true;
            stopReminderTimer();
            if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
            if (retryToastTimerRef.current) clearTimeout(retryToastTimerRef.current);
            socketRef.current?.close();
            socketRef.current = null;
            App.removeAllListeners();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // mount once

    // ---------- React to token appearing (e.g., after login) ----------
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
        manualCloseRef.current = true;
        stopReminderTimer();
        socketRef.current?.close();
        socketRef.current = null;
        if (connected) setConnected(false);
        isConnectedRef.current = false;
    };

    return {
        send,
        addListener,
        isConnected: connected,
        connect,
        disconnect,
    };
}
