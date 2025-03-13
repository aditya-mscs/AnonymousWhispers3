"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Mic, Send, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useMutation } from "@tanstack/react-query"
import { useAppDispatch } from "@/redux/hooks"
import { addSecret } from "@/redux/features/secrets/secretsSlice"
import { getUsernameFromStorage, saveUsernameToStorage } from "@/lib/storage"
import { secretsApi } from "@/lib/api-client"

// Define SpeechRecognition and SpeechRecognitionEvent types
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognition
    webkitSpeechRecognition: SpeechRecognition
  }
}

export default function SecretInput() {
  const [content, setContent] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const dispatch = useAppDispatch()

  // Check if SpeechRecognition is available
  const isSpeechRecognitionAvailable =
    typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition)

  // Create mutation for submitting secrets
  const mutation = useMutation({
    mutationFn: (data: { content: string; darkness: number; username: string }) => {
      return secretsApi.createSecret(data)
    },
    onSuccess: (data) => {
      setContent("")
      setIsSubmitting(false)

      // Add to local state
      dispatch(addSecret(data))

      toast({
        title: "Secret shared successfully",
        description: "Your secret has been anonymously shared.",
      })

      // Navigate to the secret page
      router.push(`/secret/${data.id}`)
    },
    onError: (error: Error) => {
      setIsSubmitting(false)
      toast({
        title: "Failed to share secret",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Initialize speech recognition
  useEffect(() => {
    if (isSpeechRecognitionAvailable) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()

      if (recognitionRef.current) {
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join("")

          setContent((prev) => prev + " " + transcript)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error)
          setIsRecording(false)
          toast({
            title: "Voice recognition error",
            description: `Error: ${event.error}`,
            variant: "destructive",
          })
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [isSpeechRecognitionAvailable, toast])

  const toggleRecording = () => {
    if (!isSpeechRecognitionAvailable) {
      toast({
        title: "Voice recognition not available",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive",
      })
      return
    }

    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
    } else {
      recognitionRef.current?.start()
      setIsRecording(true)
    }
  }

  const handleSubmit = async () => {
    // Stop recording if active
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }

    // Validate content
    if (content.trim().length < 10) {
      toast({
        title: "Secret too short",
        description: "Your secret must be at least 10 characters long.",
        variant: "destructive",
      })
      return
    }

    // Check for URLs
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi
    if (urlRegex.test(content)) {
      toast({
        title: "URLs not allowed",
        description: "For security reasons, URLs are not allowed in secrets.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Get or generate username
    let username = getUsernameFromStorage()
    if (!username) {
      username = generateRandomUsername()
      saveUsernameToStorage(username)
    }

    // Submit the secret with default darkness level of 5
    mutation.mutate({ content, darkness: 5, username })
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <Textarea
          placeholder="Share your secret... (min 10 characters)"
          className="min-h-32 resize-none text-base"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={toggleRecording}
          disabled={!isSpeechRecognitionAvailable || isSubmitting}
          className={isRecording ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-500" : ""}
        >
          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Button onClick={handleSubmit} disabled={content.trim().length < 10 || isSubmitting}>
          <Send className="h-4 w-4 mr-2" />
          Share Secret
        </Button>
      </CardFooter>
    </Card>
  )
}

// Generate a random funny username
function generateRandomUsername() {
  const adjectives = [
    "Mysterious",
    "Shadowy",
    "Cryptic",
    "Enigmatic",
    "Veiled",
    "Clandestine",
    "Covert",
    "Stealthy",
    "Anonymous",
    "Hidden",
    "Masked",
    "Concealed",
    "Obscure",
    "Secretive",
    "Furtive",
  ]

  const nouns = [
    "Whisper",
    "Shadow",
    "Ghost",
    "Phantom",
    "Specter",
    "Wraith",
    "Revenant",
    "Spirit",
    "Apparition",
    "Shade",
    "Enigma",
    "Mystery",
    "Secret",
    "Riddle",
    "Puzzle",
  ]

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]
  const randomNumber = Math.floor(Math.random() * 1000)

  return `${randomAdjective}${randomNoun}${randomNumber}`
}

