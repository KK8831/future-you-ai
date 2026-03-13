import { useState, useRef, useCallback } from "react";

interface VoiceInputState {
  isListening: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  isPermissionDenied: boolean;
}

export function useVoiceInput() {
  const [state, setState] = useState<VoiceInputState>({
    isListening: false,
    transcript: "",
    error: null,
    isSupported:
      typeof window !== "undefined" &&
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window),
    isPermissionDenied: false,
  });

  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    if (!state.isSupported) {
      setState((s) => ({
        ...s,
        error:
          "Speech recognition is not supported in this browser. Please use Google Chrome.",
      }));
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t + " ";
        } else {
          interim = t;
        }
      }
      setState((s) => ({
        ...s,
        transcript: (finalTranscript + interim).trim(),
      }));
    };

    recognition.onerror = (event: any) => {
      let errorMsg = `Speech error: ${event.error}`;
      let isPermissionDenied = false;

      if (event.error === "not-allowed") {
        isPermissionDenied = true;
        errorMsg =
          "Microphone access was denied. To fix: open your browser's site settings and allow microphone access, then try again.";
      } else if (event.error === "network") {
        errorMsg =
          "Network error: speech recognition requires an internet connection. Please check your connection and retry.";
      } else if (event.error === "no-speech") {
        errorMsg = "No speech detected. Please speak clearly and try again.";
      } else if (event.error === "audio-capture") {
        errorMsg =
          "No microphone found. Please connect a microphone and try again.";
      } else if (event.error === "service-not-allowed") {
        isPermissionDenied = true;
        errorMsg =
          "Microphone use is blocked. Make sure the page is served over HTTPS and that microphone permission is granted.";
      }

      setState((s) => ({ ...s, error: errorMsg, isListening: false, isPermissionDenied }));
    };

    recognition.onend = () => {
      setState((s) => ({ ...s, isListening: false }));
    };

    recognitionRef.current = recognition;
    recognition.start();
    setState((s) => ({
      ...s,
      isListening: true,
      error: null,
      isPermissionDenied: false,
      transcript: "",
    }));
    // Reset finalTranscript when a new session starts (already done above by closure reset)
  }, [state.isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setState((s) => ({ ...s, isListening: false }));
  }, []);

  const clearTranscript = useCallback(() => {
    setState((s) => ({ ...s, transcript: "", error: null }));
  }, []);

  return { ...state, startListening, stopListening, clearTranscript };
}
