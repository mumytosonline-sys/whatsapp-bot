require("dotenv").config();
const express = require("express");
const axios = require("axios");
const OpenAI = require("openai");

const app = express();
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ===== VARIABLES =====
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// ===== MEMORIA (simulada) =====
const users = {};
const lastMessage = {};

// ===== DATA =====
const DATA = {
  vip: "$10 por 30 días",
  web: "https://mu-core.com/",
  yape: "999999999"
};

// ===== MENÚ =====
function menu() {
  return `👋 *MU CORE BOT*

1️⃣ Info servidor  
2️⃣ Comprar VIP  
3️⃣ Donar  
4️⃣ Web  
5️⃣ Hablar con IA  

Responde con número 👇`;
}

// ===== IA =====
async function askAI(text) {
  const res = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: "Eres un asistente del servidor MU CORE, responde corto y claro."
      },
      { role: "user", content: text }
    ]
  });

  return res.choices[0].message.content;
}

// ===== WEBHOOK VERIFY =====
app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
    return res.send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

// ===== ENVIAR MENSAJE =====
async function sendMessage(to, body) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      text: { body }
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

// ===== WEBHOOK =====
app.post("/webhook", async (req, res) => {
  try {
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg) return res.sendStatus(200);

    const from = msg.from;

    // anti spam
    if (lastMessage[from] && Date.now() - lastMessage[from] < 1500) {
      return res.sendStatus(200);
    }
    lastMessage[from] = Date.now();

    const text =
      msg.text?.body ||
      msg.interactive?.button_reply?.id ||
      "";

    if (!text) return res.sendStatus(200);

    console.log("User:", from, text);

    // crear usuario
    if (!users[from]) {
      users[from] = { step: "menu" };
    }

    // ===== MENU =====
    if (text.toLowerCase().includes("hola") || text === "menu") {
      users[from].step = "menu";
      return await sendMessage(from, menu());
    }

    // ===== OPCIONES =====
    switch (text) {
      case "1":
        return await sendMessage(from, "📊 Servidor MU CORE x20-5x, clásico");

      case "2":
        users[from].step = "comprar";
        return await sendMessage(
          from,
          `💎 VIP cuesta ${DATA.vip}

Envía comprobante al Yape:
📱 ${DATA.yape}`
        );

      case "3":
        return await sendMessage(from, "💰 Aceptamos Yape, Plin, Binance");

      case "4":
        return await sendMessage(from, `🌐 ${DATA.web}`);

      case "5":
        users[from].step = "ia";
        return await sendMessage(from, "🤖 Escribe tu pregunta:");
    }

    // ===== IA ACTIVADA =====
    if (users[from].step === "ia") {
      const ai = await askAI(text);
      return await sendMessage(from, ai);
    }

    // ===== COMPRA DETECTADA =====
    if (users[from].step === "comprar") {
      return await sendMessage(
        from,
        "📩 Recibimos tu mensaje. Un ADM validará tu pago."
      );
    }

    // ===== DEFAULT =====
    return await sendMessage(from, "Escribe *menu* para comenzar");

  } catch (err) {
    console.log(err.response?.data || err.message);
    res.sendStatus(200);
  }
});

// ===== SERVER =====
app.listen(8080, () => console.log("🔥 BOT NIVEL DIOS ACTIVO"));
