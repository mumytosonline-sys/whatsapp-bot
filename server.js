require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

const ADMIN_NUMBER = "51927675685";

const lastMessage = {};
const pagosPendientes = [];

// ===== DATA =====
const DATA = {
  version: "Season 6 - Hard",
  exp: "20x - 5x",
  expvip: "20x",
  drop: "20%",
  spots: "4-5 mobs por zona",
  buffers: "Nivel 180",
  mg: "Nivel 220",
  dl: "Nivel 250",
  rf: "Nivel 300",
  cuentas: "3 cuentas por IP",
  options: "Máximo 2 options",
  hp: "150%",
  reset: "300 puntos por reset",
  maxreset: "3 resets máximo",
  maxlevel: "400",
  vip: "$10 / 30 días",
  web: "https://mu-core.com/",
  yape: "51927675685",
  binance: "823927645",
  donaciones: "Yape, Plin, PayPal, Binance",
  discord: "https://discord.com/invite/7N2ssKkdwM",
  grupo: "https://chat.whatsapp.com/Flqj42gmFieKoGurRxrK7X"
};

// ===== ENVIAR TEXTO =====
async function sendText(to, body) {
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

// ===== MENÚ =====
async function sendMenuList(to) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        body: {
          text: "🔥 *MU CORE*\nSelecciona una opción:"
        },
        action: {
          button: "Ver opciones",
          sections: [
            {
              title: "📌 SERVIDOR",
              rows: [
                { id: "info", title: "Información completa" },
                { id: "reset", title: "Reset y puntos" }
              ]
            },
            {
              title: "💎 COMPRAS",
              rows: [
                { id: "vip", title: "Comprar VIP" },
                { id: "donar", title: "Métodos de pago" }
              ]
            },
            {
              title: "🌐 COMUNIDAD",
              rows: [
                { id: "discord", title: "Unirse a Discord" },
                { id: "grupo", title: "Grupo WhatsApp" }
              ]
            },
            {
              title: "🚀 EXTRA",
              rows: [
                { id: "slots", title: "Ideas de Slots" },
                { id: "web", title: "Página web" }
              ]
            }
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

// ===== RESPUESTAS =====
async function handleResponse(msg, from) {

  switch (msg) {

    case "info":
      return sendText(from,
`╔═══ 🎮 *MU CORE* 🎮 ═══╗

⚔ Versión: ${DATA.version}
📊 EXP: ${DATA.exp}
💎 EXP VIP: ${DATA.expvip}
🎁 Drop: ${DATA.drop}

🗺 Spots: ${DATA.spots}
🧙 Buffers: ${DATA.buffers}

🧝 MG: ${DATA.mg}
🐎 DL: ${DATA.dl}
🥊 RF: ${DATA.rf}

👥 ${DATA.cuentas}
⚙ ${DATA.options}
❤️ HP: ${DATA.hp}

🔁 ${DATA.reset}
🚫 ${DATA.maxreset}
🏆 Level: ${DATA.maxlevel}

╚═══════════════════╝`);

    case "reset":
      return sendText(from,
`🔁 *RESET*

${DATA.reset}
🚫 ${DATA.maxreset}`);

    case "vip":
      return sendText(from,
`💎 *VIP PREMIUM*

✔ Mejor EXP
✔ Mejor Drop
✔ Eventos exclusivos

💰 Precio: ${DATA.vip}

📱 Yape: ${DATA.yape}
🪙 Binance: ${DATA.binance}

📸 Envía comprobante`);

    case "donar":
      return sendText(from,
`💰 *DONACIONES*

${DATA.donaciones}`);

    case "discord":
      return sendText(from,
`💬 *DISCORD*

${DATA.discord}`);

    case "grupo":
      return sendText(from,
`👥 *GRUPO WHATSAPP*

${DATA.grupo}`);

    case "web":
      return sendText(from,
`🌐 ${DATA.web}`);

    case "slots":
      return sendText(from,
`🎰 *IDEAS PARA CRECER*

✔ VIP limitado
✔ Eventos con premios
✔ Ranking competitivo
✔ Drop Hard
✔ Offhelper 8 horas`);

    case "menu":
      return sendMenuList(from);

    default:
      return sendText(from,
`❌ Opción no válida

Escribe *menu*`);
  }
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
    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const from = message.from;

    if (lastMessage[from] && Date.now() - lastMessage[from] < 1500) {
      return res.sendStatus(200);
    }
    lastMessage[from] = Date.now();

    let msg = "";

    if (message.type === "text") {
      msg = message.text.body.toLowerCase();
    } else if (message.type === "interactive") {
      msg =
        message.interactive?.list_reply?.id ||
        message.interactive?.button_reply?.id ||
        "";
    }

    console.log("📩", from, msg);

    if (msg.includes("hola") || msg === "menu") {
      await sendMenuList(from);
      return res.sendStatus(200);
    }

    if (message.type === "image" || (msg && msg.includes("pago"))) {
      pagosPendientes.push({ from });

      await sendText(from, "✅ Pago recibido, validando...");
      await sendText(
        ADMIN_NUMBER,
        `💰 NUEVO PAGO\n\n📱 ${from}`
      );

      return res.sendStatus(200);
    }

    await handleResponse(msg, from);

    res.sendStatus(200);
  } catch (err) {
    console.log("❌ ERROR:", err.response?.data || err.message);
    res.sendStatus(200);
  }
});

// ===== SERVER =====
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("🔥 BOT PRO LIMPIO Y ESTABLE EN " + PORT);
});
