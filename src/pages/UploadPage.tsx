import { useState, useRef, type ChangeEvent } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useCarePlan } from "../contexts/CarePlanContext";

export default function UploadPage() {
  const navigate = useNavigate();
  const { state, loadSamplePlan } = useCarePlan();
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If plan already exists, redirect to /plan
  if (state.carePlan) {
    return <Navigate to="/plan" replace />;
  }

  const handleLoadSample = () => {
    loadSamplePlan();
    navigate("/plan");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    // For MVP, just acknowledge the drop — no parsing
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (_e: ChangeEvent<HTMLInputElement>) => {
    // For MVP, no parsing — user must use "Load Sample Data"
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <h1 className="text-[36px] font-bold text-[#1B2A4A] mb-3">Get Started</h1>
      <p className="text-[18px] text-[#1B2A4A]/70 mb-10 text-center max-w-md">
        Upload your discharge summary to create your care plan, or load sample data to see how it works.
      </p>

      {/* File drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileClick}
        className={`w-full max-w-md border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
          ${dragOver
            ? "border-[#4A9E8E] bg-[#4A9E8E]/5"
            : "border-[#1B2A4A]/20 hover:border-[#1B2A4A]/40 bg-[#F8F6F3]"
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="text-[48px] mb-4">📄</div>
        <p className="text-[20px] font-medium text-[#1B2A4A] mb-2">
          Drag & drop your discharge summary here
        </p>
        <p className="text-[16px] text-[#1B2A4A]/50">
          or click to browse (PDF or photo)
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 w-full max-w-md my-8">
        <div className="flex-1 h-px bg-[#1B2A4A]/10" />
        <span className="text-[18px] text-[#1B2A4A]/40 font-medium">or</span>
        <div className="flex-1 h-px bg-[#1B2A4A]/10" />
      </div>

      {/* Load Sample Data button */}
      <button
        onClick={handleLoadSample}
        className="w-full max-w-md h-[56px] rounded-full bg-[#1B2A4A] text-white text-[20px] font-semibold
                   hover:bg-[#1B2A4A]/90 active:scale-[0.97] transition-all duration-150 ease-out cursor-pointer"
      >
        Load Sample Data
      </button>

      <p className="text-[16px] text-[#1B2A4A]/40 mt-6 text-center max-w-sm">
        Sample data simulates a real discharge summary for a heart failure patient. No document processing occurs in this demo.
      </p>
    </div>
  );
}