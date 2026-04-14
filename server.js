const express = require("express");
const app = express();

app.use(express.json());

// 🔐 TOKEN (desde Railway Variables)
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// ✅ VERIFICACIÓN DE META
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WEBHOOK VERIFICADO");
    return res.status(200).send(challenge);
  } else {
    console.log("❌ ERROR DE VERIFICACIÓN");
    return res.sendStatus(403);
  }
});

// 📩 RECIBIR MENSAJES DE WHATSAPP
app.post("/webhook", (req, res) => {
  console.log("📩 Mensaje recibido:");
  console.log(JSON.stringify(req.body, null, 2));

  res.sendStatus(200);
});

// 🧪 RUTA DE PRUEBA (IMPORTANTE)
app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀");
});

// 🚀 SERVIDOR (NO CAMBIAR ESTO)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Servidor corriendo en puerto", PORT);
});
