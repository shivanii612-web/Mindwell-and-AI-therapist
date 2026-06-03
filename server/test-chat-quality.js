import axios from 'axios';

const messages = [
    "Enaku interview nala anxiety ah iruku",
    "I feel lonely even when people are around me",
    "I had a fight with my friend and I feel guilty",
    "Enaku overthinking jasthi",
    "Today I feel happy and peaceful",
    "I feel unsafe and I need urgent emotional support"
];

const testChat = async () => {
    console.log("MindWell: Starting AI Therapist Quality Verification...\n");

    for (const msg of messages) {
        try {
            console.log(`User: ${msg}`);
            const response = await axios.post('http://localhost:5000/api/chat', {
                userId: 'test-user',
                sessionId: 'test-session-' + Date.now(),
                message: msg
            });

            console.log(`Therapist: ${response.data.message}`);
            console.log(`Is Crisis: ${response.data.is_crisis}`);
            console.log(`Fallback Used: ${response.data.isFallback || false}`);
            console.log("--------------------------------------------------\n");
        } catch (error) {
            console.error(`Error testing message "${msg}":`, error.message);
        }
    }
};

testChat();
