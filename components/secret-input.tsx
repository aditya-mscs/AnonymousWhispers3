"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Mic, Send, MicOff, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAppDispatch } from "@/redux/hooks"
import { addSecret } from "@/redux/features/secrets/secretsSlice"
import { getUsernameFromStorage, saveUsernameToStorage } from "@/lib/storage"
import { secretsApi } from "@/lib/api-client"
import { generateSubmissionToken } from "@/lib/submission-token"
import { SuperToast } from "@/components/super-toast"

// Define SpeechRecognition and SpeechRecognitionEvent types
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognition
    webkitSpeechRecognition: SpeechRecognition
    SpeechRecognitionEvent: any
    SpeechRecognitionErrorEvent: any
  }
}

// Fix: Declare SpeechRecognition
const SpeechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition)

export default function SecretInput() {
  const [content, setContent] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()

  // CAPTCHA state
  const [submissionToken, setSubmissionToken] = useState<string>("")
  const [showCaptcha, setShowCaptcha] = useState<boolean>(false)
  const [isFirstSubmission, setIsFirstSubmission] = useState(true)
  const [sliderValue, setSliderValue] = useState<number[]>([0])
  const targetValue = useRef(Math.floor(Math.random() * 81) + 10) // Random value between 10-90

  // Check if SpeechRecognition is available
  const isSpeechRecognitionAvailable =
    typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition)

  // Create mutation for submitting secrets
  const mutation = useMutation({
    mutationFn: (data: { content: string; darkness: number; username: string; submissionToken: string }) => {
      return secretsApi.createSecret(data)
    },
    onSuccess: (data) => {
      setContent("")
      setIsSubmitting(false)

      // Reset CAPTCHA state for next submission
      setShowCaptcha(false)
      setSliderValue([0])

      // Mark that the user has submitted before (for future submissions)
      localStorage.setItem("has_submitted_secret", "true")
      setIsFirstSubmission(false)

      // Add to local state
      dispatch(addSecret(data))

      // Invalidate the secrets query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["secrets"] })

      // Select the "recent" tab by triggering a click on it
      setTimeout(() => {
        const recentTabElement = document.querySelector('[value="recent"]') as HTMLElement
        if (recentTabElement) {
          recentTabElement.click()
        }
      }, 100)

      SuperToast.show({
        message: "Your secret has been shared anonymously.",
        type: "success",
      })
    },
    onError: (error: Error) => {
      setIsSubmitting(false)
      SuperToast.show({
        message: error.message,
        type: "error",
      })
    },
  })

  // Generate a new CAPTCHA
  const generateCaptcha = () => {
    // Generate a new random target value
    targetValue.current = Math.floor(Math.random() * 81) + 10 // Random value between 10-90
    setSliderValue([0])
    // Generate a new submission token
    setSubmissionToken(generateSubmissionToken())
  }

  // Initialize the CAPTCHA
  useEffect(() => {
    generateCaptcha()
  }, [])

  // Check if this is the user's first submission
  useEffect(() => {
    // Check localStorage to see if the user has submitted before
    const hasSubmittedBefore = localStorage.getItem("has_submitted_secret")
    if (hasSubmittedBefore === "true") {
      setIsFirstSubmission(false)
    } else {
      setIsFirstSubmission(true)
    }
  }, [])

  const toggleRecording = () => {
    if (!isSpeechRecognitionAvailable) {
      SuperToast.show({
        message: "Your browser doesn't support voice recognition.",
        type: "error",
      })
      return
    }

    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
    } else {
      // Use SpeechRecognition or webkitSpeechRecognition based on availability
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.lang = "en-US"

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join("")
          setContent((prevContent) => prevContent + transcript)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error)
          SuperToast.show({
            message: "There was an error with the speech recognition.",
            type: "error",
          })
          setIsRecording(false)
        }

        recognitionRef.current.onend = () => {
          setIsRecording(false)
        }

        recognitionRef.current.start()
        setIsRecording(true)
      } else {
        SuperToast.show({
          message: "Your browser doesn't support voice recognition.",
          type: "error",
        })
      }
    }
  }

  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    setSliderValue(value)
  }

  // Update the handleSubmit function
  const handleSubmit = async () => {
    // Stop recording if active
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }

    // Validate content
    if (content.trim().length < 10) {
      SuperToast.show({
        message: "Your secret must be at least 10 characters long.",
        type: "error",
      })
      return
    }

    // Check for URLs
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi
    if (urlRegex.test(content)) {
      SuperToast.show({
        message: "URLs are not allowed in secrets for security reasons.",
        type: "error",
      })
      return
    }

    // Skip CAPTCHA for first-time users
    if (isFirstSubmission) {
      setIsSubmitting(true)

      // Get or generate username
      let username = getUsernameFromStorage()
      if (!username) {
        username = generateRandomUsername()
        saveUsernameToStorage(username)
      }

      // Mark that the user has submitted before
      localStorage.setItem("has_submitted_secret", "true")

      // Submit the secret with default darkness level of 5
      mutation.mutate({
        content,
        darkness: 5,
        username,
        submissionToken: generateSubmissionToken(),
      })

      return
    }

    // If not showing CAPTCHA yet, show it now
    if (!showCaptcha) {
      setShowCaptcha(true)
      return
    }

    // Validate CAPTCHA - check if slider value is close to target value
    const sliderValueInt = sliderValue[0]
    const targetValueInt = targetValue.current

    // Allow a small margin of error (±2)
    if (Math.abs(sliderValueInt - targetValueInt) > 2) {
      SuperToast.show({
        message: "Please try again with the correct slider value.",
        type: "error",
      })
      generateCaptcha() // Generate a new CAPTCHA
      return
    }

    setIsSubmitting(true)

    // Get or generate username
    let username = getUsernameFromStorage()
    if (!username) {
      username = generateRandomUsername()
      saveUsernameToStorage(username)
    }

    // Submit the secret with default darkness level of 5 and the submission token
    mutation.mutate({
      content,
      darkness: 5,
      username,
      submissionToken,
    })
  }

  // Get color for CAPTCHA slider
  const getCaptchaSliderColor = () => {
    return Math.abs(sliderValue[0] - targetValue.current) <= 2 ? "bg-green-500" : "bg-primary"
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

        {/* Show CAPTCHA above the buttons, but only if not first submission and showCaptcha is true */}
        {!isFirstSubmission && showCaptcha && (
          <div className="w-full border p-4 rounded-md mt-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">Verify you're human:</div>
              <Shield className="h-4 w-4 text-primary" />
            </div>

            <div className="space-y-4">
              <div className="text-sm">
                Drag the slider to <span className="font-bold">{targetValue.current}</span> to verify
              </div>

              <div className="space-y-2">
                <Slider
                  value={sliderValue}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleSliderChange}
                  className="w-full"
                  colorByValue={Math.abs(sliderValue[0] - targetValue.current) <= 2}
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>Current: {sliderValue[0]}</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>
        )}
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
          {!isFirstSubmission && showCaptcha ? "Confirm & Share" : "Share Secret"}
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

