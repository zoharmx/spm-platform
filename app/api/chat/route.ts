import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_MESSAGE_LENGTH = 1000; // characters
const CHAT_RATE_LIMIT = 20;      // requests per window
const CHAT_WINDOW_MS = 60_000;   // 1 minute

const SYSTEM_PROMPT = `Eres el asistente virtual de SanPedroMotoCare, un servicio de mecánicos a domicilio en San Pedro Garza García, Monterrey, México.

Tu rol es:
1. Ayudar a los clientes a identificar qué servicio necesitan para su motocicleta
2. Dar cotizaciones aproximadas (sin comprometerte a precios exactos)
3. Explicar los servicios disponibles
4. Agendar o dirigir al cliente al formulario de cotización
5. Responder preguntas sobre el área de cobertura, horarios y procesos

Información clave:
- Servicios: Afinación menor/mayor, frenos, sistema eléctrico, suspensión, cadena y sprockets, neumáticos, batería, carburador/inyección, motor, diagnóstico
- Área de cobertura: San Pedro Garza García, Monterrey, Guadalupe, Apodaca, Santa Catarina, San Nicolás
- Horario: Lunes a Domingo 7am–9pm, urgencias 24/7
- Tiempo de respuesta: 45 minutos promedio
- Pago: Efectivo, tarjeta, transferencia
- Contacto WhatsApp: +52 81 0000-0000

Responde siempre en el mismo idioma que el usuario (español o inglés).
Sé amable, profesional y conciso (máximo 3 párrafos por respuesta).
Si no sabes algo específico, invita al cliente a contactar vía WhatsApp o llenar el formulario de cotización.`;

export async function POST(req: NextRequest) {
  // Rate limiting — 20 requests/min per IP
  const ip = getClientIp(req);
  const rl = rateLimit(`chat:${ip}`, CHAT_RATE_LIMIT, CHAT_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    // Guard against excessively long messages
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `El mensaje no puede exceder ${MAX_MESSAGE_LENGTH} caracteres.` },
        { status: 400 }
      );
    }

    // GEMINI_API_KEY is server-only — never use NEXT_PUBLIC_ for this
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction: SYSTEM_PROMPT,
    });

    // Build chat history — limit to last 10 messages
    const chatHistory = (Array.isArray(history) ? history : [])
      .slice(-10)
      .map((msg: { role: string; content: string }) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: String(msg.content).slice(0, MAX_MESSAGE_LENGTH) }],
      }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);
    const response = result.response.text();

    return NextResponse.json({ reply: response });
  } catch (error) {
    console.error("[api/chat] error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: "Error procesando tu mensaje. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
