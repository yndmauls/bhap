'use client';

import { useEffect, useRef, useState } from 'react';

const ASCII_CHARS = 'Ñ@#W$9876543210?!abc;:+=-,._ ';
const WIDTH = 200;

export default function ColorizedAsciiVideo() {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const rafRef    = useRef<number>(0);
  const [muted, setMuted] = useState(true);

  const unmute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    setMuted(false);
  };

  useEffect(() => {
    const video  = videoRef.current;
    const output = outputRef.current;
    if (!video || !output) return;

    // Canvas in-memory — tidak dirender ke DOM
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    function render() {
      rafRef.current = requestAnimationFrame(render);

      // Mencegah error blank: tunggu hingga video memiliki dimensi
      if (!video || video.videoWidth === 0) return;

      // Koreksi rasio gambar: ×0.5 karena font monospace lebih tinggi dari lebarnya
      const height = Math.floor(WIDTH * (video.videoHeight / video.videoWidth) * 0.5);

      canvas.width  = WIDTH;
      canvas.height = height;

      ctx.drawImage(video, 0, 0, WIDTH, height);
      const { data } = ctx.getImageData(0, 0, WIDTH, height);

      let html = '';
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < WIDTH; x++) {
          const i   = (y * WIDTH + x) * 4;
          const r   = data[i];
          const g   = data[i + 1];
          const b   = data[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const ci  = Math.floor((lum / 255) * (ASCII_CHARS.length - 1));
          const ch  = ASCII_CHARS[ci];

          if (ch === ' ') {
            html += '&nbsp;';
          } else {
            html += `<span style="color:rgb(${r},${g},${b})">${ch}</span>`;
          }
        }
        html += '\n';
      }

      output!.innerHTML = html;
    }

    // Mulai loop render
    rafRef.current = requestAnimationFrame(render);
    video.play().catch(() => {});

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      className="min-h-screen w-full bg-black flex items-center justify-center overflow-hidden cursor-pointer"
      onClick={unmute}
    >
      {/* Video disembunyikan — hanya sumber frame */}
      <video
        ref={videoRef}
        src="/bhap.mp4"
        autoPlay
        muted
        loop
        playsInline
        style={{ display: 'none' }}
      />

      {/* Output ASCII colorized */}
      <div
        ref={outputRef}
        style={{
          fontFamily:    'monospace',
          fontSize:      '5px',
          lineHeight:    '5px',
          letterSpacing: '1px',
          whiteSpace:    'pre',
        }}
      />

      {/* Tap-to-unmute overlay */}
      {muted && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2
          px-5 py-2 rounded-full text-sm text-white/70
          bg-white/10 backdrop-blur-md border border-white/20
          animate-pulse pointer-events-none select-none">
          🔇 Tap untuk nyalain musik
        </div>
      )}
    </div>
  );
}