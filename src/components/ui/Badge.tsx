import type { ReactNode } from "react";

type Variant = "success" | "warning" | "danger" | "info";

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  success: "bg-[#4A9E8E]/15 text-[#4A9E8E]",
  warning: "bg-[#E8A838]/15 text-[#E8A838]",
  danger: "bg-[#D14B4B]/15 text-[#D14B4B]",
  info: "bg-[#1B2A4A]/10 text-[#1B2A4A]",
};

export default function Badge({
  variant = "info",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full px-3 py-1 text-[14px] font-medium
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}