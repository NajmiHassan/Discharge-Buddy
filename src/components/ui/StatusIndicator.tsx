type Status = "success" | "warning" | "danger";

interface StatusIndicatorProps {
  status: Status;
  label: string;
}

const dotColors: Record<Status, string> = {
  success: "bg-[#4A9E8E]",
  warning: "bg-[#E8A838]",
  danger: "bg-[#D14B4B]",
};

export default function StatusIndicator({ status, label }: StatusIndicatorProps) {
  return (
    <span className="inline-flex items-center gap-2 text-[16px]">
      <span className={`w-3 h-3 rounded-full ${dotColors[status]}`} />
      <span className="text-[#1A1A1A]">{label}</span>
    </span>
  );
}