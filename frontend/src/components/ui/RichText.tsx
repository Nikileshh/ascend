// Renders **bold** markers from AI text as real bold
export function RichText({ text }: { text: string }) {
  return (
    <p className="leading-7 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-black dark:text-white">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        ),
      )}
    </p>
  );
}
