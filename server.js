import express from 'express';
import * as cheerio from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint for TikTok download extraction
app.post('/api/download', async (req, res) => {
    const { url } = req.body;
    console.log(`[INFO] Request masuk: /api/download untuk URL: ${url}`);

    if (!url) {
        console.log(`[WARN] Request ditolak: URL kosong`);
        return res.status(400).json({ success: false, error: 'URL tidak boleh kosong!' });
    }

    try {
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

        // 1. Trace IP and location
        try {
            const trace_response = await fetch("https://ssstik.io/cdn-cgi/trace", {
                headers: common_headers
            }).then(res => res.text()).catch(() => null);

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
        } catch (e) {
            // Ignored, fallback to defaults
        }

        // 2. Fetch Homepage to Extract tt token
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

        // 3. Post Payload to SSSTik
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

        // 4. Parse Response HTML using Cheerio
        const $ = cheerio.load(responseHtml);

        const username = $('#avatarAndTextUsual h2').text().trim() || "Unknown";
        const caption = $('p.maintext').text().trim() || "-";
        
        const video_url = $('a.without_watermark').attr('href') || null;
        const music_url = $('a.music').attr('href') || null;

        const avatar = $('#avatarAndTextUsual img').attr('src') || null;
        const thumbnail = $('.result_overlay img').attr('src') || $('img.result_author').attr('src') || avatar;

        if (!video_url) {
            return res.status(404).json({
                success: false,
                error: 'Gagal mendapatkan tautan video. Pastikan tautan TikTok Anda benar dan video tidak bersifat privat.'
            });
        }

        return res.json({
            success: true,
            username,
            caption,
            video_url,
            music_url,
            avatar,
            thumbnail
        });

    } catch (error) {
        console.error("Download error:", error);
        return res.status(500).json({
            success: false,
            error: 'Terjadi kesalahan internal pada server saat memproses permintaan Anda.'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
