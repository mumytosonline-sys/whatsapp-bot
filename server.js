require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// ===== VARIABLES =====
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ===== IA =====
async function getAIResponse(text) {
  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
Eres un asistente de WhatsApp SOLO para un negocio de servidores.

REGLAS:
- SOLO respondes sobre el negocio
- Si preguntan otra cosa responde: "Solo atendemos consultas del servidor 💻"
- Responde corto, claro y amable
- No inventes información

NEGOCIO:
- Servicios: hosting, bots, automatización, soporte técnico
- Horario: 9am a 6pm
- Ubicación: Perú
`
          },
          { role: "user", content: text }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.data.choices[0].message.content;
  } catch (err) {
    console.log("ERROR IA:", err.response?.data || err.message);
    return "Error con IA";
  }
}

// ===== FILTRO (SOLO SERVIDOR) =====
function isServerRelated(text) {
  const t = text.toLowerCase();

  return (
    t.includes("servidor") ||
    t.includes("hosting") ||
    t.includes("bot") ||
    t.includes("precio") ||
    t.includes("soporte") ||
    t.includes("servicio") ||
    t.includes("automatizacion")
  );
}

// ===== RESPUESTA INTELIGENTE =====
async function getResponse(text) {
  const t = text.toLowerCase();

  // RESPUESTAS GRATIS (NO IA)
  if (t.includes("hola")) {
    return "Hola 👋 ¿Consulta sobre servidores o servicios?";
  }

  if (t.includes("horario")) {
    return "Atendemos de 9am a 6pm 🕘";
  }

  // BLOQUEO SI NO ES DEL NEGOCIO
  if (!isServerRelated(text)) {
    return "Solo atendemos consultas del servidor 💻";
  }

  // USA IA SOLO SI ES NECESARIO
  return await getAIResponse(text);
}

// ===== VERIFY WEBHOOK =====
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

// ===== RECIBIR MENSAJES =====
app.post("/webhook", async (req, res) => {
  try {
    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message) {
      const from = message.from;
      const text = message.text?.body || "";

      console.log("Mensaje:", text);

      const reply = await getResponse(text);

      await axios.post(
        `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: from,
          text: { body: reply }
        },
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      );

      console.log("Respondido");
    }

    res.sendStatus(200);
  } catch (err) {
    console.log("ERROR:", err.message);
    res.sendStatus(200);
  }
});

// ===== ROOT =====
app.get("/", (req, res) => {
  res.send("Bot activo 🚀");
});

// ===== SERVER =====
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});
