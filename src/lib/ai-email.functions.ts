import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const draftIntroEmail = createServerFn({ method: "POST" })
  .validator((v) => z.object({
    partnerName: z.string().max(200), contactName: z.string().max(200), tier: z.string().max(50), type: z.string().max(100),
    winRate: z.number(), closedWon: z.number(), certifications: z.number(), country: z.string().max(100),
    account: z.string().max(200), dealCountry: z.string().max(100), product: z.string().max(200), amount: z.number(), stage: z.string().max(100),
    motion: z.string().max(200), tone: z.enum(["Concise", "Warm", "Formal"]).default("Concise"), aeName: z.string().max(200).optional(),
  }).parse(v))
  .handler(async ({ data }) => {
    const { getSessionUser } = await import("./auth.server");
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized");
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    const ae = data.aeName || user.displayName || "the OpenText AE";
    const prompt = `Write a short co-sell introduction email from an OpenText Account Executive to a channel partner contact.
Tone: ${data.tone}. Max 150 words in the body. Start with a line "Subject: ...". Sign off as ${ae}.
Partner: ${data.partnerName} (${data.tier} ${data.type} partner, ${data.country}); contact ${data.contactName}; ${data.winRate}% win rate, ${data.closedWon} OpenText deals won, ${data.certifications} certifications.
Deal: ${data.account} in ${data.dealCountry}, ${data.product}, about $${data.amount.toLocaleString("en-US")}, stage "${data.stage}". The partner's role at this stage: ${data.motion}.
Explain specifically why this partner fits this deal and ask for a 15-minute call this week. Plain text only, no markdown.`;
    try {
      const res = await generateResponse({ model: "openai/gpt-6-astra", input: prompt });
      let text = "";
      for (const item of res.output ?? []) {
        if (item.type === "message") for (const c of item.content) if (c.type === "output_text") text += c.text;
      }
      if (!text.trim()) return { text: null, error: "The AI returned an empty draft. Try again." };
      return { text: text.trim(), error: null };
    } catch (e) {
      if (e instanceof GatewayError) {
        console.error("AI email failed", e.code, e.ids);
        if (e.code === "payment_required") return { text: null, error: "AI credits have run out for this workspace." };
        if (e.code === "rate_limited") return { text: null, error: "Too many requests right now — wait a moment and try again." };
        return { text: null, error: "The AI writer is unavailable right now." };
      }
      throw e;
    }
  });
