require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// ===== VARIABLES =====
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// ===== ANTI-SPAM =====
const lastMessage = {};

// ===== INFO DEL SERVIDOR =====
const DATA = {
  exp: "x20-5x",
  drop: "20%",
  vip: "$10 por 30 días",
  tipo: "Slow (Servidor clásico)",
  donaciones: "Yape, Plin, PayPal, Binance",
  cuentas: "3 cuentas por HID",
  reset: "300 puntos por reset",
  maxreset: "3 resets máximo",
  web: "https://mu-core.com/",
  yape: "51927675685",
  binance: "823927645"
};

// ===== MENÚ TEXTO =====
function getMenuText() {
  return `👋 Bienvenido a *MU CORE*

📌 MENÚ:

1️⃣ Información del servidor  
2️⃣ Comprar VIP / Wcoins  
3️⃣ Métodos de donación  
4️⃣ EXP del servidor  
5️⃣ Reset y puntos  
6️⃣ Web oficial  
7️⃣ Contactar ADM  

Escribe el número 👇`;
}

// ===== RESPUESTAS =====
function getResponse(msg) {
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
    return `💎 *COMPRA VIP / WCOINS*

💳 Métodos de pago:

📱 Yape: ${DATA.yape}
🪙 Binance ID: ${DATA.binance}

📩 Envía:
- Captura del pago 📸  
- o TXID  

⚡ Entrega rápida`;
  }

  if (msg === "3") {
    return `💰 *DONACIONES*

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

  return "Escribe *menu* para ver opciones";
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

// ===== BOTONES (CON SEGURIDAD) =====
async function sendButtonsSafe(to) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
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
  } catch (err) {
    console.log("⚠ Error botones → envío texto");
    await sendMessage(to, getMenuText());
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
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return res.sendStatus(200);

    const from = message.from;

    // ANTI-SPAM
    if (lastMessage[from] && Date.now() - lastMessage[from] < 1500) {
      return res.sendStatus(200);
    }
    lastMessage[from] = Date.now();

    // LEER MENSAJE (TEXTO + IMAGEN)
    const text =
      message.text?.body ||
      message.image?.caption ||
      message.interactive?.button_reply?.id ||
      "";

    const msg = text.toLowerCase();

    console.log("📩 MSG:", from, msg);

    // ===== DETECTAR COMPROBANTE =====
    if (
      message.image ||
      msg.includes("pago") ||
      msg.includes("tx") ||
      msg.includes("comprobante")
    ) {
      await sendMessage(
        from,
        "📩 Comprobante recibido ✅\n\nUn administrador validará tu pago y te entregará tus Wcoins."
      );
      return res.sendStatus(200);
    }

    // ===== MENU =====
    if (msg.includes("hola") || msg === "menu") {
      await sendButtonsSafe(from);
      return res.sendStatus(200);
    }

    // ===== RESPUESTA NORMAL =====
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
  console.log("🔥 BOT MU CORE ACTIVO EN " + PORT);
});
