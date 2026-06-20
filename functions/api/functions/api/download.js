export async function onRequestPost(context) {
  // Ini adalah fungsi yang akan dipanggil saat Anda melakukan POST ke /api/download
  return new Response(JSON.stringify({ 
    status: "success", 
    message: "API Berhasil terhubung!" 
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
