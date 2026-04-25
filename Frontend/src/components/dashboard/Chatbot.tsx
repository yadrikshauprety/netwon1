import { useCallback, useEffect, useRef, useState, useMemo, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Mic, MicOff } from 'lucide-react';
import companionAvatar from '@/assets/sangai-avatar.png';
import { getMainApiBase } from '@/lib/apiBase';

const INTRO_STORAGE_KEY = 'sangai-chat-intro-v1';

const API_BASE = getMainApiBase();

const SANGAI_SYSTEM_PROMPT =
  '[You should answer only in clean, precise Nepali. Do not mix Hindi.] You are Sangai, a warm daily companion for Nepali women. You do not know what brought her here and you do not assume she is in crisis. You listen first. You ask one gentle question at a time. You reflect back what she says in simple words before asking anything. You never use clinical language and you never diagnose. You normalize whatever she shares as a real human experience. If she discloses domestic violence, stay with her first; then gently ask once if she would like to hear about resources — do not redirect immediately. If she discloses thoughts of self-harm, respond with warmth and give the Nepal women\'s helpline 1145 immediately, and do not move on until you have. You speak like a trusted older sister, in simple colloquial Nepali, never formal or legal tone.';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

const INTRO_LINES = [
  { size: 28 as const, weight: 500 as const, muted: false, text: 'नमस्ते 🙏' },
  { size: 20 as const, muted: false, text: 'आज के छ मनमा?' },
  { size: 18 as const, muted: true, text: 'म सङ्गै — दिदी जस्तै साथी।' },
  { size: 18 as const, muted: true, text: 'जे भए पनि, एक्लो हुनु पर्दैन।' },
];

const STARTER_PILLS = ['आज थकाई लाग्यो', 'मन अलमलिएको छ', 'बस कुरा गर्नु छ'];

const CONTENT_BG = '#faf8f4';

const bubbleEnter = { duration: 0.4, ease: 'easeOut' as const };

function getTimeBasedGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'शुभ बिहान। आज उठ्दा मन कस्तो थियो?';
  if (h < 17) return 'नमस्ते। आज दिन कस्तो गइरहेको छ?';
  if (h < 21) return 'साँझ परिसक्यो। आज कस्तो दिन गयो?';
  return 'राति ढिलो छ। के मनमा कुरा छ?';
}

function useStableTimeGreeting(): string {
  return useMemo(() => getTimeBasedGreeting(), []);
}

function TypingDotsMain() {
  return (
    <div className="flex items-center justify-center gap-1.5 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block rounded-full bg-[hsl(var(--muted-foreground)/0.45)]"
          style={{ width: 8, height: 8 }}
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.55,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/** Single speech bubble with downward tail (border + fill). */
function SpeechBubbleFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative box-border w-full max-w-full bg-white"
      style={{
        borderRadius: 22,
        border: '0.5px solid var(--color-border-tertiary)',
        padding: 'clamp(16px,3.5vw,22px) clamp(16px,4.5vw,28px)',
        minWidth: 'min(100%, 300px)',
        maxWidth: 'min(560px, calc(100vw - 24px))',
      }}
    >
      {children}
      {/* Border triangle (behind) */}
      <div
        className="pointer-events-none absolute left-1/2"
        style={{
          bottom: -15,
          transform: 'translateX(calc(-50% + 0.5px))',
          width: 0,
          height: 0,
          borderLeft: '11px solid transparent',
          borderRight: '11px solid transparent',
          borderTop: '15px solid var(--color-border-tertiary)',
        }}
        aria-hidden
      />
      {/* Fill triangle */}
      <div
        className="pointer-events-none absolute left-1/2"
        style={{
          bottom: -14,
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: '14px solid white',
        }}
        aria-hidden
      />
    </div>
  );
}

const Chatbot = () => {
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return typeof window !== 'undefined' && !localStorage.getItem(INTRO_STORAGE_KEY);
    } catch {
      return true;
    }
  });
  const [avatarEntered, setAvatarEntered] = useState(false);
  const [visibleLineCount, setVisibleLineCount] = useState(0);
  const [skipAvailable, setSkipAvailable] = useState(false);

  const greeting = useStableTimeGreeting();

  const [messages, setMessages] = useState<Message[]>(() => [
    { id: 'welcome', role: 'bot', text: greeting },
  ]);
  const [bubbleMode, setBubbleMode] = useState<'sangai' | 'typing'>('sangai');

  const [mainBubbleVisible, setMainBubbleVisible] = useState(false);
  const [avatarEntranceDone, setAvatarEntranceDone] = useState(false);

  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [showStarters, setShowStarters] = useState(false);
  const [userHasSentMessage, setUserHasSentMessage] = useState(false);

  const audioChunks = useRef<Blob[]>([]);
  const lineTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const introFadeOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const avatarSlideIntroDoneRef = useRef(false);
  const conversationScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mainBubbleVisible) return;
    const t = setTimeout(() => setShowStarters(true), 400);
    return () => clearTimeout(t);
  }, [mainBubbleVisible]);

  useEffect(() => {
    const el = conversationScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, bubbleMode, mainBubbleVisible]);

  useEffect(() => {
    if (!showIntro || !avatarEntered) return;
    const n = INTRO_LINES.length;
    setVisibleLineCount(1);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 2; i <= n; i++) {
      timers.push(setTimeout(() => setVisibleLineCount(i), 600 + (i - 1) * 1200));
    }
    lineTimersRef.current = timers;
    return () => {
      lineTimersRef.current.forEach(clearTimeout);
    };
  }, [showIntro, avatarEntered]);

  useEffect(() => {
    if (!showIntro || visibleLineCount < INTRO_LINES.length) return;
    introFadeOutTimerRef.current = setTimeout(() => setShowIntro(false), 800);
    return () => {
      if (introFadeOutTimerRef.current) clearTimeout(introFadeOutTimerRef.current);
    };
  }, [showIntro, visibleLineCount]);

  useEffect(() => {
    if (!showIntro) return;
    const t = setTimeout(() => setSkipAvailable(true), 2000);
    return () => clearTimeout(t);
  }, [showIntro]);

  const skipIntro = useCallback(() => {
    lineTimersRef.current.forEach(clearTimeout);
    if (introFadeOutTimerRef.current) clearTimeout(introFadeOutTimerRef.current);
    try {
      localStorage.setItem(INTRO_STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setShowIntro(false);
  }, []);

  const onIntroExitComplete = useCallback(() => {
    try {
      localStorage.setItem(INTRO_STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  const toggleVoice = async () => {
    if (isListening) {
      if (mediaRecorder) {
        mediaRecorder.stop();
        setIsListening(false);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunks.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          stream.getTracks().forEach((track) => track.stop());
          await processVoiceInput(audioBlob);
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsListening(true);
      } catch (err) {
        console.error('Error accessing microphone:', err);
      }
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    setIsProcessingVoice(true);
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('language_code', 'ne-IN');

    try {
      const response = await fetch(`${API_BASE}/stt/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const data = await response.json();
      if (data.transcript) {
        await handleSend(data.transcript);
      }
    } catch (error) {
      console.error('Error with Speech-To-Text STT API:', error);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : input;
    if (!textToSend.trim()) return;

    setUserHasSentMessage(true);
    setShowStarters(false);

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (typeof overrideText !== 'string') setInput('');

    setIsAwaitingResponse(true);
    setBubbleMode('typing');

    const historyForApi = [...messages, userMsg].map((m) => ({
      role: m.role === 'bot' ? ('assistant' as const) : ('user' as const),
      content: m.text,
    }));

    try {
      const response = await fetch(`${API_BASE}/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_prompt: SANGAI_SYSTEM_PROMPT,
          messages: historyForApi,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to backend Chat API');
      }

      const data = await response.json();
      const botResponseText = data.choices?.[0]?.message?.content ?? '...';

      setMessages((prev) => [
        ...prev,
        { id: `b-${Date.now()}`, role: 'bot', text: botResponseText },
      ]);

      await new Promise((r) => setTimeout(r, 200));
      setBubbleMode('sangai');
    } catch (error) {
      console.error('Error calling chat API:', error);
      const errText = 'माफ गर्नुहोस्, म अहिलै कनेक्ट गर्न समस्यामा छु।';
      setMessages((prev) => [...prev, { id: `b-${Date.now()}`, role: 'bot', text: errText }]);
      await new Promise((r) => setTimeout(r, 200));
      setBubbleMode('sangai');
    } finally {
      setIsAwaitingResponse(false);
    }
  };

  const inputDisabled =
    isListening || isProcessingVoice || isAwaitingResponse;

  const showTypingInBubble =
    bubbleMode === 'typing' && (isAwaitingResponse || isProcessingVoice);

  const introAvatarBlock = (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', duration: 0.9, bounce: 0.35 }}
      onAnimationComplete={() => setAvatarEntered(true)}
      className="flex flex-col items-center"
    >
      <div
        className="overflow-hidden"
        style={{
          height: 260,
          maxWidth: 'min(100%, 320px)',
        }}
      >
        <img
          src={companionAvatar}
          alt=""
          className="h-full w-auto max-w-full select-none"
          style={{ objectFit: 'contain', objectPosition: 'top' }}
          draggable={false}
        />
      </div>
    </motion.div>
  );

  return (
    <div
      className="relative flex h-full min-h-0 flex-1 flex-col"
      style={{ background: 'var(--color-background-primary)' }}
    >
      <AnimatePresence mode="wait" onExitComplete={onIntroExitComplete}>
        {showIntro && (
          <motion.div
            key="intro"
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center px-6"
            style={{ background: '#faf6f0' }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            {skipAvailable && (
              <button
                type="button"
                onClick={skipIntro}
                className="absolute right-4 top-4 text-[15px] font-medium text-[hsl(var(--muted-foreground))] underline-offset-4 hover:underline"
              >
                छोड्नुस्
              </button>
            )}

            {introAvatarBlock}

            <div className="mt-8 flex max-w-md flex-col items-center gap-3 text-center">
              {INTRO_LINES.map((line, i) => (
                <AnimatePresence key={line.text}>
                  {visibleLineCount > i && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.45 }}
                      style={{
                        fontSize: line.size,
                        fontWeight: 'weight' in line ? line.weight : 400,
                        color: line.muted
                          ? 'hsl(var(--muted-foreground))'
                          : 'hsl(var(--foreground))',
                      }}
                    >
                      {line.text}
                    </motion.p>
                  )}
                </AnimatePresence>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showIntro && (
        <motion.div
          key="chat-ui"
          className="flex min-h-0 flex-1 flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          {/* Content: novel scene — between navbar and input */}
          <div
            className="relative min-h-0 flex-1 overflow-hidden"
            style={{ background: CONTENT_BG }}
          >
            {/* सङ्गै label */}
            <p
              className="pointer-events-none absolute left-1/2 z-20 text-center text-[12px] sm:text-[13px]"
              style={{
                bottom: 'clamp(230px, 48vh, 440px)',
                transform: 'translateX(-50%)',
                color: 'var(--color-text-secondary)',
              }}
            >
              सङ्गै
            </p>

            {/* Main speech bubble — scrollable conversation */}
            {mainBubbleVisible && (
              <div
                className="pointer-events-auto absolute left-1/2 z-20 w-[min(560px,calc(100%-24px))] min-w-0 max-w-[calc(100vw-24px)] -translate-x-1/2 sm:w-[min(560px,calc(100%-48px))]"
                style={{
                  bottom: 'clamp(128px, 34vh, 400px)',
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={bubbleEnter}
                >
                  <SpeechBubbleFrame>
                    <div
                      ref={conversationScrollRef}
                      className="flex max-h-[min(44vh,280px)] flex-col gap-3 overflow-y-auto overscroll-contain pr-1 text-[16px] leading-[1.75] sm:max-h-[min(50vh,360px)] sm:text-[18px]"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          className={
                            msg.role === 'user'
                              ? 'flex w-full justify-end'
                              : 'w-full text-center'
                          }
                        >
                          {msg.role === 'user' ? (
                            <div
                              className="max-w-[85%] rounded-[18px] rounded-br-[4px] px-[14px] py-2 text-left text-[15px] leading-relaxed text-white"
                              style={{ background: '#7F77DD' }}
                            >
                              {msg.text}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap px-1">{msg.text}</p>
                          )}
                        </motion.div>
                      ))}
                      {showTypingInBubble && (
                        <div className="flex w-full justify-center py-1">
                          <TypingDotsMain />
                        </div>
                      )}
                    </div>
                    {showStarters && !userHasSentMessage && (
                      <div className="flex flex-wrap justify-center" style={{ gap: 8, marginTop: 12 }}>
                        {STARTER_PILLS.map((label) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => handleSend(label)}
                            disabled={inputDisabled}
                            className="rounded-[20px] border-[0.5px] border-[var(--color-border-secondary)] bg-[var(--color-background-secondary)] px-[18px] py-2.5 text-[14px] text-[hsl(var(--foreground))] transition-opacity hover:opacity-90 disabled:opacity-50"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </SpeechBubbleFrame>
                </motion.div>
              </div>
            )}

            {/* Grounded companion — slide up then gentle float */}
            <motion.div
              className="pointer-events-none absolute bottom-0 left-1/2 z-10 -translate-x-1/2"
              initial={{ y: 200 }}
              animate={
                avatarEntranceDone ? { y: [0, -6, 0] } : { y: 0 }
              }
              transition={
                avatarEntranceDone
                  ? { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
                  : { type: 'spring', duration: 0.8 }
              }
              onAnimationComplete={() => {
                if (avatarSlideIntroDoneRef.current) return;
                avatarSlideIntroDoneRef.current = true;
                setAvatarEntranceDone(true);
                setTimeout(() => setMainBubbleVisible(true), 400);
              }}
            >
              <img
                src={companionAvatar}
                alt=""
                className="block h-[clamp(200px,36vh,420px)] w-auto max-w-[min(100vw,720px)] select-none"
                style={{
                  objectFit: 'contain',
                  objectPosition: 'bottom',
                }}
                draggable={false}
              />
            </motion.div>
          </div>

          {/* Input — flush to content, no gap */}
          <div
            className="shrink-0 border-t-[0.5px] border-[var(--color-border-tertiary)] px-3 pb-[max(12px,env(safe-area-inset-bottom,0px))] pt-3 sm:px-8 sm:pb-6 sm:pt-4"
            style={{
              background: 'var(--color-background-primary)',
            }}
          >
            <div className="mx-auto flex max-w-3xl items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={toggleVoice}
                disabled={isProcessingVoice || isAwaitingResponse}
                aria-label={isListening ? 'Stop recording' : 'Start voice input'}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
                  isListening
                    ? 'bg-destructive/15 text-destructive'
                    : 'text-[hsl(var(--muted-foreground))] hover:bg-[var(--color-background-secondary)]'
                } disabled:opacity-50`}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={inputDisabled}
                placeholder={
                  isListening
                    ? 'सुन्दै छु...'
                    : 'यहाँ लेख्नुस् वा माइक थिच्नुस्...'
                }
                className="min-h-[48px] min-w-0 flex-1 rounded-[24px] bg-[var(--color-background-secondary)] px-[18px] py-3 text-[15px] text-[hsl(var(--foreground))] outline-none ring-0 placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={inputDisabled || !input.trim()}
                aria-label="Send"
                className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
                style={{ background: '#7F77DD' }}
              >
                <ArrowRight className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Chatbot;
