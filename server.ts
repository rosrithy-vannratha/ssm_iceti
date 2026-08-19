import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized or shared Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// AI Suggestion endpoint for task prioritization and approach
app.post("/api/ai/suggest", async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, currentPriority, dueDate } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json({ error: "Task title is required." });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Graceful fallback if GEMINI_API_KEY is not yet configured
      res.json({
        suggestion: {
          approach: [
            "Break down the task into smaller sub-tasks (15-30 min blocks).",
            "Eliminate distractions and start with the most challenging piece.",
            "Review work against your definition of done.",
          ],
          recommendedPriority: currentPriority || "medium",
          priorityReason: "Default assessment based on task description.",
          estimatedTime: "30-45 mins",
          proTip: "Apply the 2-minute rule: if any subtask takes less than 2 minutes, do it immediately.",
        },
      });
      return;
    }

    const prompt = `You are a world-class productivity and task execution coach.
Analyze the following task and provide actionable guidance on how to best approach, execute, and prioritize it:

Task Title: "${title.trim()}"
Task Description: "${description ? description.trim() : "None provided"}"
Current Assigned Priority: "${currentPriority || "None"}"
Due Date: "${dueDate || "None"}"

Respond with high-value, crisp, actionable recommendations.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "You are an expert productivity consultant. Provide concise, ultra-clear execution plans and realistic priority suggestions.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            approach: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2 to 4 concise, sequential action steps to complete this task effectively.",
            },
            recommendedPriority: {
              type: Type.STRING,
              enum: ["urgent", "high", "medium", "low"],
              description: "The optimal priority rating for this task.",
            },
            priorityReason: {
              type: Type.STRING,
              description: "A single sentence explaining why this priority level was chosen.",
            },
            estimatedTime: {
              type: Type.STRING,
              description: "Realistic estimated duration (e.g. '15-20 mins', '1-2 hours').",
            },
            proTip: {
              type: Type.STRING,
              description: "One high-leverage psychological or operational productivity tip.",
            },
          },
          required: ["approach", "recommendedPriority", "priorityReason", "estimatedTime", "proTip"],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from AI model.");
    }

    const parsedData = JSON.parse(responseText.trim());
    res.json({ suggestion: parsedData });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate AI task suggestion.",
      fallback: {
        approach: [
          "Clarify the final expected deliverable.",
          "Identify and remove any potential blockers first.",
          "Execute in a dedicated focus block.",
        ],
        recommendedPriority: "medium",
        priorityReason: "Automated baseline priority.",
        estimatedTime: "30 mins",
        proTip: "Start with a 5-minute timer to build momentum.",
      },
    });
  }
});

// Vite middleware & Static Serving
async function setupViteMiddleware() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

setupViteMiddleware().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Task Manager Server running on http://0.0.0.0:${PORT}`);
  });
});
