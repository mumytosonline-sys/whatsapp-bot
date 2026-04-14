require("dotenv").config();
const express = require("express");
const axios = require("axios");

// IA opcional (no rompe si no está instalada)
let OpenAI = null;
try {
  OpenAI = require("openai");
} catch (e) {
  console.log("⚠ OpenAI no instalado (IA desactivada)");
}

const app = express();
app.use(express.json());

// ===== VARIABLES =====
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// ===== IA SETUP =====
const hasAI = OpenAI && process.env.OPENAI_API_KEY;
const aiClient = hasAI
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// ===== ANTI SPAM =====
const lastMessage = {};

// ===== MEMORIA =====
const users = {};

// ===== DATA =====
const DATA = {
  exp: "x20-5x",
  drop: "20%",
  vip: "$10 por 30 días",
  web: "https://mu-core.com/",
  yape: "999999999"
};

// ===== MENÚ TEXTO =====
function getMenuText() {
  return `👋 *MU CORE*

Selecciona una opción:

1️⃣ Info servidor  
2️⃣ Comprar VIP  
3️⃣ Donar  
4️⃣ Web  
5️⃣ IA 🤖`;
}

// ===== BOTONES =====
async function sendButtons(to) {
  return axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: "👋 Bienvenido a *MU CORE*\nElige opción:" },
        action: {
          buttons: [
            { type: "reply", reply: { id: "1", title: "Info" } },
            { type: "reply", reply: { id: "2", title: "VIP" } },
            { type: "reply", reply: { id: "3", title: "Donar" } },
            { type: "reply", reply: { id: "5", title: "IA" } }
          ]
        }
      }
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

// ===== ENVIAR TEXTO =====
async function sendMessage(to, body) {
  return axios.post(
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

// ===== IA =====
async function askAI(text) {
  if (!hasAI) return "🤖 IA no configurada aún.";

  const res = await aiClient.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: "Eres soporte del servidor MU CORE. Responde corto y claro." },
      { role: "user", content: text }
    ]
  });

  return res.choices[0].message.content;
}

// ===== VERIFY =====
app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
    return res.send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

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

    console.log("MSG:", from, text);

    // crear usuario
    if (!users[from]) users[from] = { step: "menu" };

    // ===== MENU =====
    if (text.toLowerCase().includes("hola") || text === "menu") {
      users[from].step = "menu";
      return await sendButtons(from);
    }

    // ===== OPCIONES =====
    switch (text) {
      case "1":
        return await sendMessage(from, "📊 Servidor MU CORE x20-5x clásico");

      case "2":
        users[from].step = "vip";
        return await sendMessage(
          from,
          `💎 VIP: ${DATA.vip}\n\nPaga por Yape:\n📱 ${DATA.yape}\nEnvía comprobante`
        );

      case "3":
        return await sendMessage(from, "💰 Yape, Plin, Binance");

      case "4":
        return await sendMessage(from, `🌐 ${DATA.web}`);

      case "5":
        users[from].step = "ia";
        return await sendMessage(from, "🤖 Escribe tu pregunta:");
    }

    // ===== IA =====
    if (users[from].step === "ia") {
      const ai = await askAI(text);
      return await sendMessage(from, ai);
    }

    // ===== COMPRA =====
    if (users[from].step === "vip") {
      return await sendMessage(
        from,
        "📩 Recibido. Un ADM validará tu pago."
      );
    }

    return await sendMessage(from, "Escribe *menu*");

  } catch (err) {
    console.log("ERROR:", err.response?.data || err.message);
    res.sendStatus(200);
  }
});

// ===== SERVER =====
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("🔥 BOT PRO++ ACTIVO en " + PORT);
});
