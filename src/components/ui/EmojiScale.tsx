interface EmojiOption {
  emoji: string;
  label: string;
  value: string;
}

const options: EmojiOption[] = [
  { emoji: "😢", label: "Very unwell", value: "very_unwell" },
  { emoji: "😐", label: "Okay", value: "okay" },
  { emoji: "😊", label: "Good", value: "good" },
  { emoji: "😄", label: "Great", value: "great" },
  { emoji: "🌟", label: "Excellent", value: "excellent" },
];

interface EmojiScaleProps {
  selected: string | null;
  onChange: (value: string) => void;
}

export default function EmojiScale({ selected, onChange }: EmojiScaleProps) {
  return (
    <div className="flex gap-2 justify-center" role="radiogroup" aria-label="How are you feeling?">
      {options.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            role="radio"
            aria-checked={isSelected}
            aria-label={opt.label}
            className={`
              flex flex-col items-center gap-1 p-3 rounded-xl min-w-[64px] cursor-pointer
              transition-all duration-150 ease-out
              ${isSelected
                ? "bg-[#1B2A4A]/10 ring-2 ring-[#1B2A4A] scale-105"
                : "hover:bg-[#1B2A4A]/5 active:scale-95"
              }
            `}
          >
            <span className="text-[36px] leading-none">{opt.emoji}</span>
            <span className={`text-[12px] font-medium ${isSelected ? "text-[#1B2A4A]" : "text-[#1B2A4A]/50"}`}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}