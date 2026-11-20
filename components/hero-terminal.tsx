"use client";

import { useEffect, useState } from "react";

const script: Array<[string, string, string]> = [
  ["$", "muted", "nexvor init --project game-server"],
  ["›", "blue", "Loading development tools..."],
  ["›", "blue", "Platform: Java / Bedrock / CS 1.6"],
  ["›", "blue", "Services: plugins, setup, config"],
  ["✓", "green", "Ready for your idea"],
];

export default function HeroTerminal() {
  const [typed, setTyped] = useState<string[]>(() => script.map(line => line[2]));

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let line = 0, char = 0, timer = 0;
    setTyped(script.map(() => ""));
    const step = () => {
      if (line >= script.length) { timer = window.setTimeout(() => { line = 0; char = 0; setTyped(script.map(() => "")); step(); }, 3200); return; }
      char++;
      const text = script[line][2];
      setTyped(prev => prev.map((value, index) => (index === line ? text.slice(0, char) : value)));
      if (char >= text.length) { line++; char = 0; timer = window.setTimeout(step, 420); } else timer = window.setTimeout(step, 28);
    };
    timer = window.setTimeout(step, 900);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="hx-terminal" dir="ltr">
      <div className="hx-term-top"><i /><i /><i /><span>nexvor_terminal</span><b>ready</b></div>
      <div className="hx-term-body">
        {script.map(([mark, tone], index) => (
          <div className="hx-term-line" key={index}><span className={`t-${tone}`}>{mark}</span><span>{typed[index]}</span>{typed[index] && typed[index].length < script[index][2].length && <em className="hx-caret" />}</div>
        ))}
      </div>
    </div>
  );
}
