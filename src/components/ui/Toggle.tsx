import type { Role } from "../../types";

interface ToggleProps {
  value: Role;
  onChange: (value: Role) => void;
}

export default function Toggle({ value, onChange }: ToggleProps) {
  return (
    <div
      className="inline-flex items-center bg-[#F8F6F3] rounded-full p-1 border border-[#1B2A4A]/10"
      role="radiogroup"
      aria-label="User role"
    >
      <button
        onClick={() => onChange("patient")}
        role="radio"
        aria-checked={value === "patient"}
        className={`
          px-4 py-2 rounded-full text-[14px] font-medium transition-all cursor-pointer
          ${value === "patient"
            ? "bg-[#1B2A4A] text-white shadow-sm"
            : "text-[#1B2A4A]/60 hover:text-[#1B2A4A] hover:bg-white/50"
          }
        `}
      >
        Patient
      </button>
      <button
        onClick={() => onChange("caregiver")}
        role="radio"
        aria-checked={value === "caregiver"}
        className={`
          px-4 py-2 rounded-full text-[14px] font-medium transition-all cursor-pointer
          ${value === "caregiver"
            ? "bg-[#1B2A4A] text-white shadow-sm"
            : "text-[#1B2A4A]/60 hover:text-[#1B2A4A] hover:bg-white/50"
          }
        `}
      >
        Caregiver
      </button>
    </div>
  );
}