"use client"

import { connectToWebsocket } from "@/lib/socket";
import { createContext, ReactNode, useEffect, useState } from "react";
import { Socket } from "socket.io-client";

type RoomState = {
    socket?: Socket
}

const defaultValue: RoomState = {}

export const RoomContext = createContext(defaultValue)

const RoomContextProvider = ({ children }: { children: ReactNode }) => {
    const [socket, setSocket] = useState<Socket>()

    useEffect(() => {
        const connection = connectToWebsocket()
        
        if(connection.error){
            console.log(connection.error)
        }
        setSocket(connection.socket)
        return () => {
            socket?.disconnect()
        }
    }, [])
    
    return (
        <RoomContext.Provider value={ { socket } }>
            { children }
        </RoomContext.Provider>
    )
}

export default RoomContextProvider