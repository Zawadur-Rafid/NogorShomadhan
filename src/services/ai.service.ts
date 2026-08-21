import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export const CATEGORIES = [
  'Road Damage',
  'Garbage & Waste',
  'Drainage & Waterlogging',
  'Streetlight & Electrical',
  'Water Supply',
  'Sanitation & Public Toilets',
  'Traffic & Illegal Parking',
  'Public Safety & Encroachment',
  'Noise & Environmental Pollution',
  'Parks & Public Spaces',
  'Animal-Related Issues',
  'Other'
];

export async function categorizeComplaint(
  title: string,
  description: string,
  imageBase64List: string[]
): Promise<string> {
  if (!apiKey) {
    console.warn('No Gemini API key found, falling back to Other');
    return 'Other';
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    
    const prompt = `
    Analyze this civic complaint.
    Title: "${title}"
    Description: "${description}"

    Based on the title, description, and the provided images, categorize the complaint into EXACTLY ONE of the following categories:
    ${CATEGORIES.map(c => `- ${c}`).join('\n')}

    Reply with ONLY the exact category name from the list above. Do not add quotes, explanation, or any other text.
    If it doesn't fit anything, reply "Other".
    `;

    const parts: any[] = [{ text: prompt }];

    for (const base64Str of imageBase64List) {
      parts.push({
        inlineData: {
          data: base64Str,
          mimeType: 'image/jpeg'
        }
      });
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    const categoryResult = response.text().trim();

    // Verify it's exactly in our list
    if (CATEGORIES.includes(categoryResult)) {
      return categoryResult;
    }
    
    return 'Other';
  } catch (error) {
    console.error('Gemini classification error:', error);
    return 'Other';
  }
}
