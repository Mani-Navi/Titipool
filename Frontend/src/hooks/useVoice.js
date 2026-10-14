import { useState, useEffect, useRef, useCallback } from "react";
import { Room, RoomEvent, ConnectionState, Track } from "livekit-client";
import { getVoiceToken } from "../api/voice.api";
import { ENV } from "../config/validateEnv";

export function useVoice(roomId, isMutedByGM = false) {
    const [participants, setParticipants] = useState([]);
    const [isMicEnabled, setIsMicEnabled] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);
    const [speakingMap, setSpeakingMap] = useState({});

    const livekitRoom = useRef(null);
    const isMicEnabledRef = useRef(false);
    const isConnectingRef = useRef(false);
    const isMountedRef = useRef(true);
    const attachedElementsRef = useRef(new Set());

    const cleanupAudioElements = useCallback(() => {
        attachedElementsRef.current.forEach((el) => {
            try {
                if (el && el.parentElement) {
                    el.parentElement.removeChild(el);
                }
            } catch (ignored) {}
        });
        attachedElementsRef.current.clear();
    }, []);

    const refreshParticipants = useCallback((room) => {
        if (!room || !isMountedRef.current) return;
        const all = [
            room.localParticipant,
            ...Array.from(room.remoteParticipants.values()),
        ].filter(Boolean);

        setParticipants(
            all.map((p) => {
                const audioPub = Array.from(p.audioTrackPublications?.values?.() || [])[0];
                const isParticipantMicOn = audioPub ? !audioPub.isMuted : false;

                return {
                    identity: p.identity,
                    name: p.name || p.identity,
                    isLocal: p === room.localParticipant,
                    isMuted: p === room.localParticipant ? !isMicEnabledRef.current : !isParticipantMicOn,
                };
            })
        );
    }, []);

    const disconnect = useCallback(() => {
        if (livekitRoom.current) {
            try {
                livekitRoom.current.disconnect(true);
            } catch (e) {
                if (import.meta.env.DEV) {
                    console.warn("[Voice] Disconnect warning:", e);
                }
            }
            livekitRoom.current = null;
        }
        cleanupAudioElements();
        isConnectingRef.current = false;
        isMicEnabledRef.current = false;

        if (isMountedRef.current) {
            setIsConnecting(false);
            setIsConnected(false);
            setIsMicEnabled(false);
            setParticipants([]);
        }
    }, [cleanupAudioElements]);

    const connect = useCallback(async () => {
        if (!roomId) return;
        if (
            isConnectingRef.current ||
            livekitRoom.current?.state === ConnectionState.Connected ||
            livekitRoom.current?.state === ConnectionState.Connecting
        ) {
            return;
        }

        try {
            isConnectingRef.current = true;
            if (isMountedRef.current) {
                setIsConnecting(true);
                setError(null);
            }

            const { token, url } = await getVoiceToken(roomId);
            if (!isMountedRef.current) return;

            let targetLiveKitUrl = (url && !url.includes("localhost")) ? url : ENV.LIVEKIT_URL;

            // در صورتی که برنامه روی HTTPS باشد، اتصال لایوکیت باید از پروتکل امن wss استفاده کند
            if (typeof window !== "undefined" && window.location.protocol === "https:") {
                targetLiveKitUrl = targetLiveKitUrl.replace(/^ws:\/\//i, "wss://").replace(/^http:\/\//i, "wss://");
            }

            const room = new Room({
                adaptiveStream: true,
                dynacast: true,
                stopLocalTrackOnUnpublish: true,
                disconnectOnPageLeave: true,
                audioCaptureDefaults: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            room.on(RoomEvent.TrackSubscribed, (track) => {
                if (track.kind === Track.Kind.Audio) {
                    const el = track.attach();
                    if (el) {
                        attachedElementsRef.current.add(el);
                        if (!el.parentElement) {
                            document.body.appendChild(el);
                        }
                    }
                }
                refreshParticipants(room);
            });

            room.on(RoomEvent.TrackUnsubscribed, (track) => {
                track.detach().forEach((element) => {
                    attachedElementsRef.current.delete(element);
                    element.remove();
                });
                refreshParticipants(room);
            });

            room.on(RoomEvent.ParticipantConnected, () => refreshParticipants(room));
            room.on(RoomEvent.ParticipantDisconnected, () => refreshParticipants(room));

            room.on(RoomEvent.Reconnecting, () => {
                if (isMountedRef.current) setIsConnecting(true);
            });

            room.on(RoomEvent.Reconnected, () => {
                if (isMountedRef.current) {
                    setIsConnecting(false);
                    setIsConnected(true);
                }
                refreshParticipants(room);
            });

            room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
                if (!isMountedRef.current) return;
                const nextMap = {};
                for (let i = 0; i < speakers.length; i++) {
                    nextMap[speakers[i].identity] = true;
                }

                setSpeakingMap((prev) => {
                    const prevKeys = Object.keys(prev);
                    const nextKeys = Object.keys(nextMap);
                    if (prevKeys.length === nextKeys.length) {
                        let identical = true;
                        for (let i = 0; i < nextKeys.length; i++) {
                            if (!prev[nextKeys[i]]) {
                                identical = false;
                                break;
                            }
                        }
                        if (identical) return prev;
                    }
                    return nextMap;
                });
            });

            room.on(RoomEvent.Disconnected, () => {
                cleanupAudioElements();
                if (isMountedRef.current) {
                    setIsConnected(false);
                    setIsConnecting(false);
                    setIsMicEnabled(false);
                    setParticipants([]);
                }
                isConnectingRef.current = false;
                isMicEnabledRef.current = false;
            });

            await room.connect(targetLiveKitUrl, token);
            if (!isMountedRef.current) {
                room.disconnect();
                cleanupAudioElements();
                return;
            }

            await room.localParticipant.setMicrophoneEnabled(false);
            isMicEnabledRef.current = false;

            livekitRoom.current = room;
            if (isMountedRef.current) {
                setIsConnected(true);
                setIsMicEnabled(false);
                refreshParticipants(room);
            }
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error("[Voice] Connection failed:", err);
            }
            if (
                isMountedRef.current &&
                (!livekitRoom.current || livekitRoom.current.state === ConnectionState.Disconnected)
            ) {
                setError("عدم برقراری ارتباط با سرور صدا");
            }
        } finally {
            isConnectingRef.current = false;
            if (isMountedRef.current) {
                setIsConnecting(false);
            }
        }
    }, [roomId, refreshParticipants, cleanupAudioElements]);

    useEffect(() => {
        isMountedRef.current = true;
        connect();
        return () => {
            isMountedRef.current = false;
            disconnect();
        };
    }, [connect, disconnect]);

    useEffect(() => {
        if (isMutedByGM && livekitRoom.current && isMicEnabledRef.current) {
            isMicEnabledRef.current = false;
            setIsMicEnabled(false);
            livekitRoom.current.localParticipant.setMicrophoneEnabled(false);
            refreshParticipants(livekitRoom.current);
        }
    }, [isMutedByGM, refreshParticipants]);

    const toggleMicrophone = useCallback(async () => {
        if (isMutedByGM) return;
        const room = livekitRoom.current;
        if (!room || room.state !== ConnectionState.Connected) return;

        try {
            const nextState = !isMicEnabledRef.current;
            isMicEnabledRef.current = nextState;
            setIsMicEnabled(nextState);
            await room.localParticipant.setMicrophoneEnabled(nextState);
            refreshParticipants(room);
        } catch (err) {
            if (import.meta.env.DEV) {
                console.error("[Voice] Toggle microphone error:", err);
            }
        }
    }, [isMutedByGM, refreshParticipants]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const el = document.activeElement;
            if (
                el &&
                (el.tagName === "INPUT" ||
                    el.tagName === "TEXTAREA" ||
                    el.tagName === "SELECT" ||
                    el.isContentEditable)
            ) {
                return;
            }

            if (e.code === "Space" && !e.repeat && isConnected && !isMutedByGM) {
                e.preventDefault();
                toggleMicrophone();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isConnected, isMutedByGM, toggleMicrophone]);

    return {
        participants,
        isMicEnabled,
        isConnected,
        isConnecting,
        error,
        speakingMap,
        toggleMicrophone,
        disconnect,
        reconnect: connect,
    };
}