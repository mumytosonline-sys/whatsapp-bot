const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const TOKEN = "TU_ACCESS_TOKEN";
const PHONE_ID = "TU_PHONE_NUMBER_ID";
const VERIFY_TOKEN = "12345";

app.get("/", (req, res) => {
  res.send("Bot activo 🚀");
});

app.post("/webhook", async (req, res) => {
  const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (msg) {
    const from = msg.from;
    const text = msg.text?.body;

    await axios.post(
      `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: from,
        text: { body: "🔥 Bot: " + text },
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  }

  res.sendStatus(200);
});

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.listen(3000, () => console.log("Servidor activo"));
