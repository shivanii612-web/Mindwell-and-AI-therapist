import { GoogleGenerativeAI } from '@google/generative-ai';
import Message from '../models/Message.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const THERAPIST_SYSTEM_PROMPT = `
You are MindWell AI Therapist, a calm, warm, and deeply empathetic mental health companion.
Your goal is to provide a safe, non-judgmental space for users to explore their emotions.

Core Guidelines:
1. **Empathy First**: Always validate the user's emotion specifically. Instead of "I hear you," say things like "It makes sense that you'd feel that way" or "That sounds like a lot to carry."
2. **Natural & Specific**: If they mention an interview, loneliness, or a fight, address that specific context. Don't be generic.
3. **Language Adaptability**: 
   - If the user types in English, reply in English.
   - If the user types in Tanglish (e.g., "Enaku romba stress ah iruku"), reply in simple, caring Tanglish.
   - If the user mixes both, use a natural mixed style.
4. **Therapeutic Strategy**: Response should follow: Validation -> One Practical Coping Suggestion -> One Gentle Follow-up Question.
5. **Conciseness**: Keep responses meaningful but short (2-4 sentences). Avoid long monologues.

Specific Emotional Support:
- **Anxiety/Interviews**: Focus on grounding (5-4-3-2-1 technique) or small preparation steps.
- **Loneliness/Sadness**: Offer presence and suggest one small way to connect with themselves or others.
- **Guilt/Overthinking**: Encourage self-compassion and suggest writing thoughts down.
- **Burnout/Stress**: Validate the need for rest and suggest a "micro-break."
- **Happiness**: Celebrate with them and help them "anchor" the good feeling.

Crisis Safety (Kandippa follow pannanum):
- If user mentions self-harm or suicide: Switch to a serious, supportive tone. Provide India helplines: 112 (Emergency) or 1800-599-0019 (KIRAN). Encourage them to reach out to a trusted person immediately.

Never diagnose. Never sound robotic. Never repeat the same opening twice.
`;

// In-Memory Storage Fallback
const memoryStorage = [];

const FALLBACK_RESPONSES = {
    lonely: [
        "Loneliness can feel really heavy, like you're in a room full of people but still far away. En koda pesunga, I'm here. What's one small thing we can do to help you feel a bit more connected today?",
        "It’s okay to feel this way. Sila neram apadi thaan irukum. I'm right here with you. Is there a specific memory or person you're missing right now?",
        "Being alone for a long time can be exhausting. I'm listening. What would 'feeling supported' look like for you in this moment?"
    ],
    anxious: [
        "Anxiety feels like a racing heart and a thousands 'what-ifs'. It's okay. Relax pannunga, let's take a deep breath. What is one thing near you that you can see and touch right now?",
        "It sounds like your mind is trying to protect you by overthinking, but it's getting too loud. I'm here. Can we focus on just the next five minutes?",
        "Interview or any big event can be scary. Anxiety varudhu na you care about it, and that's okay. Small steps ah focus pannalam. Enna thonudhu ungaluku?"
    ],
    stressed: [
        "You're carrying a lot of weight on your shoulders right now. Romba pressure ah iruka? Let's try to put one thing down just for a moment. What's the biggest task on your mind?",
        "Stress can make the smallest things feel like mountains. It's okay to feel overwhelmed. Can we try a 2-minute micro-break together?",
        "I hear how much you're juggling. Take a pause. Iniku oru chinna relaxation time kidaichidha ungaluku?"
    ],
    sad: [
        "I'm so sorry things are feeling this heavy. It's perfectly okay to cry or just sit with this for a while. Enna achu? I'm here to listen.",
        "Sadness is like a cloud—it’s here now, but it doesn't define the sky. I'm right here in the fog with you. What's the thought that's hurting the most?",
        "Vara kavalaya share pannunga. It sounds really difficult. If you could say one thing to this sadness, what would it be?"
    ],
    tired: [
        "You sound completely drained. Heart and mind needs rest too. Konjam relax pannunga. Have you been able to take even a tiny break for yourself today?",
        "Exhaustion is a sign you've been strong for too long. It's okay to be tired. Iniku enna physical work or mental work ungalai romba tired akkiduchi?",
        "Rest is productive, remember that. I'm here. If you could close your eyes and be anywhere peaceful right now, where would it be?"
    ],
    burnout: [
        "Burnout feels like you've run out of fuel. It's really hard. Don't push yourself too much now. When did you first notice that everything was becoming 'too much'?",
        "You've been giving your 100% for too long. I'm right here. What would 'doing absolutely nothing' for 10 minutes look like for you?",
        "It sounds like your spirit needs a real break. I'm listening. Konjam self-care pathi yosikalaama?"
    ],
    happy: [
        "I love this energy! Enjoy this moment, you've earned it. Iniku ungaluku enna happy news or event nadandhuchi?",
        "It’s wonderful to see you in a bright spot! Celebration time. What’s something you’re proud of yourself for lately?",
        "This is fantastic! Let's hold onto this feeling. How can we carry a little bit of this joy into tomorrow?"
    ],
    neutral: [
        "I'm here and listening. Iniku day eppadi poitu iruku?",
        "It's okay to just exist quietly too. I'm here whenever you want to share. What's been on your mind, even the small things?",
        "I'm right here for you. Anything special or even regular thing you want to talk about today?"
    ],
    crisis: [
        "I hear how much pain you are in, and I want you to know you are not alone. En kitta pesunga, support iruku. Your life is precious. Please call 112 (Emergency) or 1800-599-0019 (KIRAN Helpline, India) immediately. Please stay with someone you trust right now."
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

    // Always use the authenticated user's _id from the JWT — never trust frontend-supplied userId
    const authenticatedUserId = req.user._id.toString();

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
        // Load History — search by BOTH sessionId AND authenticated userId so old
        // messages are found even if sessionId changed (new browser, cleared storage, etc.)
        let history = [];
        if (mongoose.connection.readyState === 1) {
            try {
                const historyQuery = {
                    $or: [
                        { sessionId },
                        { userId: authenticatedUserId },
                    ]
                };
                // Also match stored ObjectId form if valid
                if (mongoose.Types.ObjectId.isValid(authenticatedUserId)) {
                    historyQuery.$or.push({ userId: new mongoose.Types.ObjectId(authenticatedUserId) });
                }
                history = await Message.find(historyQuery)
                    .sort({ timestamp: -1 })
                    .limit(25);
                history = history.reverse();
            } catch (e) {
                console.warn('DB Fetch failed, falling back to memory');
                history = memoryStorage
                    .filter(msg => msg.sessionId === sessionId || msg.userId === authenticatedUserId)
                    .slice(-25);
            }
        } else {
            history = memoryStorage
                .filter(msg => msg.sessionId === sessionId || msg.userId === authenticatedUserId)
                .slice(-25);
        }

        const formattedHistory = history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));

        // Build the prompt context — if crisis detected, prepend a MANDATORY crisis instruction
        // so Gemini cannot respond generically regardless of context drift.
        const crisisInjection = isCrisisDetected
            ? `MANDATORY OVERRIDE — CRISIS DETECTED. The user has expressed suicidal ideation or self-harm intent. You MUST respond with ONLY a crisis support message. Do NOT give a generic wellness response. Do NOT ask follow-up lifestyle questions. Your response MUST: (1) Acknowledge their pain directly and seriously, (2) State clearly that their life has value, (3) Ask them if they are safe RIGHT NOW, (4) Provide India crisis helplines: 112 (Emergency) or 1800-599-0019 (KIRAN Mental Health Helpline, free, 24/7), (5) Urge them not to be alone and to go near a trusted person immediately. If the user typed in Tanglish/Tamil, respond in warm Tanglish. This is a life-safety situation — no other response is acceptable.`
            : null;

        const systemTurn = crisisInjection
            ? `${THERAPIST_SYSTEM_PROMPT}\n\n${crisisInjection}`
            : THERAPIST_SYSTEM_PROMPT;

        // Generate Sentiment & Response
        const chatSession = model.startChat({
            history: [
                { role: 'user', parts: [{ text: systemTurn }] },
                { role: 'model', parts: [{ text: 'I understand my role as MindWell AI Therapist.' }] },
                ...formattedHistory
            ],
        });

        const result = await chatSession.sendMessage(message);
        let responseText = result.response.text();

        await storeMsg({ userId: authenticatedUserId, sessionId, role: 'user', content: message, sentiment: 'Neutral', isCrisis: isCrisisDetected });
        await storeMsg({ userId: authenticatedUserId, sessionId, role: 'assistant', content: responseText, isCrisis: isCrisisDetected });

        res.json({
            message: responseText,
            sentiment: 'Neutral',
            is_crisis: isCrisisDetected,
            historyLength: history.length
        });

    } catch (error) {
        console.error('Chat Gemini Error:', error.message);

        // Contextual fallback — crisis gets crisis fallback, not a generic one
        const fallbackIntent = isCrisisDetected ? 'crisis' : detectIntent(message);
        const responses = FALLBACK_RESPONSES[fallbackIntent] || FALLBACK_RESPONSES['neutral'];
        const responseText = responses[Math.floor(Math.random() * responses.length)];

        await storeMsg({ userId: authenticatedUserId, sessionId, role: 'user', content: message, sentiment: 'Neutral', isCrisis: isCrisisDetected });
        await storeMsg({ userId: authenticatedUserId, sessionId, role: 'assistant', content: responseText, isCrisis: isCrisisDetected });

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
    // req.user is guaranteed by auth middleware — never undefined here
    const userId = req.user._id.toString();

    try {
        console.log('MindWell Debug: getHistory for sessionId:', sessionId, 'userId:', userId);

        let history;
        if (mongoose.connection.readyState === 1) {
            // Load ALL messages belonging to this user — sessionId is used as an OR condition
            // so that old messages from previous sessions (different sessionId) are also returned.
            const query = {
                $or: [
                    { sessionId },
                    { userId },
                ]
            };
            // Also match if userId was stored as ObjectId
            if (mongoose.Types.ObjectId.isValid(userId)) {
                query.$or.push({ userId: new mongoose.Types.ObjectId(userId) });
            }

            console.log('MindWell Debug: getHistory query:', JSON.stringify(query));
            history = await Message.find(query).sort({ timestamp: 1 });
            console.log('MindWell Debug: Found messages count:', history.length);
        } else {
            history = memoryStorage.filter(msg =>
                msg.sessionId === sessionId || msg.userId === userId
            );
        }
        res.json(history);
    } catch (error) {
        console.error('MindWell: getHistory error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};
