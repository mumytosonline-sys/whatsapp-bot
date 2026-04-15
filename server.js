require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// ===== VARIABLES =====
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// ===== CONFIG ADMIN =====
const ADMIN_NUMBER = "51927675685"; // cambia esto

// ===== MEMORIA =====
const lastMessage = {};
const pagosPendientes = [];

// ===== DATA =====
const DATA = {
  exp: "x20-5x",
  drop: "20%",
  vip: "$10 por 30 días",
  tipo: "Slow",
  donaciones: "Yape, Plin, PayPal, Binance",
  cuentas: "3 cuentas por IP",
  reset: "300 puntos por reset",
  maxreset: "3 resets máximo",
  web: "https://mu-core.com/",
  yape: "51927675685",
  binance: "823927645"
};

// ===== MENÚ =====
function getMenu() {
  return `📌 *MENÚ MU CORE*

1️⃣ Info servidor  
2️⃣ Comprar VIP  
3️⃣ Donaciones  
4️⃣ Web  
5️⃣ Admin  

Escribe el número 👇`;
}

// ===== RESPUESTAS =====
function getResponse(msg) {
  switch (msg) {
    case "1":
      return `📌 *INFO*

⚔ Tipo: ${DATA.tipo}
📊 EXP: ${DATA.exp}
🎁 Drop: ${DATA.drop}
🔁 Reset: ${DATA.reset}
🚫 Max Reset: ${DATA.maxreset}`;

    case "2":
      return `💎 *VIP*

📱 Yape: ${DATA.yape}
🪙 Binance: ${DATA.binance}

Envía comprobante 📸`;

    case "3":
      return `💰 ${DATA.donaciones}`;

    case "4":
      return `🌐 ${DATA.web}`;

    case "5":
      return `📞 Admin: ${ADMIN_NUMBER}`;

    default:
      return "Escribe *menu*";
  }
}

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

// ===== MENÚ BOTONES =====
async function sendMenu(to) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: "👋 Bienvenido a MU CORE"
          },
          action: {
            buttons: [
              { type: "reply", reply: { id: "1", title: "Info" } },
              { type: "reply", reply: { id: "2", title: "VIP" } },
              { type: "reply", reply: { id: "3", title: "Donar" } }
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
  } catch (e) {
    await sendMessage(to, getMenu());
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
    const entry = req.body.entry?.[0];
    if (!entry) return res.sendStatus(200);

    const change = entry.changes?.[0];
    const message = change?.value?.messages?.[0];
    if (!message) return res.sendStatus(200);

    const from = message.from;

    // ANTI-SPAM
    if (lastMessage[from] && Date.now() - lastMessage[from] < 1500) {
      return res.sendStatus(200);
    }
    lastMessage[from] = Date.now();

    // LEER MENSAJE BIEN (FIX IMPORTANTE)
    let text = "";

    if (message.type === "text") {
      text = message.text.body;
    } else if (message.type === "image") {
      text = message.image.caption || "imagen";
    } else if (message.type === "interactive") {
      text =
        message.interactive?.button_reply?.id ||
        message.interactive?.list_reply?.id ||
        "";
    }

    if (!text) return res.sendStatus(200);

    const msg = text.toLowerCase();

    console.log("📩", from, msg);

    // DETECTAR PAGOS
    if (
      message.type === "image" ||
      msg.includes("pago") ||
      msg.includes("comprobante")
    ) {
      pagosPendientes.push({ from, fecha: new Date() });

      await sendMessage(from, "✅ Pago recibido, validando...");

      await sendMessage(
        ADMIN_NUMBER,
        `💰 NUEVO PAGO\n\n📱 ${from}\n📝 ${msg}`
      );

      return res.sendStatus(200);
    }

    // ADMIN
    if (from === ADMIN_NUMBER && msg === "admin") {
      if (pagosPendientes.length === 0) {
        return await sendMessage(from, "No hay pagos");
      }

      let lista = "📋 PAGOS:\n\n";
      pagosPendientes.forEach((p, i) => {
        lista += `${i + 1}. ${p.from}\n`;
      });

      return await sendMessage(from, lista);
    }

    // MENÚ
    if (msg.includes("hola") || msg === "menu") {
      await sendMenu(from);
      return res.sendStatus(200);
    }

    // RESPUESTA
    const reply = getResponse(msg);
    await sendMessage(from, reply);

    res.sendStatus(200);
  } catch (err) {
    console.log("❌ ERROR:", err.response?.data || err.message);
    res.sendStatus(200);
  }
});

// ===== SERVER =====
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("🔥 BOT FUNCIONANDO EN " + PORT);
});
