import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testSpecific() {
    console.log('--- Testing model: gemini-2.5-flash ---');
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent('Hello');
        const response = await result.response;
        console.log('✅ Success! Status: 200');
        console.log('Response:', response.text());
    } catch (error) {
        console.log('❌ Failed');
        console.log('HTTP Status Code:', error.status || 'Unknown');
        console.log('Error Message:', error.message);
    }
}

testSpecific();
