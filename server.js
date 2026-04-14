require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// ===== VARIABLES =====
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// ===== VERIFY WEBHOOK =====
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
    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message) {
      const from = message.from;
      const text = message.text?.body || "";

      console.log("📩 Mensaje:", text);

      // 👉 RESPUESTA FIJA (GRATIS)
      const reply = "Hola 👋 soy tu bot, estoy funcionando correctamente 🚀";

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

      console.log("✅ Respondido");
    }

    res.sendStatus(200);
  } catch (err) {
    console.log("❌ ERROR COMPLETO:", err.response?.data || err.message);
    res.sendStatus(200);
  }
});

// ===== ROOT =====
app.get("/", (req, res) => {
  res.send("OK");
});

// ===== SERVER =====
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("🚀 Servidor corriendo en puerto", PORT);
});
