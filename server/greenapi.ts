function getConfig() {
  return {
    idInstance: process.env.GREEN_API_ID_INSTANCE || "",
    apiToken: process.env.GREEN_API_TOKEN || "",
    chatId: process.env.GREEN_API_CHAT_ID || "",
  };
}

export function isGreenApiConfigured(): boolean {
  const { idInstance, apiToken, chatId } = getConfig();
  return !!(idInstance && apiToken && chatId);
}

export async function sendWhatsAppMessage(text: string): Promise<boolean> {
  const { idInstance, apiToken, chatId } = getConfig();
  if (!idInstance || !apiToken || !chatId) {
    console.error("Green API: Missing config (ID_INSTANCE, TOKEN, or CHAT_ID)");
    return false;
  }

  const url = `https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiToken}`;
  console.log("Green API: Sending text message...");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, message: text }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`Green API: HTTP ${res.status} — ${body}`);
      return false;
    }

    console.log("Green API: Message sent successfully");
    return true;
  } catch (err: any) {
    console.error("Green API: Failed to send —", err?.message || err);
    return false;
  }
}

export async function sendWhatsAppImage(pngBuffer: Buffer, caption?: string): Promise<boolean> {
  const { idInstance, apiToken, chatId } = getConfig();
  if (!idInstance || !apiToken || !chatId) {
    console.error("Green API: Missing config (ID_INSTANCE, TOKEN, or CHAT_ID)");
    return false;
  }

  const url = `https://api.green-api.com/waInstance${idInstance}/sendFileByUpload/${apiToken}`;
  console.log(`Green API: Sending image (${pngBuffer.length} bytes)...`);

  try {
    const formData = new FormData();
    formData.append("chatId", chatId);
    formData.append("fileName", "starlanes.png");
    if (caption) formData.append("caption", caption);
    formData.append("file", new Blob([new Uint8Array(pngBuffer)], { type: "image/png" }), "starlanes.png");

    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const body = await res.text();
    if (!res.ok) {
      console.error(`Green API: HTTP ${res.status} — ${body}`);
      return false;
    }

    console.log("Green API: Image sent successfully —", body);
    return true;
  } catch (err: any) {
    console.error("Green API: Failed to send image —", err?.message || err);
    return false;
  }
}
