/**
 * Matrix-style decode typewriter — scrambles glyphs then locks the question when active (hover/focus).
 */

import React, { useEffect, useRef, useState } from 'react';

const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ01░▒▓<>/\\|';

function scrambleChar(target: string): string {
  if (target === ' ') return ' ';
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? '?';
}

type Props = {
  text: string;
  active: boolean;
  className?: string;
  /** Idle cue before decode */
  idleLabel?: string;
};

export function MatrixTypewriter({
  text,
  active,
  className = '',
  idleLabel = '>_ decode signal…',
}: Props) {
  const [display, setDisplay] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!active) {
      setDisplay('');
      return;
    }

    if (reduceMotion.current) {
      setDisplay(text);
      return;
    }

    let settled = 0;
    let scrambleTicks = 0;
    const SCRAMBLE_PER_CHAR = 3;
    const chars = text.split('');

    const tick = () => {
      if (settled >= chars.length) {
        setDisplay(text);
        return;
      }

      scrambleTicks += 1;
      const head = chars.slice(0, settled).join('');
      const currentTarget = chars[settled] ?? '';
      const scrambling = currentTarget === ' ' ? ' ' : scrambleChar(currentTarget);
      const tail = chars
        .slice(settled + 1)
        .map((c) => (c === ' ' ? ' ' : scrambleChar(c)))
        .join('');

      setDisplay(head + scrambling + tail);

      if (scrambleTicks >= SCRAMBLE_PER_CHAR || currentTarget === ' ') {
        settled += 1;
        scrambleTicks = 0;
      }

      timerRef.current = setTimeout(tick, 28);
    };

    tick();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, text]);

  return (
    <p
      className={`font-mono text-[13px] font-semibold tracking-tight leading-snug min-h-[2.5rem] ${className}`}
      aria-live="polite"
    >
      {active ? (
        <>
          <span className="text-white">{display}</span>
          {display.length < text.length && (
            <span className="inline-block w-[0.5ch] h-[1em] ml-0.5 align-[-2px] bg-current animate-pulse opacity-80" />
          )}
        </>
      ) : (
        <span className="text-slate-600 text-[11px] tracking-widest uppercase font-medium">
          {idleLabel}
        </span>
      )}
    </p>
  );
}

export default MatrixTypewriter;
