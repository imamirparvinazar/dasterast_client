const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const prompt = require("prompt-sync")({ sigint: true });

// --- Your Configuration ---
const apiId = 32307741;
const apiHash = "ede22899a9a56ad775ce997d7e7f49be";
const TARGET_CHANNELS = ["@moallemannews"];
const INTERMEDIATE_BOT_USERNAME = "@dasterast_agent_bot";

let stringSession = new StringSession(
  "1BAAOMTQ5LjE1NC4xNjcuOTEAUHvrf+aRHPhI6OobyLv8UQlZVfuvGcWm5ANqSUiEwyCdcEYsZ2I580byMHwpUCcEl5PBwcfZ+pKwQinm8D7sCaELXMMxtEs11fK7vEWk9w8ORXFCyNKEJoUnlKFc7oz7UVxQyRCOqJEGIrvCfj/KBXIcLMqP9ZhrYhoUv6Mya+l3lnWie2/KDKa/X0Q7xho8psBt4RSgFJPOa1c+Imd+H094TLndSyRICi5S+lmOgQocsrKF/Ovti/OrJK48b6ZPE36WU/5H5nmmOdA0YbVVI+6lE2casT0zSIRjSyx4OdaHkqmnesZkOWwDPIed28TXNlBwNX1CB7PA8qm+DA/KVDM=",
);

async function startListening() {
  if (!stringSession.toString()) {
    console.log("Session not found. Starting interactive login...");
  }

  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () =>
      prompt("Enter phone number (e.g., 98912xxxxxxx): "),
    password: async () =>
      prompt("Enter 2FA password (if applicable, otherwise press Enter): "),
    phoneCode: async (isSent) => {
      console.log("Waiting for code...");
      return prompt("Enter the code received in Telegram: ");
    },
    onError: (err) => console.error("Login Error:", err),
  });

  const newSession = client.session.save();
  console.log("-----------------------------------------");
  console.log("✅ LOGIN SUCCESSFUL!");
  console.log("🔑 SAVE THIS SESSION STRING (برای استفاده‌های بعدی):");
  console.log(newSession);
  console.log("-----------------------------------------");

  console.log("Connection successful. Listening for new messages...");

  client.addEventHandler(
    async (event) => {
      const message = event.message;

      // --- Filter 1: Ignore Service Messages and undefined events ---
      if (!message || message.className === "MessageService") {
        return;
      }

      if (message.fwdFrom) {
        console.log(
          "⚠️ Message skipped: The content was already forwarded from another source.",
        );
        return;
      }

      console.log("-----------------------------------------");
      console.log(
        `New ORIGINAL message received in channel: ${message.chatId || message.peerId}`,
      );
      console.log(`Sender ID: ${message.senderId}`);
      console.log(
        `Text: ${message.message?.substring(0, 100) || "No text/media attached"}...`,
      );
      console.log("Time: " + Date.now().toString());
      console.log("-----------------------------------------");

      console.log(`Forwarding to bot ${INTERMEDIATE_BOT_USERNAME}...`);

      try {
        const bot = await client.getEntity(INTERMEDIATE_BOT_USERNAME);
        await client.forwardMessages(bot, { messages: [message] });
        console.log("Message successfully forwarded.");
      } catch (error) {
        console.error("Failed to forward message:", error.message);
        console.error(
          "Please ensure the bot username is correct and the user client has started a chat with the bot.",
        );
      }
    },
    new NewMessage({
      chats: TARGET_CHANNELS,
    }),
  );
}

startListening();
