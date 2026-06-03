import { GoogleGenerativeAI } from '@google/generative-ai';
import Message from '../models/Message.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const THERAPIST_SYSTEM_PROMPT = `
You are MindWell AI Therapist.
Your role is to act as a warm, emotionally intelligent mental wellness companion.
You are not a doctor and you never claim to diagnose conditions.
Your goal is to help users:
* understand emotions
* reflect on experiences
* manage stress
* build healthy coping habits
* improve self-awareness

Behavior rules:
* Speak naturally like a caring human.
* Never sound robotic.
* Never sound like customer support.
* Never repeat the same phrases.
* Never repeat the same response structure.
* Use conversation history.
* Ask thoughtful follow-up questions.
* Adapt tone based on the user's emotional state.
* Keep responses conversational.
* Response length should vary naturally.
* Remember context from previous messages.
* Be encouraging without sounding fake.

If the user expresses: stress, anxiety, loneliness, sadness, burnout, frustration, then explore the emotion before giving advice.
If the user is happy: celebrate progress, encourage reflection.
If self-harm or crisis signals appear: immediately switch to crisis-support mode, provide the requested India-specific helplines, and encourage contacting trusted people. Use a calm, supportive, and non-judgmental tone.

Quality Rules:
* Be complete, never cut off.
* No duplicate sentences or repeated paragraphs.
* Avoid generic filler like "I understand" or "I'm here for you" if used too frequently.
`;

// In-Memory Storage Fallback
const memoryStorage = [];

const FALLBACK_RESPONSES = {
    lonely: [
        "That lonely feeling can sit really heavily, especially when it feels like no one fully notices what you’re carrying. I’m here with you in this moment. When did this feeling start getting stronger today?",
        "Feeling isolated is tough. I want you to know I'm right here with you. What do you think would help you feel a bit more connected right now?",
        "It’s okay to feel lonely; many of us do, even if we don't say it. I'm listening. Is there a specific person or memory you're missing?"
    ],
    anxious: [
        "Anxiety can feel like a storm inside. Let's take a deep breath together. You're safe here. What's one thing you can see and touch right now to help ground yourself?",
        "It sounds like your mind is racing. That can be so exhausting. I’m here. What’s the biggest 'what-if' that’s weighing on you today?",
        "That tight feeling in your chest is really difficult to sit with. I'm right here. Can we try to describe what the anxiety would look like if it were a shape?"
    ],
    stressed: [
        "You're carrying a lot right now. It's no wonder you feel this way. I'm here to help you unpack some of that. Which part of your day felt the heaviest?",
        "Stress can make everything feel like a mountain. Let's break it down together. What's one small thing we can focus on right now?",
        "I hear how overwhelmed you are. It’s okay to take a pause. If you could set one thing aside just for ten minutes, what would it be?"
    ],
    sad: [
        "I'm so sorry you're feeling this sadness. It’s okay to not be okay. I'm here with you. What do you feel like your sadness is trying to tell you right now?",
        "It sounds like things are really heavy. I’m here to listen, for as long as you need. When was the last time you felt you could just 'be' without this weight?",
        "Sadness can feel like a fog. I'm right here in it with you. Is there a particular thought that brought this feeling forward today?"
    ],
    tired: [
        "You sound completely drained. It’s hard to keep going when your battery is so low. I'm here for you. Have you been able to find even five minutes for yourself today?",
        "Exhaustion isn't just about sleep; it's about the heart too. I hear you. What's been taking the most energy from you lately?",
        "It’s okay to be tired. Rest is productive too. I’m here. If you could close your eyes for a moment, what’s the first peaceful place you imagine?"
    ],
    burnout: [
        "Burnout is your spirit's way of saying it needs a real break. I'm here to support you through this. When did you first notice that things were feeling 'too much'?",
        "It feels like you’ve been running on empty for a long time. I hear how hard that is. I’m right here. What would 'doing nothing' look like for you today?",
        "That 'done' feeling is so loud right now. I'm listening. If we could change just one small part of your routine, what would feel most relieving?"
    ],
    happy: [
        "It’s wonderful to hear that you’re feeling good! I’m so happy for you. What’s one thing that contributed to this bright spot today?",
        "I love this energy! You deserve these moments of joy. How can we make sure you carry a little bit of this feeling into tomorrow?",
        "That’s fantastic! I'm celebrating with you. What’s something you’re proud of yourself for lately?"
    ],
    neutral: [
        "I’m here and I’m listening. How has your day been unfolding so far?",
        "It’s okay to just 'be.' I’m here whenever you want to share. What’s been on your mind lately, even the small things?",
        "I hear you. I'm here to support you in whatever way you need. What's one thing you're looking forward to, no matter how small?"
    ],
    crisis: [
        "I hear how much pain you are in, and I want you to know you are not alone. Your life is precious, and I am concerned about your safety. Please reach out for professional support immediately. You can Dial 112 for emergency services or call the KIRAN Mental Health Helpline at 1800-599-0019 (India). Also, please reach out to a trusted family member, friend, or someone nearby who can be with you right now."
    ]
};

const checkCrisisSemantic = async (message) => {
    try {
        const detectionModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = `Classify if the following user message expresses suicidal thoughts, self - harm intention, extreme hopelessness, or a desire to end their life. 
        Analyze the meaning in English, Tamil, or Tanglish.
        Respond with ONLY 'YES' or 'NO'.

    Message: "${message}"`;

        const result = await detectionModel.generateContent(prompt);
        const response = result.response.text().trim().toUpperCase();
        return response.includes('YES');
    } catch (e) {
        console.error('Crisis Detection Error:', e);
        return false;
    }
};

const detectIntent = (message) => {
    const msg = message.toLowerCase();

    // Comprehensive Crisis Keywords (English, Tamil, Tanglish)
    const crisisPatterns = [
        // English
        'kill myself', 'suicide', 'end my life', 'want to die', 'hurt myself', 'self-harm',
        'hopeless', 'no reason to live', 'cannot go on', 'want to disappear', 'don\'t want to be here',
        'better off dead', 'kill me', 'ending it',
        // Tamil/Tanglish
        'saaga poren', 'life mudinjiduchi', 'tharkolai', 'uyira vida poren', 'vazha pudikala',
        'venam uyir', 'sathuralam', 'dead', 'die', 'thorkolai', 'saagilaam', 'pudikala vazha'
    ];

    if (crisisPatterns.some(pattern => msg.includes(pattern))) return 'crisis';

    // Logical semantic checks (e.g., "I don't" + "want to live")
    if (msg.includes('don\'t') && (msg.includes('want to live') || msg.includes('want to stay'))) return 'crisis';
    if (msg.includes('nothing') && (msg.includes('left for me') || msg.includes('makes sense anymore'))) return 'crisis';

    if (msg.includes('lonely') || msg.includes('alone') || msg.includes('no one') || msg.includes('isolated')) return 'lonely';
    if (msg.includes('anxious') || msg.includes('worry') || msg.includes('scared') || msg.includes('panic') || msg.includes('afraid') || msg.includes('nervous')) return 'anxious';
    if (msg.includes('stressed') || msg.includes('pressure') || msg.includes('overwhelmed') || msg.includes('too much') || msg.includes('heavy')) return 'stressed';
    if (msg.includes('sad') || msg.includes('crying') || msg.includes('upset') || msg.includes('down') || msg.includes('depressed') || msg.includes('blue')) return 'sad';
    if (msg.includes('tired') || msg.includes('sleepy') || msg.includes('exhausted') || msg.includes('no energy') || msg.includes('drained')) return 'tired';
    if (msg.includes('burnout') || msg.includes('give up') || msg.includes('quit') || msg.includes('done') || msg.includes('cannot do this')) return 'burnout';
    if (msg.includes('happy') || msg.includes('good') || msg.includes('great') || msg.includes('wonderful') || msg.includes('proud') || msg.includes('progress')) return 'happy';
    return 'neutral';
};

export const chat = async (req, res) => {
    const { userId, sessionId, message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    // Save Data (Database or Memory)
    const storeMsg = async (data) => {
        if (mongoose.connection.readyState === 1) {
            try {
                await new Message(data).save();
            } catch (e) {
                memoryStorage.push({ ...data, _id: Date.now() + Math.random(), timestamp: new Date() });
            }
        } else {
            memoryStorage.push({ ...data, _id: Date.now() + Math.random(), timestamp: new Date() });
        }
    };

    const intent = detectIntent(message);
    let isCrisisDetected = intent === 'crisis';

    // Semantic check for potential crisis if keywords miss
    if (!isCrisisDetected) {
        isCrisisDetected = await checkCrisisSemantic(message);
    }

    try {
        // Load History (Database or Memory)
        let history = [];
        if (mongoose.connection.readyState === 1) {
            try {
                history = await Message.find({ sessionId }).sort({ timestamp: -1 }).limit(25);
                history = history.reverse();
            } catch (e) {
                console.warn('DB Fetch failed, falling back to memory');
                history = memoryStorage.filter(msg => msg.sessionId === sessionId).slice(-25);
            }
        } else {
            history = memoryStorage.filter(msg => msg.sessionId === sessionId).slice(-25);
        }

        const formattedHistory = history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));

        // Generate Sentiment & Response
        const chatSession = model.startChat({
            history: [
                { role: 'user', parts: [{ text: THERAPIST_SYSTEM_PROMPT }] },
                { role: 'model', parts: [{ text: 'I understand my role as MindWell AI Therapist.' }] },
                ...formattedHistory
            ],
        });

        const result = await chatSession.sendMessage(message);
        let responseText = result.response.text();

        await storeMsg({ userId, sessionId, role: 'user', content: message, sentiment: 'Neutral', isCrisis: isCrisisDetected });
        await storeMsg({ userId, sessionId, role: 'assistant', content: responseText, isCrisis: isCrisisDetected });

        res.json({
            message: responseText,
            sentiment: 'Neutral',
            is_crisis: isCrisisDetected,
            historyLength: history.length
        });

    } catch (error) {
        console.error('Chat Gemini Error:', error.message);

        // Return local therapist fallback response
        const intent = detectIntent(message);
        const responses = FALLBACK_RESPONSES[intent];
        const responseText = responses[Math.floor(Math.random() * responses.length)];

        await storeMsg({ userId, sessionId, role: 'user', content: message, sentiment: 'Neutral', isCrisis: isCrisisDetected });
        await storeMsg({ userId, sessionId, role: 'assistant', content: responseText, isCrisis: isCrisisDetected });

        res.status(200).json({
            message: responseText,
            sentiment: 'Neutral',
            is_crisis: isCrisisDetected,
            isFallback: true
        });
    }
};

export const getHistory = async (req, res) => {
    const { sessionId } = req.params;
    const { userId } = req.query;
    try {
        let history;
        if (mongoose.connection.readyState === 1) {
            if (userId && userId !== 'anonymous') {
                history = await Message.find({ $or: [{ sessionId }, { userId }] }).sort({ timestamp: 1 });
            } else {
                history = await Message.find({ sessionId }).sort({ timestamp: 1 });
            }
        } else {
            if (userId && userId !== 'anonymous') {
                history = memoryStorage.filter(msg => msg.sessionId === sessionId || msg.userId === userId);
            } else {
                history = memoryStorage.filter(msg => msg.sessionId === sessionId);
            }
        }
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};
