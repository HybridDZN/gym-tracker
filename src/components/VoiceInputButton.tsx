import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface VoiceInputButtonProps {
  onTranscript: (transcript: string) => void
  disabled?: boolean
}

export function VoiceInputButton({ onTranscript, disabled }: VoiceInputButtonProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const onTranscriptRef = useRef(onTranscript)
  
  // Keep the ref updated with the latest callback
  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      console.warn("Web Speech API not supported in this browser")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setIsRecording(true)
      toast.info("Listening... Speak your workout now")
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      setIsProcessing(true)
      setIsRecording(false)
      
      toast.success("Transcript received, parsing...")
      console.log("Transcript:", transcript)
      onTranscriptRef.current(transcript)
      
      // Reset processing state after a delay
      setTimeout(() => {
        setIsProcessing(false)
      }, 1000)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error)
      setIsRecording(false)
      setIsProcessing(false)
      
      if (event.error === "no-speech") {
        toast.error("No speech detected. Please try again.")
      } else if (event.error === "not-allowed") {
        toast.error("Microphone permission denied. Please enable microphone access.")
      } else {
        toast.error(`Speech recognition error: ${event.error}`)
      }
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only initialize once, onTranscript is stored in closure

  const handleClick = () => {
    if (disabled || isProcessing) return

    if (!recognitionRef.current) {
      toast.error("Speech recognition not available in this browser")
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
      toast.info("Recording stopped")
    } else {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error("Failed to start recognition:", error)
        toast.error("Failed to start voice recording")
      }
    }
  }

  const isSupported = typeof (window as any).SpeechRecognition !== "undefined" || 
                      typeof (window as any).webkitSpeechRecognition !== "undefined"

  if (!isSupported) {
    return (
      <Button
        type="button"
        variant="outline"
        disabled
        className="w-full"
      >
        <MicOff className="mr-2 h-4 w-4" />
        Voice input not supported
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant={isRecording ? "destructive" : "outline"}
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className="w-full"
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : isRecording ? (
        <>
          <MicOff className="mr-2 h-4 w-4" />
          Stop Recording
        </>
      ) : (
        <>
          <Mic className="mr-2 h-4 w-4" />
          Start Voice Input
        </>
      )}
    </Button>
  )
}

// Type definitions for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

