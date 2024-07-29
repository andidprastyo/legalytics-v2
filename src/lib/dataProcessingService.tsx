import { extractInsightsFromText } from './groqService';
import { updateDocumentWithInsights } from './dbService';

export async function processDocumentContent(document: any) {
  const fullText = document.content.map((page: { text: any; }) => page.text).join(' ');
  
  if (!document.insights) {
    const insights = await extractInsightsFromText(fullText);
    await updateDocumentWithInsights(document.id, insights);
    return { ...document, insights };
  }
  
  return document;
}