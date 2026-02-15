import { GoogleGenAI, Type } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found in environment");
  return new GoogleGenAI({ apiKey });
};

export const parseScheduleFromPDF = async (base64Pdf: string): Promise<any[]> => {
  const ai = getClient();
  
  const prompt = `
    Analyze the uploaded PDF document which contains a university class schedule or routine.
    Extract all the ACTIVE class sessions.
    
    CRITICAL RULE: Check for any "Remarks", "Status", or "Comments" column. If a course is marked as "Dropped", "Withdrawn", "Cancelled", or has a similar negative status, DO NOT include it in the output. Only include active, registered courses.
    
    For each active session, I need:
    - Course Name (e.g., "Introduction to Programming")
    - Course Code (e.g., "CSE101")
    - Faculty Initials or Name (e.g., "JD" or "John Doe")
    - Room Number (e.g., "UB20401")
    - Day of the Week (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday)
    - Start Time (in HH:mm 24-hour format, e.g., "14:30")
    - End Time (in HH:mm 24-hour format, e.g., "16:00")
    
    If the PDF represents a grid, carefully interpret row/column headers for days and times.
    If multiple sections exist, try to capture the ones relevant to a single student if visually distinct, otherwise capture all.
    Ignore exam schedules if possible, focus on weekly routine.
    
    Return the data as a clean JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Pdf
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              courseName: { type: Type.STRING },
              courseCode: { type: Type.STRING },
              faculty: { type: Type.STRING },
              room: { type: Type.STRING },
              day: { type: Type.STRING },
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw error;
  }
};

export const generateTaskSuggestion = async (courseName: string): Promise<string[]> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate 3 potential study tasks for a university student taking "${courseName}". Return only a JSON array of strings.`,
            config: {
                responseMimeType: 'application/json',
            }
        });
        if(response.text) return JSON.parse(response.text);
        return [];
    } catch (e) {
        return ["Review lecture notes", "Prepare for next quiz", "Read textbook chapter"];
    }
}