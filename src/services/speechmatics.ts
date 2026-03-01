const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function getTemporaryToken(): Promise<string> {
  const res = await fetch(`${FUNCTIONS_URL}/speechmatics-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Token request failed" }));
    throw new Error(err.error || "Token request failed");
  }
  const { jwt } = await res.json();
  return jwt;
}

export interface SpeechmaticsCallbacks {
  onPartialTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onEndOfUtterance?: (fullText: string) => void;
  onError?: (error: Error) => void;
  onReady?: () => void;
}

const SAMPLE_RATE = 16000;

export class SpeechmaticsRealtime {
  private ws: WebSocket | null = null;
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private callbacks: SpeechmaticsCallbacks;
  private finalTranscript = "";
  private seqNo = 0;
  private isRunning = false;

  constructor(callbacks: SpeechmaticsCallbacks) {
    this.callbacks = callbacks;
  }

  async start(): Promise<void> {
    try {
      const jwt = await getTemporaryToken();

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      this.ws = new WebSocket(`wss://eu.rt.speechmatics.com/v2?jwt=${jwt}`);
      this.ws.binaryType = "arraybuffer";

      this.ws.onopen = () => {
        this.ws!.send(JSON.stringify({
          message: "StartRecognition",
          audio_format: {
            type: "raw",
            encoding: "pcm_f32le",
            sample_rate: SAMPLE_RATE,
          },
          transcription_config: {
            language: "en",
            enable_partials: true,
            max_delay: 1,
            conversation_config: {
              end_of_utterance_silence_trigger: 0.7,
            },
          },
        }));
      };

      this.ws.onmessage = (event) => {
        if (typeof event.data !== "string") return;
        const msg = JSON.parse(event.data);

        switch (msg.message) {
          case "RecognitionStarted":
            this.isRunning = true;
            this.startAudioCapture();
            this.callbacks.onReady?.();
            break;

          case "AddPartialTranscript":
            if (msg.metadata?.transcript) {
              this.callbacks.onPartialTranscript?.(this.finalTranscript + msg.metadata.transcript);
            }
            break;

          case "AddTranscript":
            if (msg.metadata?.transcript) {
              this.finalTranscript += msg.metadata.transcript;
              this.callbacks.onFinalTranscript?.(this.finalTranscript);
            }
            break;

          case "EndOfUtterance":
            this.callbacks.onEndOfUtterance?.(this.finalTranscript.trim());
            break;

          case "EndOfTranscript":
            break;

          case "Error":
            console.error("Speechmatics error:", msg);
            this.callbacks.onError?.(new Error(msg.reason || "Speechmatics error"));
            break;
        }
      };

      this.ws.onerror = () => {
        this.callbacks.onError?.(new Error("WebSocket connection error"));
      };

      this.ws.onclose = () => {
        this.isRunning = false;
        this.cleanup();
      };
    } catch (e) {
      this.cleanup();
      throw e;
    }
  }

  private startAudioCapture() {
    if (!this.stream) return;

    this.audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    const source = this.audioContext.createMediaStreamSource(this.stream);

    this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.processorNode.onaudioprocess = (e) => {
      if (!this.isRunning || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const buffer = new ArrayBuffer(inputData.length * 4);
      const view = new Float32Array(buffer);
      view.set(inputData);
      this.ws.send(buffer);
      this.seqNo++;
    };

    source.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);
  }

  stop() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        message: "EndOfStream",
        last_seq_no: this.seqNo,
      }));
    }
    setTimeout(() => this.cleanup(), 500);
  }

  private cleanup() {
    this.isRunning = false;

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  getTranscript(): string {
    return this.finalTranscript.trim();
  }

  reset() {
    this.finalTranscript = "";
    this.seqNo = 0;
  }
}
