import { Outlet } from "react-router-dom";
import Header from "./Header";
import TabBar from "./TabBar";

export default function AuthenticatedLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Desktop sidebar spacer */}
      <div className="hidden lg:block fixed left-0 top-16 bottom-0 w-56" />

      {/* Main content */}
      <main className="pt-16 pb-[72px] lg:pb-8 lg:ml-56">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>

      <TabBar />
    </div>
  );
}