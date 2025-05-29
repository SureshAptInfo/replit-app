import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_MODEL = "gpt-4o";

/**
 * Generate a lead summary based on lead details and activities
 */
export async function generateLeadSummary(
  lead: any,
  activities: any[]
): Promise<{ summary: string; suggestedActions: string[] }> {
  try {
    // Prepare the input for the AI model
    const leadData = {
      name: lead.name,
      company: lead.company || "",
      position: lead.position || "",
      status: lead.status,
      source: lead.source || "",
      value: lead.value || 0,
      followUpCount: lead.followUpCount || 0,
      lastFollowUpDate: lead.lastFollowUpDate 
        ? new Date(lead.lastFollowUpDate).toLocaleDateString() 
        : "None",
    };

    // Format activities into a readable format
    const activityHistory = activities.map((activity) => ({
      type: activity.type,
      date: new Date(activity.createdAt).toLocaleDateString(),
      content: activity.content,
    }));

    // Create the prompt
    const prompt = `
      As a sales assistant, analyze this lead and their interaction history to provide a concise summary and suggested follow-up actions.
      
      LEAD INFO:
      ${JSON.stringify(leadData, null, 2)}
      
      INTERACTION HISTORY (most recent first):
      ${JSON.stringify(activityHistory, null, 2)}
      
      Please provide:
      1. A concise summary (max 3 sentences) that highlights key points about this lead and their stage in the sales process
      2. 2-3 suggested follow-up actions based on the history
      
      Format your response as JSON with the following structure:
      {
        "summary": "Concise summary of the lead status and history",
        "suggestedActions": ["Action 1", "Action 2", "Action 3"]
      }
    `;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    // Parse the response
    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error("No valid content in OpenAI response");
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(content);
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      throw new Error("Invalid JSON response from OpenAI");
    }
    
    return {
      summary: parsedResponse.summary || "Analysis not available at this time.",
      suggestedActions: parsedResponse.suggestedActions || ["Follow up with the lead to learn more about their needs."],
    };
  } catch (error) {
    console.error("Error generating lead summary:", error);
    return {
      summary: "Unable to generate summary due to an error.",
      suggestedActions: ["Follow up with the lead to learn more about their needs."],
    };
  }
}

/**
 * Generate a lead score based on lead details and activities
 */
export async function generateLeadScore(
  lead: any,
  activities: any[]
): Promise<{ score: number; reasoning: string }> {
  try {
    // Prepare the input for the AI model
    const leadData = {
      name: lead.name,
      company: lead.company || "",
      position: lead.position || "",
      status: lead.status,
      source: lead.source || "",
      value: lead.value || 0,
      followUpCount: lead.followUpCount || 0,
    };

    // Format activities
    const activityHistory = activities.map((activity) => ({
      type: activity.type,
      date: new Date(activity.createdAt).toLocaleDateString(),
      content: activity.content,
    }));

    // Create the prompt
    const prompt = `
      Analyze this lead and their interaction history to provide a score from 0-100 indicating their likelihood to convert.
      
      LEAD INFO:
      ${JSON.stringify(leadData, null, 2)}
      
      INTERACTION HISTORY:
      ${JSON.stringify(activityHistory, null, 2)}
      
      Consider factors like:
      - Engagement level (based on interactions)
      - Current status in the sales pipeline
      - Number of follow-ups required
      - Source of the lead
      - Value of the potential deal
      
      Return your response as JSON with this structure:
      {
        "score": number between 0-100,
        "reasoning": "Brief explanation for the score"
      }
    `;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    // Parse the response
    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error("No valid content in OpenAI response");
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(content);
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      throw new Error("Invalid JSON response from OpenAI");
    }
    
    return {
      score: parseInt(parsedResponse.score) || 50,
      reasoning: parsedResponse.reasoning || "Unable to generate detailed analysis at this time.",
    };
  } catch (error) {
    console.error("Error generating lead score:", error);
    return {
      score: 50,
      reasoning: "Unable to generate a precise score due to an error. Using a default middle-range score of 50.",
    };
  }
}