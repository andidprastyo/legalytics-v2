import type { NextApiRequest, NextApiResponse } from 'next';
import { findDocumentByFilename, getAllDocuments } from '../../lib/dbService';
import { processDocumentContent } from '../../lib/dataProcessingService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { filename } = req.query;

    if (filename) {
      const document = await findDocumentByFilename(filename as string);
      if (document) {
        const processedDocument = await processDocumentContent(document);
        res.status(200).json({ [filename.toString()]: processedDocument });
      } else {
        res.status(404).json({ error: "Document not found" });
      }
    } else {
      const documents = await getAllDocuments();
      const processedDocuments = await Promise.all(
        documents.map(async (doc) => {
          const processedDoc = await processDocumentContent(doc);
          return [doc.filename, processedDoc];
        })
      );
      res.status(200).json(Object.fromEntries(processedDocuments));
    }
  } catch (error) {
    console.error('Error in API handler:', error);
    res.status(500).json({ error: "An error occurred while fetching data" });
  }
}