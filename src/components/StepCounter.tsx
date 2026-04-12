import React from "react";
import { useMobile } from "../hooks/useMobile";

interface StepCounterProps {
  currentStep: number;
  totalSteps: number;
  onClick?: () => void;
}

export const StepCounter: React.FC<StepCounterProps> = ({
  currentStep,
  totalSteps,
  onClick,
}) => {
  const m = useMobile();
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div
      onClick={onClick}
      title={onClick ? "Click to change game steps" : undefined}
      style={{
        fontFamily: "'Courier New', monospace",
        fontSize: m ? 10 : 13,
        color: "#e5e7eb",
        background: "#111827",
        border: "1px solid #374151",
        borderRadius: 4,
        padding: m ? "4px 8px" : "8px 12px",
        display: "flex",
        alignItems: "center",
        gap: m ? 6 : 12,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <span style={{ color: "#9ca3af", fontSize: m ? 9 : 11, textTransform: "uppercase" }}>
        Step
      </span>
      <span style={{ fontWeight: "bold", fontSize: m ? 12 : 16 }}>
        {String(currentStep).padStart(3, "0")}
      </span>
      <span style={{ color: "#6b7280" }}>/</span>
      <span style={{ color: "#9ca3af" }}>{totalSteps}</span>
      <div
        style={{
          flex: 1,
          height: m ? 3 : 4,
          background: "#1f2937",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: progress > 80 ? "#ef4444" : progress > 50 ? "#f59e0b" : "#22c55e",
            borderRadius: 2,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
};
