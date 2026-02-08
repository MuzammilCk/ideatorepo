// Test Gemini API Key
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

console.log('Testing Gemini API...');
console.log('API Key:', apiKey ? `${apiKey.substring(0, 20)}...` : 'NOT FOUND');

if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env');
    process.exit(1);
}

try {
    const ai = new GoogleGenAI({ apiKey });
    console.log('✅ SDK initialized');

    const model = 'gemini-3-flash-preview';
    console.log(`Testing model: ${model}...`);

    const response = await ai.models.generateContent({
        model,
        contents: 'Say hello in one word'
    });

    console.log('✅ API Key is VALID');
    console.log('✅ Model is AVAILABLE');
    console.log('Response:', response.text);
    console.log('\n🎉 Everything is working correctly!');

} catch (error) {
    console.error('❌ Test FAILED');
    console.error('Error:', error.message);
    console.error('Type:', error.name);

    if (error.message.includes('API key')) {
        console.error('\n💡 Solution: Check your GEMINI_API_KEY in .env file');
    } else if (error.message.includes('model')) {
        console.error('\n💡 Solution: Try a different model like gemini-2.5-flash');
    } else if (error.message.includes('quota') || error.message.includes('rate')) {
        console.error('\n💡 Solution: You hit API rate limits. Wait or upgrade quota');
    }

    process.exit(1);
}
