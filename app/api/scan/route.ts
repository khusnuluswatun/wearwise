import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    // Convert to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type as "image/jpeg" | "image/png" | "image/webp";

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are WearWise AI, an expert garment analyst. Analyze this clothing item photo carefully.

IMPORTANT: First, determine if the image actually contains clothing, apparel, or footwear. If it DOES NOT contain any clothing, ignore all other instructions and respond ONLY with this exact JSON:
{"error": "not_clothing"}

If it DOES contain clothing, respond ONLY with a valid JSON object (no markdown, no backticks) in this exact format:
{
  "item": "brief item name (e.g. Blue Denim Jacket)",
  "condition": "Excellent | Good | Fair | Poor",
  "conditionScore": 85,
  "fabric": "detected fabric type (e.g. Cotton, Polyester, Denim, etc.)",
  "color": "main color(s)",
  "recommendation": "Sell | Donate | Upcycle | Recycle",
  "recommendationEmoji": "🏷️ | 🤝 | ✂️ | ♻️",
  "recommendationColor": "#FF8C42 | #4DAAFF | #B06AFF | #2DCB73",
  "reasoning": "2-3 sentence explanation of why this recommendation is best",
  "sellPrice": "Single maximum estimated resale price formatted as IDR string (e.g. 'Rp 150.000') or null if not applicable. DO NOT USE A RANGE.",
  "tags": ["tag1", "tag2", "tag3"],
  "tips": "one specific actionable tip for the recommended action"
}

Rules:
- condition score 0-100 (100 = brand new)
- Sell if score >= 70 and item is still stylish
- Donate if score 40-69 or item is functional but not trendy
- Upcycle if score 30-60 and item has interesting material/shape
- Recycle if score < 35 or item is too damaged
- PRICING RULE: 
  1. If there is NO indication that the item is "never been used", "with tag", or "brand new", you MUST set the sellPrice strictly UNDER Rp 50.000 (e.g. "Rp 35.000"), regardless of brand.
  2. IF the item IS clearly "never been used" or "brand new":
     - For UNBRANDED items, set sellPrice to exactly "Rp 150.000".
     - For BRANDED items, estimate the original retail price and reduce it just a little bit. Give the final maximum estimated sellPrice in IDR string.`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
    ]);

    const text = result.response.text().trim();

    // Clean up any markdown wrappers if present
    const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

    const data = JSON.parse(cleaned);

    if (data.error === "not_clothing") {
      return NextResponse.json(
        { error: "The image detected is not clothing. Please upload a real clothing photo." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Scan API error:", err);

    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "AI returned invalid response, please try again." }, { status: 500 });
    }

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
