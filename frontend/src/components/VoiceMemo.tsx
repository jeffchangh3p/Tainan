import { useState, useRef, useEffect } from 'react';

interface Props {
  audio: string | null;
  onChange: (base64: string | null) => void;
}

export default function VoiceMemo({ audio, onChange }: Props) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setDuration(0);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          onChange(reader.result as string);
        };
        reader.readAsDataURL(blob);
        // Stop all tracks
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start(100);
      setRecording(true);

      // Timer
      const start = Date.now();
      timerRef.current = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - start) / 1000));
      }, 500);

      // Auto-stop at 60 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          stopRecording();
        }
      }, 60000);
    } catch (err) {
      console.error('Microphone access denied:', err);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function togglePlay() {
    if (!audio) return;
    if (playing && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      const a = new Audio(audio);
      audioRef.current = a;
      a.onended = () => setPlaying(false);
      a.play();
      setPlaying(true);
    }
  }

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  if (recording) {
    return (
      <div className="voice-memo">
        <div className="voice-recording">
          <span className="voice-recording-dot"></span>
          <span className="voice-recording-time">{formatTime(duration)}</span>
          <button type="button" className="btn btn-primary" onClick={stopRecording} style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
            ⏹ Stop 停止
          </button>
        </div>
      </div>
    );
  }

  if (audio) {
    return (
      <div className="voice-memo">
        <div className="voice-playback">
          <button type="button" className="voice-play-btn" onClick={togglePlay}>
            {playing ? '⏸' : '▶️'}
          </button>
          <div className="voice-waveform">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className={`voice-bar ${playing ? 'active' : ''}`}
                style={{ height: `${12 + Math.sin(i * 0.8) * 10}px`, animationDelay: `${i * 0.05}s` }}
              />
            ))}
          </div>
          <div className="voice-memo-actions">
            <button type="button" className="btn btn-secondary" onClick={startRecording} style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
              🔄 Re-record
            </button>
            <button type="button" className="btn btn-danger" onClick={() => { onChange(null); setPlaying(false); }} style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
              ✕ Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-memo">
      <button type="button" className="voice-record-btn" onClick={startRecording}>
        <span className="voice-record-icon">🎙️</span>
        <span>Record Voice Memo 錄音備忘</span>
      </button>
    </div>
  );
}
