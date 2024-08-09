import { StreamKind } from "@/lib/types"
import { useEffect, useRef, useState } from "react"

type Props = {
  kind: StreamKind,
  stream?: MediaStream
}

export default function PaticipantFrame({kind, stream}: Props){
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(()=>{
      if(videoRef.current && stream){
        videoRef.current.srcObject = stream
      }

    }, [stream])
  
  if(!stream){
    return (
      <div className='w-full mx-auto h-full rounded-md flex justify-center items-center p-5'>
        No stream available
      </div>
    )
  }


  if(kind === 'Audio'){
    if(audioRef.current){
      audioRef.current.srcObject = stream
    }
    return (
      <div className='w-full relative mx-auto h-full rounded-md'>
        <audio muted id="audio" ref={audioRef} autoPlay/>
      </div>
    )
  }

  if(kind === 'Video' || kind === 'Screen'){
    return (
      <video muted ref={videoRef} autoPlay className='w-full h-full rounded-md'></video>
    )
  }

  return null

}