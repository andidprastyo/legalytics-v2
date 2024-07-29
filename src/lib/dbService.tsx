import { MongoClient, Db } from 'mongodb';

let cachedDb: Db | null = null;

async function connectToDatabase(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  if (!process.env.MONGODB_URL) {
    throw new Error('Please define the MONGODB_URL environment variable');
  }

  const client = await MongoClient.connect(process.env.MONGODB_URL ?? 'legalyticsv2_db');
  const db = client.db(process.env.MONGODB_DB_NAME);
  cachedDb = db;
  return db;
}

export async function findDocumentByFilename(filename: string) {
  const db = await connectToDatabase();
  const collection = process.env.MONGODB_COLLECTION_NAME ?? 'parsed_data';
  return db.collection(collection).findOne({ filename });
}

export async function getAllDocuments() {
  const db = await connectToDatabase();
  const collection = process.env.MONGODB_COLLECTION_NAME ?? 'parsed_data';
  return db.collection(collection).find({}).toArray();
}

export async function updateDocumentWithExtractedData(id: string, extractedData: any) {
  const db = await connectToDatabase();
  const collection = process.env.MONGODB_COLLECTION_NAME ?? 'parsed_data';
  return db.collection(collection).updateOne(
    { id },
    { $set: { extractedData } }
  );
}

export async function updateDocumentWithInsights(id: string, insights: any) {
  const db = await connectToDatabase();
  const collection = process.env.MONGODB_COLLECTION_NAME ?? 'parsed_data';
  return db.collection(collection).updateOne(
    { id },
    { $set: { insights } }
  );
}

