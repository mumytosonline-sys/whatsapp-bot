require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// ===== VARIABLES =====
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// ===== ANTI SPAM =====
const lastMessage = {};

// ===== INFO DEL SERVIDOR =====
const DATA = {
  exp: "x20-5x",
  drop: "20%",
  vip: "$10 por 30 días",
  tipo: "Slow (Servidor clásico)",
  donaciones: "Yape, Plin, PayPal, Binance",
  cuentas: "3 cuentas por IP",
  reset: "30 puntos por reset",
  maxreset: "3 resets máximo",
  web: "https://mu-core.com/"
};

// ===== MENÚ =====
function getMenu() {
  return `👋 Bienvenido a *MU CORE*

📌 MENÚ:

1️⃣ Información del servidor  
2️⃣ Precio VIP  
3️⃣ Métodos de donación  
4️⃣ EXP del servidor  
5️⃣ Reset y puntos  
6️⃣ Web oficial  
7️⃣ Contactar ADM  

Escribe el número 👇`;
}

// ===== RESPUESTAS =====
function getResponse(text) {
  const msg = text.toLowerCase();

  if (msg.includes("hola") || msg.includes("menu")) {
    return getMenu();
  }

  if (msg === "1") {
    return `📌 *INFORMACIÓN DEL SERVIDOR*

⚔ Tipo: ${DATA.tipo}
📊 EXP: ${DATA.exp}
🎁 Drop: ${DATA.drop}
🔁 Reset: ${DATA.reset}
🚫 Max Reset: ${DATA.maxreset}
👥 Cuentas: ${DATA.cuentas}`;
  }

  if (msg === "2") {
    return `💎 *VIP*

Precio: ${DATA.vip}`;
  }

  if (msg === "3") {
    return `💰 *DONACIONES*

Métodos disponibles:
${DATA.donaciones}`;
  }

  if (msg === "4") {
    return `📊 EXP del servidor: ${DATA.exp}`;
  }

  if (msg === "5") {
    return `🔁 Reset:

Puntos: ${DATA.reset}
Máximo: ${DATA.maxreset}`;
  }

  if (msg === "6") {
    return `🌐 Web oficial:
${DATA.web}`;
  }

  if (msg === "7") {
    return `📞 Contacto:

Comunícate con el ADM para más información.`;
  }

  // PALABRAS CLAVE
  if (msg.includes("vip") || msg.includes("precio")) {
    return `💎 VIP: ${DATA.vip}`;
  }

  if (msg.includes("exp")) {
    return `📊 EXP: ${DATA.exp}`;
  }

  if (msg.includes("donar") || msg.includes("pago")) {
    return `💰 Donaciones: ${DATA.donaciones}`;
  }

  if (msg.includes("reset")) {
    return `🔁 ${DATA.reset} | Max: ${DATA.maxreset}`;
  }

  if (msg.includes("web")) {
    return `🌐 ${DATA.web}`;
  }

  return `⚠ No entendí tu mensaje.

Escribe *menu* para ver opciones o usa números (1-7).`;
}

// ===== VERIFY =====
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
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message) {
      const from = message.from;

      // ANTI-SPAM
      if (lastMessage[from] && Date.now() - lastMessage[from] < 2000) {
        return res.sendStatus(200);
      }
      lastMessage[from] = Date.now();

      // LEER MENSAJE (texto o botón)
      const text =
        message.text?.body ||
        message.button?.text ||
        message.interactive?.button_reply?.id ||
        "";

      if (!text) return res.sendStatus(200);

      console.log("Mensaje:", text);

      // SI ES MENU → BOTONES
      if (text.toLowerCase().includes("menu") || text.toLowerCase().includes("hola")) {
        await axios.post(
          `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
          {
            messaging_product: "whatsapp",
            to: from,
            type: "interactive",
            interactive: {
              type: "button",
              body: {
                text: "👋 Bienvenido a MU CORE\nSelecciona una opción:"
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
      } else {
        const reply = getResponse(text);

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

      console.log("Respondido");
    }

    res.sendStatus(200);
  } catch (err) {
    console.log("ERROR:", err.response?.data || err.message);
    res.sendStatus(200);
  }
});

// ===== SERVER =====
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("🚀 BOT PRO ACTIVO");
});
