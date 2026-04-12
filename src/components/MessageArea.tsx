import React, { useRef, useEffect } from "react";
import type { GameMessage } from "../types/game";
import { useMobile } from "../hooks/useMobile";

interface MessageAreaProps {
  messages: GameMessage[];
}

const MESSAGE_COLORS: Record<GameMessage["type"], string> = {
  info: "#9ca3af",
  alert: "#f59e0b",
  positive: "#34d399",
  critical: "#ef4444",
};

const MAX_VISIBLE = 12;

export const MessageArea: React.FC<MessageAreaProps> = ({ messages }) => {
  const isMobile = useMobile();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Show last MAX_VISIBLE messages
  const visible = messages.slice(-MAX_VISIBLE);
  const lineHeight = isMobile ? 14 : 18;
  const maxH = MAX_VISIBLE * lineHeight + (isMobile ? 8 : 16);

  return (
    <div
      ref={scrollRef}
      style={{
        fontFamily: "'Courier New', monospace",
        fontSize: isMobile ? 10 : 12,
        background: "#0f0f23",
        border: "1px solid #333",
        borderRadius: 4,
        padding: isMobile ? "4px 8px" : "8px 12px",
        maxHeight: maxH,
        overflowY: "auto",
      }}
    >
      {visible.length === 0 ? (
        <span style={{ color: "#4b5563" }}>Awaiting commands...</span>
      ) : (
        visible.map((msg, i) => (
          <div
            key={i}
            style={{
              color: MESSAGE_COLORS[msg.type],
              lineHeight: `${lineHeight}px`,
              whiteSpace: "pre",
            }}
          >
            {msg.text}
          </div>
        ))
      )}
    </div>
  );
};
