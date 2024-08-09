"use client"

import { prepareStreamOptions } from "@/lib/helpers";
import { connectToWebsocket } from "@/lib/socket";
import { Params, StreamOptions } from "@/lib/types";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import  VideoFrame from '@/components/ParticipantFrame'
import { createDevice, createLocalStream } from "@/lib/utils";
import { RtpCapabilities } from "mediasoup-client/lib/RtpParameters";
import { Socket } from "socket.io-client";
import { Device } from "mediasoup-client";
import { Transport, TransportOptions } from "mediasoup-client/lib/types";
import { useParams } from "next/navigation";
import { RoomContext } from "@/context/RoomContext";
import { send } from "process";


export default function RoomPage() {

  const roomID = useParams()['rid']

  const [peerID, setPeerID] = useState('')
  const [streamOptions, setStreamOptions] = useState<StreamOptions>(prepareStreamOptions("Video"))
  const [localStream, setLocalStream] = useState<MediaStream>();
  const [remoteStream, setRemoteStream] = useState<MediaStream>()
  const [routerCapabilities, setRouterCapabilities] = useState<RtpCapabilities>();
  const [device, setDevice] = useState<Device>()
  const [sendTransport, setSendTransport] = useState<Transport>()
  const [recvTransport, setRecvTransport] = useState<Transport>()

  const { socket } = useContext(RoomContext)

  // On unmount,
  // Emit exit room to the server
  // Close the local stream.
  useEffect(()=>{
    if(socket){
      console.log("Socket connected: ", socket.id)
    }
    return ()=>{
      socket?.emit('exitRoom', { roomID, peerID })
    }
  }, [socket, peerID, roomID])

  // Start the local stream and display it in a video frame
  const getLocalVideo = useCallback(async()=>{
    const stream = await createLocalStream(streamOptions)
    setLocalStream(stream)
  }, [streamOptions])

  // Request for the rtpCapabilities from the server
  const getRTPCapabilities = useCallback(async()=>{
    if(!socket){
      console.log("The web-sockets are not connected yet")
      return
    }
    console.log(roomID)
    socket.emit('getRTPCapabilities', { roomID }, async(data: RtpCapabilities) =>{
    
      setRouterCapabilities(data)
      console.log("RTPCapabilities recieved.")
    })
  }, [socket, roomID])

  // Create a client Mediasoup Device and load it with the RTPCapabilities
  const createMediasoupDevice = useCallback(async()=>{
  
    const device = await createDevice(routerCapabilities)
    if(!device){
      console.log("Unable to create the mediasoup device")
      return
    }
    setDevice(device)
    console.log("MediaSoup Device created. Load state: ", device.loaded)
  }, [routerCapabilities])

  // Create send transport for the device
  const createSendTransport = useCallback(()=>{
    if(!device){
      console.log("The mediasoup device is not created yet")
      return
    }
    socket?.emit('createSendRtcTransport', { roomID }, async(data: {error?: string, params?: TransportOptions, peerID?: string})=>{
      if(data.error || !data.params){
        console.log("Coult not fetch the router tranport params. ", data.error)
        return
      }

      if(data.peerID){
        console.log({peerID: data.peerID})
        setPeerID(data.peerID)
      }

      const transport = device.createSendTransport(data.params)

      /**
       *  
       */
      transport.on('connect', async ({ dtlsParameters }, callback, errorback) => {
        console.log('Producer transport connected');
        try {
          socket.emit('connectSendTransport', {
            dtlsParameters
          });

          callback();
          console.log("Connection state on transport.connect: ", transport.connectionState);
        } catch (error) {
          console.log(error);
          errorback(error as Error);
        }
      });

      // Listen for the produce event on the transport.
      transport.on('produce', async (parameters, callback, errorback) => {
        console.log('Producer transport producing');

        try {
          socket.emit('produceMedia', {
            kind: parameters.kind,
            rtpParameters: parameters.rtpParameters,
            appData: parameters.appData,
            peerID,
            roomID
          },
            (data: any) => {
              console.log("Produce media emitted on ", transport.id);
              console.log("Producer data: ", data);
              callback({ id: data.producerID });
            });
        } catch (error) {
          console.log(error);
        }
      });

      setSendTransport(transport)
      console.log("Send Transport set. ", transport.id)
    })
  }, [device, socket, peerID, roomID])

   // Connect the client send transport to the router send transport and start producing.
  const connectSendTransport  = useCallback(async()=>{
    if(!sendTransport){
      console.log("The producer transport is undefined.")
      return
    }

    if(!localStream){
      console.log("The local stream is not ready")
      return
    }

    const params = {
      track: localStream.getVideoTracks()[0],
      encoding: [
        {
          rid: 'r0',
          maxBitrate: 100000,
          scalabilityMode: 'S1T3'
        },
        {
          rid: 'r1',
          maxBitrate: 300000,
          scalabilityMode: 'S1T3'
        },
        {
          rid: 'r2',
          maxBitrate: 900000,
          scalabilityMode: 'S1T3'
        },
      ],
      codecOptions: {
        videoGoogleStartBitrate: 1000
      }
    };
        
    try {
      
      const producer = await sendTransport.produce(params)
      console.log("Transport producing", producer.id)

      producer.on('trackended', () => {
          console.log('Track ended')
          // close video track
      })
  
      producer.on('transportclose', () => {
          console.log('Transport closed')
          // close video track
      })
        
    } catch (error) {
      console.log("Failed to produce")
        console.log(error)
    }
  }, [localStream, sendTransport])

  // Create recieve transport for the device
  const createReciveTransport = useCallback(()=>{
    if(!device){
      console.log("The mediasoup device is not created yet.")
      return
    }

    if(!socket){
      console.log("The socket is undefine")
      return
    }
    socket.emit('createWebRtcTransport', { sender: false }, (data: {error?: string, params?: TransportOptions})=>{
      // If an error is returned from the server.
      if(data.error || !data.params){
        console.log(data.error)
        return
      }
      
      // Create a send transport with the mediasoup device to produce the local stream.
      const transport = device.createRecvTransport(data.params)

      // Listen for the connection event on the recieve transport.
      transport.on('connect', async({ dtlsParameters }, callback, errorback) => {
        console.log('Consumer transport connected')
        try {
          socket.emit('connectRecvTransport', {
            dtlsParameters
          })
          
          callback()
        } catch (error) {
            console.log(error)
            errorback(error as Error)
        }
      })
      setRecvTransport(transport)
      console.log("Recieve Transport set. ", transport.id)
    })
  }, [socket, device])

  // Connect client recieve transport to the router recieve transport and start consuming
  const connectRecvTransport = useCallback(async()=>{
    console.log('connecting recieve transport')
    if(!device || !socket){
      return
    }
    socket.emit('consume', { rtpCapabilities: device.rtpCapabilities}, async({ params, error }: { params: any, error: string}) => {
      if(error){
        console.log('failed to consume')
        return
      }
      console.log({params})

      try {
        const consumer = await recvTransport?.consume({
          id: params.id,
          producerId: params.producerId,
          kind: params.kind,
          rtpParameters: params.rtpParameters
        })

          console.log('Consumer ID: ', consumer?.id)
  
        const track = consumer?.track
        console.log("Track: ", track)
        if(!track){
          console.log("The track is not present on the consumer")
          return
        }
        const remoteVideo = new MediaStream([ track ])
        setRemoteStream(remoteVideo)
        socket.emit('consumer-resume')
      } catch (error) {
        console.log(error)
      }
    })
  }, [socket, recvTransport, device])

  useEffect(()=>{
    getLocalVideo()
  }, [getLocalVideo])

  useEffect(()=>{
    getRTPCapabilities()
  }, [getRTPCapabilities])

  useEffect(()=>{
    createMediasoupDevice()
  }, [createMediasoupDevice])


  useEffect(()=>{
    createSendTransport()
  }, [createSendTransport])

  useEffect(()=>{
    createReciveTransport()
  }, [createReciveTransport])

  return (
    <main className="min-h-screen">
      <div className="flex gap-5 px-20 py-10 w-full max-w-[60rem] mx-auto">
        <div className="flex flex-col gap-5 w-full">
          <div className="w-fit h-fit border-2 rounded-[1rem] overflow-hidden max-w-96 mx-auto border-blue-600">
            <VideoFrame kind="Video" stream={ localStream } />
          </div>
          <div className="w-full flex flex-col gap-3">
            <button onClick={ connectSendTransport} className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-[1rem] max-w-80 text-slate-100 mx-auto border-none w-full">Produce</button>
          </div>
        </div>
        <div className="flex flex-col gap-5 w-full">
          <div className="w-fit h-fit border-2 rounded-[1rem] overflow-hidden max-w-96 mx-auto border-blue-600">
            <VideoFrame kind="Video" stream={ remoteStream } />
          </div>
          <div className="flex flex-col gap-3 w-full">
            <button onClick={ connectRecvTransport } className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-[1rem] max-w-80 text-slate-100 mx-auto border-none w-full">Consume</button>
          </div>
        </div>
      </div>
    </main>
  );
}
