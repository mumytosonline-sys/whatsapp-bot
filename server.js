require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// 🔥 ANTI-CRASH GLOBAL
process.on("uncaughtException", (err) => {
  console.error("Error global:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Promesa no manejada:", err);
});

// 🔐 VARIABLES
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 🧠 IA (OpenAI)
async function getAIResponse(userMessage) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Eres un asistente útil." },
          { role: "user", content: userMessage }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices?.[0]?.message?.content || "No entendí 🤔";
  } catch (error) {
    console.error("ERROR IA:", error.response?.data || error.message);
    return "⚠️ Error con la IA";
  }
}

// 🔁 VERIFICACIÓN WEBHOOK (META)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    console.log("Webhook verificado");
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

// 📩 RECIBIR MENSAJES
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (messages && messages[0]) {
      const msg = messages[0];
      const from = msg.from;
      const text = msg.text?.body;

      console.log("📩 Mensaje recibido:", text);

      // 🤖 IA
      const aiResponse = await getAIResponse(text || "Hola");

      console.log("🤖 Respuesta IA:", aiResponse);

      // 📤 RESPUESTA A WHATSAPP
      await axios.post(
        `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: from,
          text: { body: aiResponse }
        },
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      );

      console.log("✅ Mensaje enviado");
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error webhook:", error.response?.data || error.message);
    res.sendStatus(200); // importante para que Meta no reintente infinito
  }
});

// 🟢 RUTA TEST
app.get("/", (req, res) => {
  res.send("Bot funcionando 🚀");
});

// 🚀 SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
