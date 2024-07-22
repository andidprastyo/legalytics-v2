import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function getGroqChatCompletion() {
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: "Explain the importance of fast language models",
      },
    ],
    model: "llama3-8b-8192",
  });
}

export async function main() {
  const chatCompletion = await getGroqChatCompletion();
  // Return the completion content
  return chatCompletion.choices[0]?.message?.content || "";
}
