// Debug Intent Analysis Endpoint - Test with ACTUAL complex schema
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

console.log('🔍 Testing Intent Analysis with COMPLEX SCHEMA...\n');

const idea = 'a simple todo app with user authentication';

// This is the EXACT prompt from the server
function INTENT_ANALYSIS_PROMPT(userIdea) {
    return `You are an expert product analyst. Analyze this project idea comprehensively:

USER IDEA: "${userIdea}"

Provide a structured analysis covering:
1. Extract project name, technologies mentioned, key nouns, target users
2. Classify the project type and complexity
3. Prioritize features into must-have, should-have, nice-to-have
4. Clarify target audience, scale, monetization, timeline
5. Assess feasibility (score 1-10, status, concerns, recommendations)
6. Generate 3-5 GitHub search strategies

Return ONLY valid JSON matching the schema. No markdown, no preamble.`;
}

try {
    const model = 'gemini-3-flash-preview';

    console.log(`Idea: "${idea}"`);
    console.log(`Model: ${model}\n`);
    console.log('Sending request with FULL complex schema...\n');

    const response = await ai.models.generateContent({
        model,
        contents: INTENT_ANALYSIS_PROMPT(idea),
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    // 1.1 Input Processing
                    entities: {
                        type: Type.OBJECT,
                        properties: {
                            projectName: { type: Type.STRING },
                            technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
                            keyNouns: { type: Type.ARRAY, items: { type: Type.STRING } },
                            targetUsers: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["projectName", "technologies", "keyNouns", "targetUsers"]
                    },

                    // Project Classification
                    classification: {
                        type: Type.OBJECT,
                        properties: {
                            primaryType: {
                                type: Type.STRING,
                                enum: ["SaaS", "E-commerce", "Social Network", "Content Platform",
                                    "Marketplace", "Dashboard/Analytics", "Portfolio/Showcase",
                                    "Booking/Scheduling", "Educational", "Other"]
                            },
                            secondaryTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
                            complexity: {
                                type: Type.STRING,
                                enum: ["Simple CRUD", "Moderate Multi-feature", "Complex Multi-tenant", "Enterprise"]
                            }
                        },
                        required: ["primaryType", "complexity"]
                    },

                    // Feature Prioritization
                    features: {
                        type: Type.OBJECT,
                        properties: {
                            mustHave: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        reason: { type: Type.STRING }
                                    }
                                }
                            },
                            shouldHave: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        reason: { type: Type.STRING }
                                    }
                                }
                            },
                            niceToHave: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        reason: { type: Type.STRING }
                                    }
                                }
                            }
                        },
                        required: ["mustHave", "shouldHave", "niceToHave"]
                    },

                    // 1.2 Requirement Clarification
                    clarification: {
                        type: Type.OBJECT,
                        properties: {
                            targetAudience: {
                                type: Type.STRING,
                                enum: ["B2B", "B2C", "Internal Tool", "Developer Tool", "Mixed"]
                            },
                            expectedScale: {
                                type: Type.STRING,
                                enum: ["small", "medium", "large"]
                            },
                            monetization: {
                                type: Type.STRING,
                                enum: ["free", "subscription", "freemium", "one-time-purchase", "ads", "not-applicable"]
                            },
                            timeline: {
                                type: Type.STRING,
                                enum: ["weekend", "2-weeks", "month", "3-months"]
                            }
                        },
                        required: ["targetAudience", "expectedScale", "timeline"]
                    },

                    // 1.3 Feasibility Assessment
                    feasibility: {
                        type: Type.OBJECT,
                        properties: {
                            score: {
                                type: Type.NUMBER,
                                minimum: 0,
                                maximum: 10
                            },
                            status: {
                                type: Type.STRING,
                                enum: ["Highly Feasible", "Feasible with Adjustments", "Ambitious but Possible", "Needs Scope Reduction"]
                            },
                            concerns: { type: Type.ARRAY, items: { type: Type.STRING } },
                            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                            scopeReduction: {
                                type: Type.OBJECT,
                                properties: {
                                    needed: { type: Type.BOOLEAN },
                                    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
                                }
                            }
                        },
                        required: ["score", "status", "concerns", "recommendations"]
                    },

                    // Enhanced Search Queries (Phase 2 Integration)
                    searchStrategies: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        minItems: 3,
                        maxItems: 5
                    }
                },
                required: ["entities", "classification", "features", "clarification", "feasibility", "searchStrategies"]
            }
        }
    });

    console.log('✅ SUCCESS! The complex schema works!');
    console.log('\n📊 Response:');
    console.log(JSON.stringify(JSON.parse(response.text), null, 2));

} catch (error) {
    console.error('\n❌ FAILED with complex schema');
    console.error('\n🔴 Error Message:', error.message);
    console.error('🔴 Error Type:', error.name);
    console.error('\n📋 Full Error:');
    console.error(error);

    console.error('\n💡 Diagnosis:');
    if (error.message.includes('schema')) {
        console.error('   → Schema validation error - Gemini cannot handle this complex schema');
        console.error('   → Solution: Simplify the schema (remove nested objects, enums, constraints)');
    } else if (error.message.includes('timeout')) {
        console.error('   → Request timeout - Schema is too complex and takes too long');
        console.error('   → Solution: Reduce schema complexity');
    } else if (error.message.includes('quota') || error.message.includes('rate')) {
        console.error('   → API rate limit hit');
    } else {
        console.error('   → Unknown error - Check full error details above');
    }
}
