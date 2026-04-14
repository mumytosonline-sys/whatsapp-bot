require("dotenv").config();
const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// ===== DATA =====
function getData() {
  return JSON.parse(fs.readFileSync("data.json"));
}

// ===== PANEL ADMIN =====
app.get("/admin", (req, res) => {
  const d = getData();

  res.send(`
  <h2>Panel Mu Core</h2>
  <form method="POST">
    EXP: <input name="exp" value="${d.exp}" /><br>
    VIP: <input name="vip" value="${d.vip}" /><br>
    Drop: <input name="drop" value="${d.drop}" /><br>
    Tipo: <input name="tipo" value="${d.tipo}" /><br>
    Donaciones: <input name="donaciones" value="${d.donaciones}" /><br>
    Cuentas: <input name="cuentas" value="${d.cuentas}" /><br>
    <button>Guardar</button>
  </form>
  `);
});

app.post("/admin", (req, res) => {
  fs.writeFileSync("data.json", JSON.stringify(req.body, null, 2));
  res.send("Guardado ✅");
});

// ===== MENÚ BOTONES =====
async function sendMenu(to) {
  await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to: to,
      type: "interactive",
      interactive: {
        type: "list",
        body: {
          text: "📋 MENÚ MU CORE\nSelecciona una opción 👇"
        },
        action: {
          button: "Ver opciones",
          sections: [
            {
              title: "Opciones",
              rows: [
                { id: "info", title: "📋 Información" },
                { id: "eventos", title: "🎉 Eventos" },
                { id: "comandos", title: "⚔️ Comandos" },
                { id: "descarga", title: "⬇️ Descargar" },
                { id: "soporte", title: "🛠 Soporte" }
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
function getResponse(text) {
  const d = getData();

  if (text === "info") {
    return `📋 INFO MU CORE

⚡ EXP: ${d.exp}
🎁 Drop: ${d.drop}
💰 VIP: ${d.vip}
🐢 Tipo: ${d.tipo}
💳 Donaciones: ${d.donaciones}
📜 Cuentas: ${d.cuentas}`;
  }

  if (text === "eventos") {
    return "🎉 Eventos: Blood Castle, Devil Square, Chaos Castle; Etc";
  }

  if (text === "comandos") {
    return "⚔️ /Str /Agi/post";
  }

  if (text === "descarga") {
    return "⬇️ https://mu-core.com/";
  }

  if (text === "soporte") {
    return "🛠 Contacta al ADM";
  }

  return "Escribe *menu* para ver opciones";
}

// ===== WEBHOOK VERIFY =====
app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
    return res.send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

// ===== MENSAJES =====
app.post("/webhook", async (req, res) => {
  try {
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!msg) return res.sendStatus(200);

    const from = msg.from;

    let text = "";

    if (msg.text) text = msg.text.body.toLowerCase();

    if (msg.interactive?.list_reply) {
      text = msg.interactive.list_reply.id;
    }

    // MENÚ
    if (text.includes("hola") || text === "menu") {
      await sendMenu(from);
      return res.sendStatus(200);
    }

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

    res.sendStatus(200);
  } catch (e) {
    console.log(e.message);
    res.sendStatus(200);
  }
});

app.listen(process.env.PORT || 8080, () => {
  console.log("🚀 BOT PRO ACTIVO");
});
