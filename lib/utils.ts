
import { StreamOptions } from './types'
import { Device } from 'mediasoup-client'
import { RtpCapabilities } from 'mediasoup-client/lib/RtpParameters'

/**
 * Create a local stream, it could be audio only, video with audio,
 * video only or a screen share with audio or just a screen share only.
 * Note: We need an audio stream in all cases; Audio, Video or Screen share
 *       In the future we may determine whether change this.
 * @returns Stream
 */
export const createLocalStream = async(streamOptions: StreamOptions) => {
    
    const kind = streamOptions?.kind
    const options = streamOptions?.options as DisplayMediaStreamOptions | undefined
    /**
     * If the kind is screen then get the screen strean and seperately get the audio 
     * stream and join them to have both audio and video for the screen.
     */
//     if(kind === 'Screen'){
//         try {
//             // Screen sharing stream, we ahve set audio to false because we 
//             // need to get the audio stream seperately.
//             const stream = await navigator.mediaDevices.getDisplayMedia(options)

//             // Get the audio stream and append it the screean sharing stream.
//             const audioStream = await navigator.mediaDevices.getUserMedia({
//                 audio: true,
//                 video: false
//             })
//             const audioTrack = audioStream.getAudioTracks()[0]
//             stream.addTrack(audioTrack)

//             // Then finally return the combined stream that will have both video and audio
// -            return stream 
//         } catch (error) {
//             console.error("Error sharing screen: ", error)
//             throw error
//         }
//     }

    /**
     * When the kind is either Audio or Video then get the stream according to the stream options 
     * provided.
     */
    try {
        const stream = await navigator.mediaDevices.getUserMedia(options)
        return stream
    } catch (error) {
        console.error("Error prosessing the stream: ", error)
        
        throw error
    }
}

/**
 * Get the RtpCapabilities and create a device that handles the transports
 * @param rtpCapabilities 
 * @returns Webrtc Device
 */
export const createDevice = async (rtpCapabilities?: RtpCapabilities): Promise<Device | undefined> => {

    if(!rtpCapabilities){
        console.log("undefined rtpCapabilities")
        return
    }
    
    let device: Device | undefined
    try {
        device = new Device()

        await device.load({
            routerRtpCapabilities: rtpCapabilities
        })

    } catch (error) {
        console.log(error)
    }

    return device
}
