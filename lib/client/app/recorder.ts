declare interface MediaRecorderErrorEvent extends Event {
  name: string;
}

declare interface MediaRecorderDataAvailableEvent extends Event {
  data : any;
}

interface MediaRecorderEventMap {
  'dataavailable': MediaRecorderDataAvailableEvent;
  'error': MediaRecorderErrorEvent ;
  'pause': Event;
  'resume': Event;
  'start': Event;
  'stop': Event;
  'warning': MediaRecorderErrorEvent ;
}

declare class MediaRecorder extends EventTarget {
  readonly mimeType: string;
  readonly state: 'inactive' | 'recording' | 'paused';
  readonly stream: MediaStream;
  ignoreMutedMedia: boolean;
  videoBitsPerSecond: number;
  audioBitsPerSecond: number;

  ondataavailable: (event : MediaRecorderDataAvailableEvent) => void;
  onerror: (event: MediaRecorderErrorEvent) => void;
  onpause: () => void;
  onresume: () => void;
  onstart: () => void;
  onstop: () => void;

  constructor(stream: MediaStream, options?: { mimeType?: string });

  start(): void;

  stop(): void;

  resume(): void;

  pause(): void;

  static isTypeSupported(type: string): boolean;

  requestData(): void;

  addEventListener<K extends keyof MediaRecorderEventMap>(type: K, listener: (this: MediaStream, ev: MediaRecorderEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;

  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;

  removeEventListener<K extends keyof MediaRecorderEventMap>(type: K, listener: (this: MediaStream, ev: MediaRecorderEventMap[K]) => any, options?: boolean | EventListenerOptions): void;

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

const getSupportedMimeType = () => {
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
    return 'video/webm;codecs=vp9,opus';
  }

  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
    return 'video/webm;codecs=vp8,opus';
  }

  if (MediaRecorder.isTypeSupported('video/webm')) {
    return 'video/webm';
  }

  return '';
};

export const createRecorder = () => {
  let running = false;
  let inited = false;
  let stream: MediaStream;
  let mediaRecorder: MediaRecorder;
  const chunks: Blob[] = [];

  return {
    start: async () => {
      if (running) {
        return;
      }

      running = true;

      if (inited) {
        mediaRecorder.start();
        return;
      }

      inited = true;

      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      mediaRecorder = new MediaRecorder(stream, {
        mimeType: getSupportedMimeType(),
      });

      mediaRecorder.addEventListener('dataavailable', ({ data }) => {
        if (data.size > 0) {
          chunks.push(data);
        }
      });

      mediaRecorder.start();
    },

    stop: async (): Promise<Blob> => {
      if (!running || !inited) {
        return new Blob(chunks);
      }

      return new Promise<Blob>((resolve, reject) => {
        const onStop = () => {
          running = false;
          mediaRecorder.removeEventListener('stop', onStop);
          mediaRecorder.removeEventListener('error', onError);
          stream.getTracks().forEach((track) => track.stop());
          resolve(new Blob(chunks));
        };

        const onError = (error: MediaRecorderErrorEvent) => {
          running = false;
          mediaRecorder.removeEventListener('stop', onStop);
          mediaRecorder.removeEventListener('error', onError);
          reject(error);
        };

        mediaRecorder.addEventListener('stop', onStop);
        mediaRecorder.addEventListener('error', onError);
        mediaRecorder.stop();
      });
    },
  };
};
