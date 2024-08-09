import { io } from "socket.io-client"

/**
 * Try to connect to the websocket server for signaling
 * and return a socket or an error if failed
 * @returns Socket or Error
 */
export const connectToWebsocket = () => {
    try {
        // Later change this to the the server ip or an online valid url
        const socket = io('http://localhost:8000/sfu')

        return {socket}
    } catch (error) {
        return {
            error: "Failed to connect to websocket server"
        }
    }
}