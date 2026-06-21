export async function onRequest(context) {
  return new Response(JSON.stringify({ 
    status: "success", 
    message: "API Berhasil terhubung!" 
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
