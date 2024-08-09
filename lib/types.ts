


export type StreamKind = 'Audio' | 'Video' | 'Screen' | undefined

export type AudioOptions = {
    audio: boolean,
    video: boolean
}

export type VideoOptions = {
    audio: boolean
    video: {
        width: {
            min: number,
            max: number
        },
        height: {
            min: number,
            max: number
        }
    }
}

export type ScreenOptions = {
    audio: boolean,
    video?: boolean | {
        cursor: string
    }
}

export type StreamOptions = {
    kind: StreamKind,
    options: AudioOptions | VideoOptions | ScreenOptions
} | undefined

export type Encoding = {
    rid: string,
    maxBitrate: number,
    scalabilityMode: string
}

export type Params = {
    track?: any,
    encoding: Encoding[],
    codecOptions: {
        videoGoogleStartBitrate: number
    },
    error?: any
}

export type Room = {
    rName?: string,
    rid?: string,
    pName?: string,
    pid?: string
}

export type ConsumableProducer = { 
    id: string, 
    pid: string
}