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

// ===== DATA COMPLETA =====
const DATA = {
  tipo: "Slow (Servidor clásico)",
  exp: "x20-5x",
  drop: "20%",
  reset: "300 puntos por reset",
  maxreset: "3 resets máximo",
  cuentas: "3 cuentas por IP",
  vip: "$10 / 30 días",
  web: "https://mu-core.com/",
  yape: "51927675685",
  binance: "823927645",
  donaciones: "Yape, Plin, PayPal, Binance"
};

// ===== MENÚ LISTA PRO =====
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
          text: "👋 *MU CORE*\nSelecciona una opción:"
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
                { id: "vip", title: "Comprar VIP / WCoins" },
                { id: "donar", title: "Métodos de pago" }
              ]
            },
            {
              title: "🌐 EXTRA",
              rows: [
                { id: "web", title: "Página web" },
                { id: "admin", title: "Contactar admin" }
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
      return sendText(
        from,
        `📌 *INFORMACIÓN COMPLETA*

⚔ Tipo: ${DATA.tipo}
📊 EXP: ${DATA.exp}
🎁 Drop: ${DATA.drop}
👥 Cuentas: ${DATA.cuentas}`
      );

    case "reset":
      return sendText(
        from,
        `🔁 *RESET*

${DATA.reset}
🚫 ${DATA.maxreset}`
      );

    case "vip":
      return sendText(
        from,
        `💎 *VIP / WCOINS*

💰 Precio: ${DATA.vip}

📱 Yape: ${DATA.yape}
🪙 Binance ID: ${DATA.binance}

📸 Envía tu comprobante`
      );

    case "donar":
      return sendText(
        from,
        `💰 *DONACIONES*

${DATA.donaciones}`
      );

    case "web":
      return sendText(from, `🌐 ${DATA.web}`);

    case "admin":
      return sendText(from, `📞 Admin: ${ADMIN_NUMBER}`);

    default:
      return sendText(from, "Escribe *menu*");
  }
}

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

    // ANTI-SPAM
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

    // ===== MENU =====
    if (msg.includes("hola") || msg === "menu") {
      await sendMenuList(from);
      return res.sendStatus(200);
    }

    // ===== PAGOS =====
    if (message.type === "image" || msg.includes("pago")) {
      pagosPendientes.push({ from });

      await sendText(from, "✅ Pago recibido, validando...");
      await sendText(
        ADMIN_NUMBER,
        `💰 NUEVO PAGO\n\n📱 ${from}`
      );

      return res.sendStatus(200);
    }

    // ===== RESPUESTAS =====
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
  console.log("🔥 BOT PRO COMPLETO ACTIVO EN " + PORT);
});
