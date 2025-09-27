// /api/gbb-chat.js
export default async function handler(req, res) {
  try {
    const { message } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: "No message" });
    }

    const systemPrompt = `
Du er kundeservice- og salgsbot for GolfBoldBanken (genbrugte golfbolde).
Sprog: Dansk, venligt, kort og handlingsorienteret.

Mål:
1) Besvar FAQ om kvaliteter (Grade A/B/C), mærker, pakker, levering, retur.
2) Indsaml ordre-info: mærke, grade, antal, levering (KUN forsendelse – ingen afhentning), navn, e-mail, telefon, postnr.
3) Opkøb: indsamle info om mængde, stand, klub/sted, kontaktinfo.
4) Giv KUN prisintervaller (ikke faste priser) – henvis altid til webshop for eksakt pris.

Vigtigt:
- Levering KUN via GLS/DAO/Bring. Ingen afhentning.
- Betaling sker via webshoppen (kortbetaling). 
- Normal levering: 1–3 hverdage.
- Prisintervaller (vejledende):
  - Grade A: 10–25 kr/stk
  - Grade B: 6–12 kr/stk
  - Grade C: 2–6 kr/stk
  - Pro V1 (A): 18–30 kr/stk
- Altid afslut samtaler med en klar næste handling (fx “Vil du have et betalingslink til kurv?”).
`;

    // kald OpenAI
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await r.json();
    const reply =
      data.choices?.[0]?.message?.content?.trim() ||
      "Jeg forstod ikke helt – kan du prøve igen?";

    // Lead-detektion (simple filter)
    if (/@|\d{8}|grade|antal|stk|pro v1|titleist|srixon|callaway/i.test(message)) {
      if (process.env.LEAD_WEBHOOK_URL) {
        await fetch(process.env.LEAD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "gbb-chat",
            message,
            reply,
            ts: Date.now(),
          }),
        });
      }
    }

    res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      reply:
        "Ups, der gik noget galt. Skriv din e-mail og telefon, så sender vi betalingslink 👍",
    });
  }
}
