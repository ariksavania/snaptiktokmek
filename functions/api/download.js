export async function onRequestPost(context) {
    const { request } = context;
    
    try {
        const { url } = await request.json();

        if (!url) {
            return new Response(JSON.stringify({ success: false, error: 'URL tidak boleh kosong!' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const common_headers = {
            "Host": "ssstik.io",
            "Connection": "keep-alive",
            "sec-ch-ua-platform": "\"Android\"",
            "User-Agent": "Mozilla/5.0 (Linux; Android 14; V2201 Build/UP1A.231005.007)",
            "Accept": "*/*",
            "X-Requested-With": "mark.via.gp",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-Mode": "cors",
            "Referer": "https://ssstik.io/id",
        };

        let user_ip = "140.213.39.86";
        let user_loc = "ID";

        // 1. Ambil Trace IP & Lokasi
        try {
            const trace_response = await fetch("https://ssstik.io/cdn-cgi/trace", {
                headers: common_headers
            }).then(res => res.text());

            if (trace_response) {
                const lines = trace_response.trim().split("\n");
                for (const line of lines) {
                    const parts = line.split("=");
                    if (parts.length === 2) {
                        if (parts[0] === 'ip') user_ip = parts[1].trim();
                        if (parts[0] === 'loc') user_loc = parts[1].trim();
                    }
                }
            }
        } catch (e) {}

        // 2. Ambil token tt
        let token_tt = "Y0FLY3E_";
        const html_homepage = await fetch("https://ssstik.io/id", {
            headers: common_headers
        }).then(res => res.text());

        const matches1 = html_homepage.match(/name="tt"\s+value="([^"]+)"/);
        const matches2 = html_homepage.match(/tt\s*=\s*["']([^"']+)["']/);
        if (matches1) {
            token_tt = matches1[1];
        } else if (matches2) {
            token_tt = matches2[1];
        }

        // 3. Post data ke SSSTik
        const dl_headers = {
            ...common_headers,
            "HX-Trigger": "_gcaptcha_pt",
            "HX-Target": "target",
            "HX-Current-URL": "https://ssstik.io/id",
            "HX-Request": "true",
            "Content-Type": "application/x-www-form-urlencoded"
        };

        const debug_param = "ab=1&loc=" + user_loc + "&ip=" + user_ip;
        const post_data = new URLSearchParams({
            id: url,
            locale: "id",
            tt: token_tt,
            debug: debug_param
        }).toString();

        const responseHtml = await fetch("https://ssstik.io/abc?url=dl", {
            method: "POST",
            headers: dl_headers,
            body: post_data
        }).then(res => res.text());

        // 4. Scrape data dengan Regular Expressions (Regex) - Bebas dependensi Node.js / Cheerio
        const usernameMatch = responseHtml.match(/id="avatarAndTextUsual"[\s\S]*?<h2>\s*([\s\S]*?)\s*<\/h2>/i);
        const username = usernameMatch ? usernameMatch[1].trim() : "Unknown";

        const captionMatch = responseHtml.match(/class="[^"]*maintext[^"]*">([\s\S]*?)<\/p>/i);
        const caption = captionMatch ? captionMatch[1].trim() : "-";

        const videoMatch = responseHtml.match(/<a\s+[^>]*class="[^"]*without_watermark[^"]*"[^>]*href="([^"]+)"/i) || 
                           responseHtml.match(/<a\s+[^>]*href="([^"]+)"[^>]*class="[^"]*without_watermark[^"]*"/i);
        const video_url = videoMatch ? videoMatch[1] : null;

        const musicMatch = responseHtml.match(/<a\s+[^>]*class="[^"]*music[^"]*"[^>]*href="([^"]+)"/i) || 
                           responseHtml.match(/<a\s+[^>]*href="([^"]+)"[^>]*class="[^"]*music[^"]*"/i);
        const music_url = musicMatch ? musicMatch[1] : null;

        const avatarBlockMatch = responseHtml.match(/id="avatarAndTextUsual"[\s\S]*?<img\s+[^>]*src="([^"]+)"/i);
        const avatar = avatarBlockMatch ? avatarBlockMatch[1] : null;

        let thumbnail = null;
        const resultOverlayMatch = responseHtml.match(/class="[^"]*result_overlay[^"]*"[\s\S]*?<img\s+[^>]*src="([^"]+)"/i);
        if (resultOverlayMatch) {
            thumbnail = resultOverlayMatch[1];
        } else {
            const authorMatch = responseHtml.match(/<img\s+[^>]*class="[^"]*result_author[^"]*"[^>]*src="([^"]+)"/i) ||
                                responseHtml.match(/<img\s+[^>]*src="([^"]+)"[^>]*class="[^"]*result_author[^"]*"/i);
            thumbnail = authorMatch ? authorMatch[1] : avatar;
        }

        if (!video_url) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Gagal mendapatkan tautan video. Pastikan tautan TikTok Anda benar.'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            username,
            caption,
            video_url,
            music_url,
            avatar,
            thumbnail
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
