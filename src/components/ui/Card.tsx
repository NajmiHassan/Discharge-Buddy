import type { ReactNode } from "react";

type Variant = "default" | "success" | "warning" | "alert";

interface CardProps {
  variant?: Variant;
  title?: string;
  children: ReactNode;
  className?: string;
}

const borderStyles: Record<Variant, string> = {
  default: "border-l-transparent",
  success: "border-l-[#4A9E8E]",
  warning: "border-l-[#E8A838]",
  alert: "border-l-[#D14B4B]",
};

export default function Card({
  variant = "default",
  title,
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-xl p-6 shadow-sm border-l-4
        ${borderStyles[variant]}
        ${className}
      `}
    >
      {title && (
        <h3 className="text-[20px] font-bold text-[#1B2A4A] mb-3">{title}</h3>
      )}
      {children}
    </div>
  );
}