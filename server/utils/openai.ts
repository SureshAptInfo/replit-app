import OpenAI from "openai";

// Initialize the OpenAI client with the API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

/**
 * Generate a lead score based on lead data and activities
 */
export async function generateLeadScore(leadData: any): Promise<any> {
  try {
    const prompt = `
      Analyze this lead and provide a quality score from 0-100 based on the likelihood of conversion.
      
      LEAD INFO:
      ${JSON.stringify(leadData, null, 2)}
      
      Consider factors like:
      - Activity history and engagement level
      - Response times and patterns
      - Communication quality and frequency
      - Progress through sales funnel
      - Time since last contact
      - Overall lead profile quality
      
      Respond with a JSON object containing ONLY these fields:
      - score: number between 0-100
      - reasoning: brief explanation for the score (2-3 sentences)
    `;
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
    
    // Handle null content safely
    const content = response.choices[0].message.content || '{"score": 50, "reasoning": "Unable to analyze lead data."}';
    const result = JSON.parse(content);
    
    return {
      score: Math.max(0, Math.min(100, Math.round(result.score))),
      reasoning: result.reasoning || "No reasoning provided."
    };
  } catch (error: any) {
    console.error("Error generating lead score:", error.message);
    // Return a default score if there's an error
    return {
      score: 50,
      reasoning: "Could not generate score due to a technical issue."
    };
  }
}

/**
 * Generate message suggestions based on lead data and activities
 */
export async function generateMessageSuggestions(leadData: any, purpose: string = "follow-up"): Promise<string[]> {
  try {
    const prompt = `
      Generate 3 message suggestions for communicating with this lead. The purpose is: ${purpose}
      
      LEAD INFO:
      ${JSON.stringify(leadData, null, 2)}
      
      Consider:
      - Lead's current status: ${leadData.status || "unknown"}
      - Communication history and previous responses
      - Personalize by using their name and reference specific information
      - Keep messages professional, concise, and action-oriented
      - Include a clear call to action
      
      For purpose "${purpose}", focus on:
      ${getPurposeGuidance(purpose)}
      
      Respond with a JSON object containing a 'suggestions' array of 3 message strings. Each message should be 2-4 sentences maximum.
    `;
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
    
    // Handle null content safely
    const content = response.choices[0].message.content || '{"suggestions": ["Message 1", "Message 2", "Message 3"]}';
    const result = JSON.parse(content);
    
    // Always return an array, even if the response structure is unexpected
    if (Array.isArray(result.suggestions)) {
      return result.suggestions;
    } else if (Array.isArray(result)) {
      return result;
    } else {
      return [
        `Hi ${leadData.name || "there"}, I wanted to follow up on our previous conversation. Let me know if you have any questions.`,
        `Hello ${leadData.name || "there"}, I'm checking in to see if you need any additional information. Please let me know.`,
        `${leadData.name || "Hi"}, I'm available to discuss any questions you might have about our services. Would you like to schedule a call?`
      ];
    }
  } catch (error: any) {
    console.error("Error generating message suggestions:", error.message);
    // Return default messages if there's an error
    return [
      `Hi ${leadData.name || "there"}, I wanted to follow up on our previous conversation. Let me know if you have any questions.`,
      `Hello ${leadData.name || "there"}, I'm checking in to see if you need any additional information. Please let me know.`,
      `${leadData.name || "Hi"}, I'm available to discuss any questions you might have about our services. Would you like to schedule a call?`
    ];
  }
}

/**
 * Generate follow-up recommendations based on lead data and activities
 */
export async function generateFollowUpRecommendation(leadData: any): Promise<any> {
  try {
    const prompt = `
      Based on this lead's profile and activity history, recommend the best follow-up approach.
      
      LEAD INFO:
      ${JSON.stringify(leadData, null, 2)}
      
      Consider:
      - Current stage in the sales funnel
      - Engagement patterns and responsiveness
      - Last contact date and method
      - Preferred communication channels
      - Any specific interests or needs mentioned
      
      Respond with a JSON object containing ONLY these fields:
      - timing: when to follow up (e.g., "Within 24 hours", "Next week", etc.)
      - action: specific recommended action (e.g., "Schedule a demo", "Send product information")
      - reasoning: brief explanation for the recommendation (2-3 sentences)
    `;
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
    
    // Handle null content safely
    const content = response.choices[0].message.content || 
      '{"timing": "Within 48 hours", "action": "Follow up with a phone call", "reasoning": "Default recommendation due to limited data analysis."}';
    
    return JSON.parse(content);
  } catch (error: any) {
    console.error("Error generating follow-up recommendation:", error.message);
    // Return a default recommendation if there's an error
    return {
      timing: "Within 48 hours",
      action: "Follow up with a phone call",
      reasoning: "Could not generate a specific recommendation due to a technical issue."
    };
  }
}

/**
 * Get purpose-specific guidance for message generation
 */
function getPurposeGuidance(purpose: string): string {
  switch (purpose.toLowerCase()) {
    case "follow-up":
      return "Polite reminder of previous contact, adding value, and suggesting a specific next step.";
    case "initial-contact":
      return "Brief introduction, value proposition, and a soft call to action.";
    case "meeting-request":
      return "Clear purpose for meeting, proposed times, and the benefit to them.";
    case "product-info":
      return "Specific product details relevant to their needs, with emphasis on benefits not features.";
    case "closing":
      return "Summarize value, address objections, and present a clear path to purchase.";
    default:
      return "Clear, concise and valuable information with a specific call to action.";
  }
}