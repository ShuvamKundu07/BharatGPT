import axios from "axios"
import Chat from "../models/Chat.js"
import User from "../models/User.js"
import imagekit from "../configs/imageKit.js"
import openai from "../configs/openai.js"


// Text-based AI Chat Message Controller

export const textMessageController = async(req, res) => {
    try {
        const userId = req.user._id;
        const { chatId, prompt } = req.body;

        // 1. Check credits
        if (req.user.credits < 1) {
            return res.json({ success: false, message: "You don't have enough credits to use this feature" });
        }

        // 2. Find Chat
        const chat = await Chat.findOne({ userId, _id: chatId });
        if (!chat) {
            return res.json({ success: false, message: "Chat session not found" });
        }

        // 3. Push user message locally
        chat.messages.push({ role: "user", content: prompt, timestamp: Date.now(), isImage: false });

        // 4. BULLETPROOF OAI MAPPING: Ensure roles are strictly user/assistant/system 
        // and content is explicitly cast to a clean string. Skip any corrupted items.
        const cleanMessages = chat.messages
            .filter(m => m.role && m.content)
            .map(m => ({
                role: m.role === "user" ? "user" : "assistant", 
                content: String(m.content)
            }));

        // 5. Fetch from OpenAI
        const response = await openai.chat.completions.create({
            model: "gemini-2.5-flash",
            messages: cleanMessages,
        });

        // 6. Structure response safely
        const aiMessage = response.choices[0].message;
        const reply = {
            role: aiMessage.role || "assistant",
            content: aiMessage.content || "",
            timestamp: Date.now(),
            isImage: false
        };

        // 7. Push response to database array
        chat.messages.push(reply);
        
        // 8. Execute all database writes FIRST
        await chat.save();
        await User.updateOne({ _id: userId }, { $inc: { credits: -1 } }); 

        // 9. Send response to frontend ONLY after DB writes succeed flawlessly!
        return res.json({ success: true, reply });

    } catch (error) {
        console.error("Text Controller Absolute Failure:", error.message);
        return res.json({ success: false, message: error.message });
    }
}


// Image Generation Message Controller 
export const imageMessageController = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Check credits
        if (req.user.credits < 2) {
            return res.json({ success: false, message: "You don't have enough credits to use this feature" });
        }
        const { prompt, chatId, isPublished } = req.body;

        // 2. Find Chat
        const chat = await Chat.findOne({ userId, _id: chatId });
        if (!chat) {
            return res.json({ success: false, message: "Chat session not found" });
        }

        // 3. Push user message locally
        chat.messages.push({
            role: "user",
            content: prompt,
            timestamp: Date.now(),
            isImage: false
        });

        // 4. Encode prompt & construct generation URL
        const encodedPrompt = encodeURIComponent(prompt);
        const generatedImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/bharatgpt/${Date.now()}.png?tr=w-800,h-800`;

        // 5. Trigger generation & fetch from ImageKit
        const aiImageResponse = await axios.get(generatedImageUrl, { responseType: "arraybuffer" });

        // 6. Convert to Base64
        const base64Image = `data:image/png;base64,${Buffer.from(aiImageResponse.data, "binary").toString('base64')}`;

        // 7. Upload to ImageKit Media Library
        const uploadResponse = await imagekit.upload({
            file: base64Image,
            fileName: `${Date.now()}.png`,
            folder: "bharatgpt"
        });

        const reply = {
            role: 'assistant',
            content: uploadResponse.url,
            timestamp: Date.now(),
            isImage: true,
            isPublished
        };

        // 8. PUSH & SAVE TO DATABASE FIRST!
        chat.messages.push(reply);
        await chat.save();
        await User.updateOne({ _id: userId }, { $inc: { credits: -2 } });

        // 9. Now safely respond to the frontend
        return res.json({ success: true, reply });

    } catch (error) {
        console.error("Image Controller Failure:", error.message);
        if (error.status === 429) {
            return res.json({
                success: false,
                message: "AI is busy. Please wait a few seconds."
            });
        }
        return res.json({ success: false, message: error.message });
    }
}