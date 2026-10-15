import { create } from "zustand";

export const useRoomStore = create((set) => ({
    rooms: [],
    currentRoom: null,
    isLoading: false,
    error: null,

    setRooms: (rooms) => set({ rooms }),

    setCurrentRoom: (currentRoom) => set({ currentRoom }),

    addRoom: (room) =>
        set((state) => ({
            rooms: [room, ...state.rooms],
        })),

    updateRoomInStore: (updatedRoom) =>
        set((state) => {
            const idx = state.rooms.findIndex((r) => r.id === updatedRoom.id);
            const nextRooms = idx !== -1
                ? [...state.rooms.slice(0, idx), { ...state.rooms[idx], ...updatedRoom }, ...state.rooms.slice(idx + 1)]
                : state.rooms;

            return {
                currentRoom:
                    state.currentRoom?.id === updatedRoom.id
                        ? { ...state.currentRoom, ...updatedRoom }
                        : state.currentRoom,
                rooms: nextRooms,
            };
        }),

    removeRoom: (id) =>
        set((state) => ({
            currentRoom: state.currentRoom?.id === id ? null : state.currentRoom,
            rooms: state.rooms.filter((room) => room.id !== id),
        })),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error, isLoading: false }),
}));