require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// 🔥 ANTI-CRASH
process.on("uncaughtException", (err) => {
  console.error("Error global:", err.message);
});

process.on("unhandledRejection", (err) => {
  console.error("Error promesa:", err);
});

// 🔐 VARIABLES
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "test";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 🧠 IA SEGURA
async function getAIResponse(text) {
  if (!OPENAI_API_KEY) {
    console.log("⚠️ No hay API KEY");
    return "IA no configurada";
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: text }]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices?.[0]?.message?.content || "Sin respuesta 🤖";
  } catch (err) {
    console.error("❌ ERROR IA:", err.response?.data || err.message);
    return "Error IA";
  }
}

// 🔁 VERIFY WEBHOOK
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

// 📩 WEBHOOK
app.post("/webhook", async (req, res) => {
  try {
    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message) {
      const from = message.from;
      const text = message.text?.body || "";

      console.log("📩:", text);

      const reply = await getAIResponse(text);

      if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
        console.log("⚠️ Falta token o phone id");
        return res.sendStatus(200);
      }

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
    console.error("❌ ERROR WEBHOOK:", err.message);
    res.sendStatus(200);
  }
});

// 🟢 ROOT
app.get("/", (req, res) => {
  res.send("OK");
});

// 🚀 SERVER
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("🚀 Server en puerto", PORT);
});
