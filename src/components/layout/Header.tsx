import { useAuth } from "../../contexts/AuthContext";
import { useCarePlan } from "../../contexts/CarePlanContext";
import Toggle from "../ui/Toggle";

export default function Header() {
  const { user, signOut } = useAuth();
  const { state, toggleRole } = useCarePlan();

  const initials = user?.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-[#1B2A4A]/10 z-50 flex items-center px-4">
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
        {/* App name */}
        <h1 className="text-[22px] font-bold text-[#1B2A4A] tracking-tight">
          Discharge Buddy
        </h1>

        {/* Role toggle */}
        <div className="hidden sm:block">
          <Toggle value={state.role} onChange={toggleRole} />
        </div>

        {/* User + Logout */}
        <div className="flex items-center gap-3">
          {/* Mobile role toggle — visible on small screens */}
          <div className="sm:hidden">
            <Toggle value={state.role} onChange={toggleRole} />
          </div>

          <div className="w-9 h-9 rounded-full bg-[#1B2A4A] flex items-center justify-center text-white text-[16px] font-semibold">
            {initials}
          </div>
          <button
            onClick={signOut}
            className="text-[14px] text-[#1B2A4A]/60 hover:text-[#D14B4B] font-medium transition-colors cursor-pointer"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}