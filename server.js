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
const userState = {};

// ===== DATA =====
const DATA = {
  version: "Season 6 - Hard",
  exp: "20x - 5x",
  type: "GMO",
  drop: "20%",
  spots: "4-5 mobs por zona",
  buffers: "Nivel 180",
  mg: "Nivel 220",
  dl: "Nivel 250",
  rf: "Nivel 300",
  cuentas: "3 cuentas por HID",
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
          text: `🔥 *MU CORE HARD S6* 🔥

Bienvenido aventurero ⚔

📌 Servidor PvP Hardcore
💎 Sin Pay2Win
🎁 Eventos diarios

Selecciona una opción:`
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
                { id: "grupo", title: "Grupo WhatsApp" },
                { id: "web", title: "Página web oficial" }
              ]
            },
            {
              title: "🚀 EXTRA",
              rows: [
                { id: "slots", title: "Ideas del servidor" }
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
`🔥 *MU CORE HARD - INFORMACIÓN*

⚔ Versión: ${DATA.version}
🧬 Tipo: ${DATA.type}
📊 Experiencia: ${DATA.exp}
🎁 Drop: ${DATA.drop}

🗺 Spots: ${DATA.spots}
🧙 Buffers: ${DATA.buffers}

🧝 MG: ${DATA.mg}
🐎 DL: ${DATA.dl}
🥊 RF: ${DATA.rf}

👥 ${DATA.cuentas}
⚙ ${DATA.options}
❤️ HP Monstruos: ${DATA.hp}

🔁 ${DATA.reset}
🚫 ${DATA.maxreset}
🏆 Level máximo: ${DATA.maxlevel}

🌐 Web oficial:
👉 ${DATA.web}
`);

    case "reset":
      return sendText(from,
`🔁 *SISTEMA DE RESET*

✔ ${DATA.reset}
✔ ${DATA.maxreset}

💡 Mientras más resets, más poder`);

    case "vip":
      return sendText(from,
`💎 *VIP PREMIUM MU CORE*

🚀 *VENTAJAS VIP*
🔥 EXP aumentada
🔥 Drop mejorado
🔥 Rate Mejorad
🔥 offattack Recolecta

💰 Precio: ${DATA.vip}

📲 Pagos:
👉 Yape: ${DATA.yape}
👉 Binance: ${DATA.binance}

📸 Envía tu comprobante aquí`);

    case "donar":
      return sendText(from,
`💰 *MÉTODOS DE DONACIÓN*

✔ ${DATA.donaciones}

🙏 Gracias por apoyar el servidor`);

    case "discord":
      return sendText(from,
`💬 *DISCORD OFICIAL*

Únete aquí:
👉 ${DATA.discord}`);

    case "grupo":
      return sendText(from,
`👥 *GRUPO WHATSAPP*

Únete aquí:
👉 ${DATA.grupo}`);

    case "web":
      return sendText(from,
`🌐 *PÁGINA OFICIAL*

Regístrate y juega:
👉 ${DATA.web}

🔥 Servidor activo
🎁 Eventos diarios
💎 VIP disponible`);

    case "slots":
      return sendText(from,
`🎰 *IDEAS DEL SERVIDOR*

✔ Eventos automáticos
✔ Rankings competitivos
✔ Sistema VIP balanceado
✔ Drop ajustado
✔ Juego activo 24/7`);

    case "menu":
      return sendMenuList(from);

    default:
      return sendText(from,
`❌ No entendí esa opción 😅

👉 Escribe *menu* para ver opciones`);
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
    userState[from] = userState[from] || {};

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

    // AUTO MENU
    if (!msg || msg.includes("hola") || msg === "menu") {
      await sendMenuList(from);
      return res.sendStatus(200);
    }

    // DETECTAR PAGOS
    if (message.type === "image" || (msg && msg.includes("pago"))) {
      pagosPendientes.push({ from });

      await sendText(from,
`💰 Pago recibido correctamente ✅

⏳ Estamos validando tu compra...

📩 Te avisaremos en breve`);

      await sendText(
        ADMIN_NUMBER,
        `💰 NUEVO PAGO\n📱 ${from}`
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
  console.log("🔥 BOT MU CORE PRO ACTIVO EN " + PORT);
});
