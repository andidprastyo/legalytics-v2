import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error(`Error extracting text from PDF file ${filePath}:`, error);
    throw error;
  }
}

export async function extractDataFromPDFs(pdfDir: string): Promise<{ [key: string]: string }> {
  try {
    const pdfFiles = fs.readdirSync(pdfDir).filter(file => file.endsWith('.pdf'));
    const pdfData: { [key: string]: string } = {};

    for (const file of pdfFiles) {
      const filePath = path.join(pdfDir, file);
      const text = await extractTextFromPDF(filePath);
      pdfData[file] = text;
    }

    return pdfData;
  } catch (error) {
    console.error('Error reading PDF directory or extracting text:', error);
    throw error;
  }
}