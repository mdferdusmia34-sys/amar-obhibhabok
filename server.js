const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/ask", async (req, res) => {
    try {
        const question = req.body.question || "";
        const image = req.body.image || "";
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "GEMINI_API_KEY পাওয়া যায়নি। Render Environment Variables পরীক্ষা করো।"
            });
        }

        if (!question && !image) {
            return res.status(400).json({
                error: "প্রশ্ন অথবা ছবি পাঠাও।"
            });
        }

        const prompt =
            "তুমি Amar Obhibhabok-এর একজন helpful Bangla Study Assistant।\n\n" +
            "ছাত্রের প্রশ্নের সহজ, পরিষ্কার এবং ধাপে ধাপে উত্তর দাও।\n\n" +
            "Math হলে হিসাব ধাপে ধাপে দেখাও।\n" +
            "Science হলে সহজ ভাষায় বোঝাও।\n" +
            "English হলে প্রয়োজন অনুযায়ী বাংলা ব্যাখ্যা দাও।\n" +
            "ছবিতে কোনো প্রশ্ন থাকলে ছবির প্রশ্নটি বুঝে সমাধান করো।\n\n" +
            (question
                ? "ছাত্রের প্রশ্ন:\n" + question
                : "ছাত্র একটি ছবি পাঠিয়েছে। ছবির প্রশ্নটি সমাধান করো।");

        const parts = [
            {
                text: prompt
            }
        ];

        if (image) {
            const partsOfImage = image.split(",");

            if (partsOfImage.length < 2) {
                return res.status(400).json({
                    error: "ছবির format সঠিক নয়।"
                });
            }

            const mimeType =
                image.match(/^data:(.*?);base64,/)?.[1] || "image/jpeg";

            const base64Image = partsOfImage[1];

            parts.push({
                inline_data: {
                    mime_type: mimeType,
                    data: base64Image
                }
            });
        }

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: parts
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API Error:", data);

            throw new Error(
                data?.error?.message || "Gemini API request failed"
            );
        }

        const answer =
            data?.candidates?.[0]?.content?.parts
                ?.map((part) => part.text || "")
                .join("") || "AI কোনো উত্তর দেয়নি।";

        res.json({
            answer: answer
        });

    } catch (error) {
        console.error("AI Error:", error);

        res.status(500).json({
            error: "AI response পাওয়া যায়নি। একটু পরে আবার চেষ্টা করো।"
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Amar Obhibhabok AI running on port ${PORT}`);
    console.log("AI: Gemini 2.5 Flash");
});
