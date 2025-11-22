// You will replace this URL later when your Cloud Function is ready
const FUNCTION_URL = "https://your-cloud-function-url-here";

export async function sendMessageToAI(text) {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  const data = await res.json();
  return data.reply;
}
