require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 🧠 MEMORIA POR USUARIO
const userMemory = {};

// ===== IA CON MEMORIA =====
async function getAIResponse(userId, text) {
  try {
    // crear memoria si no existe
    if (!userMemory[userId]) {
      userMemory[userId] = [
        {
          role: "system",
          content: `
Eres un asistente del servidor Mu Core.

INFORMACIÓN:
- EXP: x20-5x
- Drop: 20%
- VIP: $10
- Tipo: Slow
- Donaciones: Yape, Plin, PayPal, Binance
- Cuentas: 03 por IP
- Inauguracion: todo la informacion esta la Web https://mu-core.com/
- puntos Por reset: 30
- Max reset: 03 reset
- venden Items: No. todo se consigue en el juego
- Mas informacion: comunicate con el ADM


Responde como soporte del servidor.
`
        }
      ];
    }

    // guardar mensaje usuario
    userMemory[userId].push({
      role: "user",
      content: text
    });

    // limitar memoria (para ahorrar dinero)
    if (userMemory[userId].length > 10) {
      userMemory[userId].splice(1, 2);
    }

    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: userMemory[userId]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = res.data.choices[0].message.content;

    // guardar respuesta del bot
    userMemory[userId].push({
      role: "assistant",
      content: reply
    });

    return reply;

  } catch (err) {
    console.log("ERROR IA:", err.response?.data || err.message);
    return "Error 🤖";
  }
}

// ===== WEBHOOK =====
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

// ===== MENSAJES =====
app.post("/webhook", async (req, res) => {
  try {
    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message) {
      const from = message.from;
      const text = message.text?.body || "";

      console.log("Mensaje:", text);

      const reply = await getAIResponse(from, text);

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
    }

    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(200);
  }
});

app.listen(process.env.PORT || 8080, () => {
  console.log("🚀 Bot con memoria activo");
});
