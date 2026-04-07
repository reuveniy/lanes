import React, { useEffect, useRef } from "react";
import { useMobile } from "../hooks/useMobile";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleLoginProps {
  clientId: string;
  onToken: (idToken: string) => void;
}

export const GoogleLogin: React.FC<GoogleLoginProps> = ({
  clientId,
  onToken,
}) => {
  const isMobile = useMobile();
  const btnRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!clientId || initializedRef.current) return;

    function initGoogle() {
      if (!window.google || !btnRef.current) return;
      initializedRef.current = true;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          onToken(response.credential);
        },
      });

      const btnWidth = isMobile ? Math.min(200, window.innerWidth - 60) : 230;
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: "filled_black",
        size: "medium",
        width: btnWidth,
        text: "signin_with",
      });
    }

    // If script already loaded
    if (window.google) {
      initGoogle();
      return;
    }

    // Load the Google Identity Services script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
  }, [clientId, onToken]);

  if (!clientId) {
    return (
      <div style={{ color: "#6b7280", fontSize: 12, textAlign: "center" }}>
        Google login not configured (set GOOGLE_CLIENT_ID)
      </div>
    );
  }

  return <div ref={btnRef} />;
};
