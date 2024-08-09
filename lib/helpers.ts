import { StreamKind, StreamOptions } from "./types"
/**
 * check the provided stream kind and process the necesory options
 * @param kind 
 * @returns StreamOptions
 */
export const prepareStreamOptions = (kind?: StreamKind): StreamOptions => {
  const audioOptions: StreamOptions = {
    kind,
    options: {
      audio: true,
      video: false
    }
  }

  switch (kind) {
    case "Audio":
      return audioOptions ;

    case "Video":
      const videoOptions: StreamOptions = {
        kind,
        options: {
          audio: true,
          video: {
            width: {
              min: 640,
              max: 1920
            },
            height: {
                min: 400,
                max: 1080
            }
          }
        }
      }
      return videoOptions ;
    
    case "Screen":
      const screenOptions: StreamOptions = {
        kind,
        options: {
          audio: false
        }
      }
      return screenOptions;
  
    default:
      return audioOptions;
  }
}

 
/**
 * Replace spaces with '+' in a string
 */
export const removeSpaces = (str?: string) => {
  if(!str) return
  return str.trim().replace(' ', '+')
}
