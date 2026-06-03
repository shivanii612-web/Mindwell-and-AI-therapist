import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function diagnostic() {
    console.log('--- MindWell Gemini Diagnostic ---');
    console.log('SDK Version: 0.24.1 (Latest)');
    console.log('API Key Length:', process.env.GEMINI_API_KEY.length);
    console.log('API Key Prefix:', process.env.GEMINI_API_KEY.substring(0, 6));

    const modelsToTest = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro',
        'gemini-pro'
    ];

    for (const modelName of modelsToTest) {
        console.log(`\nTesting Model: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Hello');
            const response = await result.response;
            const text = response.text();
            console.log(`✅ Success! Response: "${text.substring(0, 30)}..."`);
        } catch (error) {
            console.error(`❌ Failed: ${error.message}`);
            if (error.status) console.log(`   Status Code: ${error.status}`);
        }
    }
}

diagnostic();
