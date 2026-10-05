const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// Website files
app.use(express.static(path.join(__dirname)));

// ===============================
// AI API
// ===============================
app.post("/api/ask", async (req, res) => {
    try {
        const { question, image } = req.body;

        if (!question && !image) {
            return res.status(400).json({
                answer: "প্রশ্ন লিখে পাঠাও।"
            });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                answer: "GEMINI_API_KEY পাওয়া যাচ্ছে না। Render Environment Variables চেক করো।"
            });
        }

        const prompt = `
তুমি "Amar Obhibhabok" নামের একজন friendly Study Assistant।

তুমি SSC শিক্ষার্থীদের পড়াশোনায় সাহায্য করবে।

নিয়ম:
1. সবসময় সহজ ও পরিষ্কার বাংলায় উত্তর দেবে।
2. গণিতের প্রশ্ন হলে ধাপে ধাপে সমাধান দেখাবে।
3. শুধু উত্তর নয়, কেন এবং কীভাবে হয়েছে সেটাও বুঝিয়ে দেবে।
4. Science-এর প্রশ্ন সহজ ভাষায় বুঝিয়ে দেবে।
5. English-এর grammar, paragraph, composition ইত্যাদিতে সাহায্য করবে।
6. বাংলা বিষয়ের প্রশ্নেও সাহায্য করবে।
7. শিক্ষার্থী ভুল করলে সুন্দরভাবে সংশোধন করবে।
8. প্রয়োজন হলে উদাহরণ দেবে।
9. উত্তর খুব কঠিন ভাষায় দেবে না।

শিক্ষার্থীর প্রশ্ন:
${question || "ছবিতে দেওয়া প্রশ্নটি সমাধান করো।"}
`;

        const parts = [
            {
                text: prompt
            }
        ];

        // Image থাকলে Gemini-কে image পাঠানো হবে
        if (image) {
            const match = image.match(/^data:(.*?);base64,(.*)$/);

            if (match) {
                const mimeType = match[1];
                const base64Data = match[2];

                parts.push({
                    inline_data: {
                        mime_type: mimeType,
                        data: base64Data
                    }
                });
            }
        }

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
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
            console.error("Gemini Error:", data);

            return res.status(500).json({
                answer: "AI থেকে উত্তর পাওয়া যায়নি। একটু পরে আবার চেষ্টা করো।"
            });
        }

        const answer =
            data?.candidates?.[0]?.content?.parts
                ?.map(part => part.text || "")
                .join("") ||
            "AI কোনো উত্তর দিতে পারেনি।";

        res.json({
            answer: answer
        });

    } catch (error) {
        console.error("AI Error:", error);

        res.status(500).json({
            answer: "AI response পাওয়া যায়নি। একটু পরে আবার চেষ্টা করো।"
        });
    }
});

// ===============================
// Start Server
// ===============================
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Amar Obhibhabok AI running on port ${PORT}`);
    console.log("AI: Gemini 3.8 Flash");
});
