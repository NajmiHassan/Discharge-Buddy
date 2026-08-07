import { NavLink } from "react-router-dom";

interface Tab {
  to: string;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { to: "/plan", label: "Plan", icon: "📋" },
  { to: "/medications", label: "Meds", icon: "💊" },
  { to: "/check-in", label: "Check-in", icon: "✅" },
  { to: "/alerts", label: "Alerts", icon: "🔔" },
];

export default function TabBar() {
  return (
    <>
      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#1B2A4A]/10 z-50 h-[72px] lg:hidden">
        <div className="flex items-center justify-around h-full px-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 min-w-[64px] h-full px-3 rounded-lg transition-colors
                ${isActive
                  ? "text-[#1B2A4A]"
                  : "text-[#1B2A4A]/40 hover:text-[#1B2A4A]/70"
                }`
              }
            >
              <span className="text-[22px]">{tab.icon}</span>
              <span className="text-[11px] font-medium">{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <nav className="hidden lg:flex fixed left-0 top-16 bottom-0 w-56 bg-white border-r border-[#1B2A4A]/10 z-40 flex-col pt-4">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-4 mx-2 rounded-xl text-[18px] font-medium transition-all
              ${isActive
                ? "bg-[#1B2A4A]/10 text-[#1B2A4A]"
                : "text-[#1B2A4A]/50 hover:text-[#1B2A4A] hover:bg-[#1B2A4A]/5"
              }`
            }
          >
            <span className="text-[22px]">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}