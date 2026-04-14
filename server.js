const express = require("express");
const app = express();

app.use(express.json());

// 🔐 TOKEN (Railway lo toma de Variables)
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// ✅ VERIFICACIÓN DE META (IMPORTANTE)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WEBHOOK VERIFICADO");
    res.status(200).send(challenge);
  } else {
    console.log("❌ ERROR DE VERIFICACIÓN");
    res.sendStatus(403);
  }
});

// 📩 RECIBIR MENSAJES DE WHATSAPP
app.post("/webhook", (req, res) => {
  console.log("📩 Mensaje recibido:");
  console.log(JSON.stringify(req.body, null, 2));

  res.sendStatus(200);
});

// 🚀 SERVIDOR
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("🚀 Servidor corriendo en puerto", PORT);
});
