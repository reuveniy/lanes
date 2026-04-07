import { OAuth2Client } from "google-auth-library";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

const client = new OAuth2Client(CLIENT_ID);

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export async function verifyGoogleToken(
  idToken: string
): Promise<GoogleUser | null> {
  if (!CLIENT_ID) {
    console.warn("GOOGLE_CLIENT_ID not set — auth disabled, accepting all tokens");
    return null;
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) return null;

    return {
      id: payload.sub,
      email: payload.email || "",
      name: payload.name || payload.email || "Unknown",
      picture: payload.picture || "",
    };
  } catch (e) {
    console.error("Google token verification failed:", e);
    return null;
  }
}

export function getClientId(): string {
  return CLIENT_ID;
}
