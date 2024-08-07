import type { NextApiRequest, NextApiResponse } from 'next';
import { findDocumentById } from '../../lib/dbService';
import { processDocumentContent } from '../../lib/dataProcessingService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: "Valid Document ID is required" });
    }

    console.log("Attempting to find document with ID:", id);
    const document = await findDocumentById(id);
    
    if (document) {
      console.log("Document found:", document);
      const processedDocument = await processDocumentContent(document);
      res.status(200).json(processedDocument);
    } else {
      console.log("No document found for ID:", id);
      res.status(404).json({ error: "Document not found" });
    }
  } catch (error) {
    console.error('Error in API handler:', error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
}