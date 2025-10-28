import { useState, useEffect, useCallback } from 'react';

export const useSpeechSynthesizer = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };

    // Voices may load asynchronously.
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Cleanup listener on component unmount.
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find a preferred Australian voice. Fallback through different voice names.
    const preferredVoices = [
        "Google Australian English", // Often available on Chrome
        "Karen", // Common Australian voice name
        "Lee" // Another common one
    ];
    let aussieVoice = voices.find(voice => preferredVoices.includes(voice.name) && voice.lang === 'en-AU');
    
    // If no preferred voice is found, find any Australian voice.
    if (!aussieVoice) {
        aussieVoice = voices.find(voice => voice.lang === 'en-AU');
    }
    
    if (aussieVoice) {
      utterance.voice = aussieVoice;
    } else {
        console.warn("Australian voice not found, using browser default.");
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('SpeechSynthesisUtterance.onerror', event);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [voices, isSpeaking]);

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);
  
  // Ensure speech is cancelled on page unload to prevent memory leaks.
  useEffect(() => {
    const handleBeforeUnload = () => {
        cancel();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [cancel]);

  return { isSpeaking, speak, cancel };
};
