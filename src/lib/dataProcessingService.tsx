import { extractInsightsFromText } from './groqService';
import { saveExtractedData } from './dbService';

export async function processDocumentContent(document: any) {
  const fullText = document.content.map((page: { text: any; }) => page.text).join(' ');
  
  const insights = await extractInsightsFromText(fullText);
  await saveExtractedData(document._id.toString(), insights);
  
  return { ...document, insights };
}