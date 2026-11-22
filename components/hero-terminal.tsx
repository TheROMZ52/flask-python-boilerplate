const script: Array<[string, string, string]> = [
  ["$", "muted", "nexvor init --project game-server"],
  ["›", "blue", "Loading development tools..."],
  ["›", "blue", "Platform: Java / Bedrock / CS 1.6"],
  ["›", "blue", "Services: plugins, setup, config"],
  ["✓", "green", "Ready for your idea"],
];

export default function HeroTerminal() {
  return (
    <div className="hx-terminal" dir="ltr">
      <div className="hx-term-top"><i /><i /><i /><span>nexvor_terminal</span><b>ready</b></div>
      <div className="hx-term-body">
        {script.map(([mark, tone, text], index) => (
          <div className="hx-term-line" key={index}>
            <span className={`t-${tone}`}>{mark}</span>
            <span>{text}</span>
            {index === script.length - 1 && <em className="hx-caret" aria-hidden="true" />}
          </div>
        ))}
      </div>
    </div>
  );
}
