import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "success" | "warning" | "danger" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-[#1B2A4A] text-white hover:bg-[#1B2A4A]/90 border-2 border-transparent",
  success:
    "bg-[#4A9E8E] text-white hover:bg-[#4A9E8E]/90 border-2 border-transparent",
  warning:
    "bg-[#E8A838] text-white hover:bg-[#E8A838]/90 border-2 border-transparent",
  danger:
    "bg-[#D14B4B] text-white hover:bg-[#D14B4B]/90 border-2 border-transparent",
  outline:
    "bg-transparent text-[#1B2A4A] border-2 border-[#1B2A4A] hover:bg-[#1B2A4A]/5",
  ghost:
    "bg-transparent text-[#1B2A4A] border-2 border-transparent hover:bg-[#1B2A4A]/5",
};

export default function Button({
  variant = "primary",
  fullWidth = false,
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        h-[56px] rounded-full text-[18px] font-semibold px-8
        active:scale-[0.97] transition-all duration-150 ease-out
        cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
        ${fullWidth ? "w-full" : ""}
        ${variantStyles[variant]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}