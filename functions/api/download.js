export async function onRequestPost(context) {
  try {
    // Mengambil data dari request yang dikirim bot Anda
    const { url } = await context.request.json();

    if (!url) {
      return new Response(JSON.stringify({ status: "error", message: "URL tidak ditemukan" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // --- TEMPAT LOGIKA DOWNLOAD ANDA ---
    // Di sini Anda bisa menambahkan kode untuk memproses link TikTok
    // Contoh respons sukses:
    return new Response(JSON.stringify({ 
      status: "success", 
      message: "API berhasil memproses link",
      received_url: url
    }), {
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
