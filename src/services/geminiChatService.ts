import { GoogleGenAI, Type } from "@google/genai";
import { ChatbotAction, SelectionOption } from '../types';
import { LOCATIONS, BRIDE_ATTIRE, GROOM_ATTIRE, BRIDE_POSES, GROOM_POSES, STYLES, HAIRSTYLES, GROOM_HAIRSTYLES, ASPECT_RATIOS, JEWELRY } from '../constants';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const actionItemSchema = {
    type: Type.OBJECT,
    properties: {
        category: {
            type: Type.STRING,
            enum: ['location', 'brideAttire', 'groomAttire', 'bridePose', 'groomPose', 'style', 'hairstyle', 'groomHairstyle', 'aspectRatio', 'jewelry']
        },
        promptValue: { type: Type.STRING }
    },
    required: ['category', 'promptValue']
};

const schema = {
    type: Type.OBJECT,
    properties: {
        action: { type: Type.STRING, enum: ['set_option', 'chat'] },
        updates: {
            type: Type.ARRAY,
            items: actionItemSchema,
            description: "A list of options to update. Required only if action is 'set_option'."
        },
        responseText: { type: Type.STRING, description: 'A friendly, conversational response for the user.' }
    },
    required: ['action', 'responseText']
};


const formatOptionsForPrompt = (options: SelectionOption[]) => {
    return JSON.stringify(options.map(o => ({ label: o.label, promptValue: o.promptValue })));
};


export async function getChatbotResponse(userMessage: string): Promise<ChatbotAction> {
  const prompt = `
    You are an advanced creative AI assistant for a pre-wedding photoshoot generator. Your primary function is to interpret a user's request and translate it into specific instructions for the image generator. You must be friendly, concise, and helpful, and your response MUST be a single valid JSON object matching the required schema.

    The user said: "${userMessage}"

    **YOUR TASK: Analyze the user's intent and generate the correct JSON action.**

    **RULE 1: Handle Conversational Chat**
    - If the user is just chatting (e.g., "hello", "thank you", "what can you do?"), making a greeting, or asking a question you can't handle, your \`action\` MUST be "chat".
    - Your \`responseText\` should be a friendly, conversational reply.
    - The \`updates\` field MUST be omitted.

    **RULE 2: Handle Configuration Requests (This is your main job!)**
    - If the user wants to change any aspect of the photo, your \`action\` MUST be "set_option".
    - You must determine which category to change ('location', 'brideAttire', etc.) and what the new value ('promptValue') should be.

    **CRITICAL: HANDLING CUSTOM REQUESTS**
    Your most important skill is creating new \`promptValue\`s for requests that are NOT in the predefined lists. The user's creativity is the priority.
    -   **Custom Colors & Attire:** If a user requests a specific color or item of clothing, create a descriptive prompt.
        -   User: "give the bride a green saree" -> \`updates\`: \`[{ "category": "brideAttire", "promptValue": "a beautiful traditional green saree" }]\`
        -   User: "put the groom in a black tuxedo" -> \`updates\`: \`[{ "category": "groomAttire", "promptValue": "a sharp black tuxedo" }]\`
    -   **Custom Poses & Actions:** If a user describes an action or pose, create a new pose prompt.
        -   User: "make them both dance" -> \`updates\`: \`[{ "category": "bridePose", "promptValue": "dancing joyfully" }, { "category": "groomPose", "promptValue": "dancing joyfully" }]\`
    -   **Custom Styles:** If a user describes a visual style, create a style prompt.
        -   User: "make it black and white" -> \`updates\`: \`[{ "category": "style", "promptValue": "a classic, high-contrast black and white photograph" }]\`
    -   **Confirmation:** Your \`responseText\` must confirm what you've done. Ex: "Done! I've given the bride a beautiful green saree."

    **Handling Multiple Updates**
    - A single user request can change multiple things. You MUST return all of them in the \`updates\` array.
    - User: "make them hold hands and put them in the Kerala backwaters" -> \`updates\`: \`[{ "category": "bridePose", "promptValue": "holding hands with the groom" }, { "category": "groomPose", "promptValue": "holding hands with the bride" }, { "category": "location", "promptValue": "on a traditional houseboat in the serene Kerala backwaters" }]\`

    **Using Predefined Options**
    - If the user's request clearly matches one of the options below, use its exact \`promptValue\`. These are just suggestions to guide you.
    - Locations: ${formatOptionsForPrompt(LOCATIONS)}
    - Bride's Attire: ${formatOptionsForPrompt(BRIDE_ATTIRE)}
    - Groom's Attire: ${formatOptionsForPrompt(GROOM_ATTIRE)}
    - Bride's Poses: ${formatOptionsForPrompt(BRIDE_POSES)}
    - Groom's Poses: ${formatOptionsForPrompt(GROOM_POSES)}
    - Bride's Hairstyles: ${formatOptionsForPrompt(HAIRSTYLES)}
    - Bride's Jewelry: ${formatOptionsForPrompt(JEWELRY)}
    - Groom's Hairstyles: ${formatOptionsForPrompt(GROOM_HAIRSTYLES)}
    - Art Styles: ${formatOptionsForPrompt(STYLES)}
    - Aspect Ratios: ${formatOptionsForPrompt(ASPECT_RATIOS)}

    **RULE 3: Handle Ambiguity**
    - If you are unsure what the user wants, ask for clarification. The \`action\` should be "chat".
    - Example: User says "make it better". You respond with \`responseText\`: "I can certainly try! What would you like to improve? The pose, the location, or the style?".

    Now, analyze the user's message and generate your response.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonText = response.text.trim();
    const parsedResponse = JSON.parse(jsonText);
    
    if (!parsedResponse.action || !parsedResponse.responseText) {
        throw new Error("Invalid response structure from AI.");
    }

    return parsedResponse as ChatbotAction;

  } catch (error) {
    console.error("Error getting chatbot response from Gemini:", error);
    // Fallback response
    return {
        action: 'chat',
        responseText: "I'm sorry, I couldn't process that request. Could you please try rephrasing?"
    };
  }
}