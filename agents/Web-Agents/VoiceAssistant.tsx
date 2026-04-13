/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI
TAG: CORE.SDK.VOICEASSISTANT.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = VoiceAssistant module
WHY = Part of AI region
WHO = LEEWAY Align Agent
WHERE = agents\Web-Agents\VoiceAssistant.tsx
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * A lightweight, offline‑first voice assistant designed for mobile devices
 * and embedded platforms.  It leverages the Web Speech API for speech
 * recognition and synthesis and the LocalVoiceLLM wrapper around a
 * quantised small language model to generate responses.  The UI is kept
 * minimal to better suit small screens while maintaining accessibility.
 */

import React, { useState, useEffect, useRef } from 'react';
import { LocalVoiceLLM } from './LocalVoiceLLM';
import { Mic, MicOff, Loader2, Download, User, CheckCircle2 } from 'lucide-react';

// Instruction for the assistant.  Feel free to customise this message to
// change the personality and tone of the assistant.  The default
// instruction uses an urban style similar to the original Urban Voice AI.
const SYSTEM_INSTRUCTION = `You are a calm, professional AI assistant with a natural urban flavor.\n` +
  `You speak with hip‑hop vernacular and urban slang, but you are highly informed, up‑to‑date, and professional.\n` +
  `You were born in the city ghetto and that's your natural vibe.\n` +
  `Keep your responses concise and conversational.\n` +
  `Your voice is calm and steady.\n` +
  `Pay close attention to the user's intent and emotion. If they are frustrated, be empathetic. ` +
  `If they are excited, match that energy but stay cool.\n` +
  `Don't over‑explain, just keep it real and helpful.`;

// Create a singleton model instance so that multiple mounts share the same
// underlying model and avoid reloading it on remounts.
let globalModelLoaded = false;
const llmInstance = new LocalVoiceLLM();

export default function VoiceAssistant() {
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [isModelLoaded, setIsModelLoaded] = useState(globalModelLoaded);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const isCancelledRef = useRef(false);

  // Load voices and initialise speech recognition on mount
  useEffect(() => {
    synthesisRef.current = window.speechSynthesis;
    // Load voices
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      // Choose a deep male voice if available
      const deep = voices.find((v) => v.name.toLowerCase().includes('male'));
      if (deep) setSelectedVoice(deep);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    // Initialise speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        handleUserSpeech(transcript);
      };
      recognitionRef.current.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please check your settings.');
        } else if (event.error === 'no-speech') {
          // ignore
        } else {
          setError(`Mic Error: ${event.error}`);
        }
      };
      recognitionRef.current.onend = () => setIsListening(false);
    } else {
      setError('Speech recognition not supported in this browser.');
    }
    return () => {
      recognitionRef.current?.stop();
      synthesisRef.current?.cancel();
    };
  }, []);

  const loadModel = async () => {
    if (isModelLoading || globalModelLoaded) return;
    setIsModelLoading(true);
    setError(null);
    try {
      await llmInstance.load((progress) => {
        setModelProgress(progress);
      });
      globalModelLoaded = true;
      setIsModelLoaded(true);
    } catch (err: any) {
      setError(`Failed to load AI: ${err.message || 'Check local model files'}`);
    } finally {
      setIsModelLoading(false);
    }
  };

  const handleUserSpeech = async (text: string) => {
    setIsThinking(true);
    isCancelledRef.current = false;
    try {
      let response: string;
      response = await llmInstance.generate(text, SYSTEM_INSTRUCTION);
      if (response && !isCancelledRef.current) {
        speak(response);
      }
    } catch (err: any) {
      if (!isCancelledRef.current) {
        setError(`AI Brain Freeze: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsThinking(false);
    }
  };

  const speak = (text: string) => {
    if (!synthesisRef.current) return;
    synthesisRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.pitch = 0.9;
    utterance.rate = 1.0;
    utterance.onend = () => {
      toggleListening();
    };
    synthesisRef.current.speak(utterance);
  };

  const toggleListening = () => {
    if (!globalModelLoaded) {
      loadModel();
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      synthesisRef.current?.cancel();
      recognitionRef.current?.start();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem' }}>
      {/* Microphone button */}
      <button
        onClick={toggleListening}
        disabled={isModelLoading || isThinking}
        style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          color: '#fff',
          background: isListening ? '#22c55e' : isModelLoaded ? '#6C47FF' : '#444',
          border: 'none',
          boxShadow: isListening ? '0 0 20px rgba(34,197,94,0.6)' : 'none',
          transition: 'background 0.3s, box-shadow 0.3s',
        }}
      >
        {!isModelLoaded && !isModelLoading ? (
          <Download size={48} />
        ) : isListening ? (
          <Mic size={48} />
        ) : isThinking || isModelLoading ? (
          <Loader2 size={48} />
        ) : (
          <MicOff size={48} />
        )}
      </button>
      {/* Status indicator */}
      <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#ccc' }}>
        {isModelLoading ? (
          <div>
            <div style={{ width: '150px', height: '4px', background: '#333', borderRadius: '4px', overflow: 'hidden', margin: '0 auto 0.5rem' }}>
              <div style={{ width: `${modelProgress}%`, height: '100%', background: '#6C47FF' }} />
            </div>
            Downloading Brain: {Math.round(modelProgress)}%
          </div>
        ) : isThinking ? (
          <div style={{ color: '#facc15' }}>Thinking...</div>
        ) : isListening ? (
          <div style={{ color: '#22c55e' }}>Listening...</div>
        ) : isModelLoaded ? (
          <div style={{ color: '#4ade80' }}>Offline Mode Active</div>
        ) : (
          <div>Tap to Download Brain</div>
        )}
      </div>
      {/* Error message */}
      {error && (
        <div style={{ marginTop: '0.5rem', color: '#f87171', fontSize: '0.8rem', textAlign: 'center' }}>{error}</div>
      )}
      {/* Voice selector (optional) */}
      {availableVoices.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          <label htmlFor="voiceSelect" style={{ fontSize: '0.7rem', color: '#888' }}>Voice:</label>
          <select
            id="voiceSelect"
            value={selectedVoice?.name || ''}
            onChange={(e) => {
              const voice = availableVoices.find((v) => v.name === e.target.value);
              setSelectedVoice(voice || null);
            }}
            style={{ marginLeft: '0.5rem', padding: '0.25rem', borderRadius: '4px', background: '#1a1d3a', color: '#eee', border: '1px solid #333' }}
          >
            {availableVoices.map((voice, idx) => (
              <option key={idx} value={voice.name}>{voice.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}