const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

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

        if (!question && !image) {
            return res.status(400).json({
                error: "প্রশ্ন অথবা ছবি পাঠাও।"
            });
        }

        let prompt =
            "তুমি Amar Obhibhabok-এর একজন helpful Bangla Study Assistant।\n\n" +
            "ছাত্রের প্রশ্নের সহজ, পরিষ্কার এবং ধাপে ধাপে উত্তর দাও।\n\n" +
            "Math হলে হিসাব ধাপে ধাপে দেখাও।\n" +
            "Science হলে সহজ ভাষায় বোঝাও।\n" +
            "English হলে প্রয়োজন অনুযায়ী বাংলা ব্যাখ্যা দাও।\n\n";

        if (question) {
            prompt += "ছাত্রের প্রশ্ন:\n" + question;
        }

        const requestBody = {
            model: image ? "qwen2.5vl:3b" : "qwen2.5:0.5b",
            prompt: prompt,
            stream: false
        };

        if (image) {
            const base64Image = image.split(",")[1];
            requestBody.images = [base64Image];
        }

        const response = await fetch(
            "http://127.0.0.1:11434/api/generate",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            }
        );

        if (!response.ok) {
            throw new Error("Ollama error: " + response.status);
        }

        const data = await response.json();

        res.json({
            answer: data.response || "AI কোনো উত্তর দেয়নি।"
        });

    } catch (error) {
        console.error("AI Error:", error);

        res.status(500).json({
            error: "AI response পাওয়া যায়নি। Ollama চালু আছে কিনা দেখো।"
        });
    }
});

app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
    console.log("Amar Obhibhabok AI running on port 3000");
    console.log("Text AI: qwen2.5:0.5b");
    console.log("Vision AI: qwen2.5vl:3b");
});