import { useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL);

export function useSocket(event, handler) {
    useEffect(() => {
        socket.on(event, handler);
        return () => socket.off(event, handler);
    }, [event, handler]);
}

export { socket };