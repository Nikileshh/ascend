// Renders AI text: **bold** markers become real bold, and lines that start
// with a bullet (• or -) render as a clean, spaced point list.
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-[#1f1a14]">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function RichText({ text }: { text: string }) {
  // Group the text into blocks of consecutive bullet lines vs. prose.
  const lines = text.split("\n");
  const blocks: { type: "bullets" | "prose"; lines: string[] }[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const isBullet = /^([•\-*]|\d+\.)\s+/.test(line);
    const last = blocks[blocks.length - 1];
    const type = isBullet ? "bullets" : "prose";
    if (last && last.type === type) last.lines.push(line);
    else blocks.push({ type, lines: [line] });
  }

  return (
    <div className="flex flex-col gap-3">
      {blocks.map((b, i) =>
        b.type === "bullets" ? (
          <ul key={i} className="flex flex-col gap-2.5">
            {b.lines.map((l, j) => (
              <li
                key={j}
                className="flex gap-3 text-[16px] leading-[26px] text-[#4a4239]"
              >
                <span className="mt-[9px] h-[6px] w-[6px] shrink-0 rounded-full bg-[#a8721f]" />
                <span>
                  <Inline text={l.replace(/^([•\-*]|\d+\.)\s+/, "")} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={i} className="text-[16px] leading-[27px] text-[#4a4239]">
            <Inline text={b.lines.join(" ")} />
          </p>
        ),
      )}
    </div>
  );
}
