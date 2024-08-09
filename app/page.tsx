"use client"

import { RoomContext } from '@/context/RoomContext'
import { useRouter } from 'next/navigation'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'

type Props = {}

export default function page({}: Props) {

    const router = useRouter()

    const [clientSocket, setClientSocket] = useState<Socket>()
    const [roomName, setRoomName] = useState('')

    const { socket } = useContext(RoomContext)

    useEffect(()=>{
        if(socket){
            console.log("Socket connect")
            setClientSocket(socket)
        }
    }, [socket])

    const createOrJoinRoom = useCallback(()=>{
        if(!clientSocket){
            console.log("The websockets are not connected yet.")
            return
        }

        if(!roomName){
            console.log("The room name is undefined")
            return
        }
        clientSocket.emit('createOrJoinRoom', { roomName }, (roomID: string) => {
            router.push(`/${roomID}`)
        })
    }, [clientSocket, roomName])


  return (
    <div className='w-full h-full min-h-screen flex flex-col gap-5 justify-center items-center'>
        <h1>Welcome, { "Username" }</h1>
        <p className="font-thin">Please enter the room name bellow</p>
        <input 
            type='text' 
            value={ roomName } 
            placeholder='Room name'
            onChange={ (e)=>{ setRoomName(e.target.value) }} 
            className='rounded-lg border focus:border border-slate-900 px-5 py-2 text-base' />
        <button 
            onClick={ createOrJoinRoom } 
            className='rounded-lg bg-slate-700 cursor-pointer hover:bg-slate-800 transition-colors text-slate-200 px-5 py-2 text-base'>
            Start Meeting
        </button>
    </div>
  )
}