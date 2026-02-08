// Test Intent Analysis with simplified schema
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

console.log('Testing Intent Analysis endpoint schema...\n');

try {
    const model = 'gemini-3-flash-preview';
    const idea = 'a simple todo app';

    console.log(`Idea: "${idea}"`);
    console.log(`Model: ${model}\n`);

    // Test with the ACTUAL schema from the endpoint
    const response = await ai.models.generateContent({
        model,
        contents: `Analyze this project idea: "${idea}"
    
Return JSON with:
- projectName (string)
- complexity (string: "Simple CRUD", "Moderate Multi-feature", "Complex Multi-tenant", or "Enterprise")
- feasibility score (number 1-10)`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    projectName: { type: Type.STRING },
                    complexity: { type: Type.STRING },
                    feasibilityScore: { type: Type.NUMBER }
                },
                required: ["projectName", "complexity", "feasibilityScore"]
            }
        }
    });

    console.log('✅ Schema test PASSED');
    console.log('Response:', response.text);

} catch (error) {
    console.error('❌ Schema test FAILED');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
}
