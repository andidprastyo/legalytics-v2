import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import { extractDataFromPDFs } from '../../lib/pdfService';
import { extractAndGenerateInsights } from '../../lib/groqService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const pdfDir = path.resolve('src/docs');
    console.log(`Resolved PDF directory path: ${pdfDir}`);

    const pdfData = await extractDataFromPDFs(pdfDir);
    const combinedResults = await extractAndGenerateInsights(pdfData);

    res.status(200).json(combinedResults);
  } catch (error) {
    console.error('Error in API handler:', error);
    res.status(500).json({ error: "An error occurred while extracting data from PDFs and generating insights" });
  }
}
