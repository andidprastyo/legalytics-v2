import { MongoClient, Db, ObjectId } from 'mongodb';

let cachedDb: Db | null = null;

async function connectToDatabase(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  const mongoUrl = process.env.MONGODB_URL;
  const dbName = process.env.MONGODB_DB_NAME;

  if (!mongoUrl) {
    throw new Error('Please define the MONGODB_URL environment variable');
  }

  if (!dbName) {
    throw new Error('Please define the MONGODB_DB_NAME environment variable');
  }

  const client = await MongoClient.connect(mongoUrl);
  const db = client.db(dbName);
  cachedDb = db;
  return db;
}

export async function getAllDocuments() {
  const db = await connectToDatabase();
  const collectionName = process.env.MONGODB_COLLECTION_NAME;

  if (!collectionName) {
    throw new Error('Please define the MONGODB_COLLECTION_NAME environment variable');
  }

  return db.collection(collectionName).find({}).toArray();
}

export async function updateDocumentWithExtractedData(id: string, extractedData: any) {
  const db = await connectToDatabase();
  const collectionName = process.env.MONGODB_COLLECTION_NAME;

  if (!collectionName) {
    throw new Error('Please define the MONGODB_COLLECTION_NAME environment variable');
  }

  return db.collection(collectionName).updateOne(
    { _id: new ObjectId(id) },
    { $set: { extractedData } }
  );
}

export async function findDocumentById(id: string) {
  const db = await connectToDatabase();
  const collectionName = process.env.MONGODB_COLLECTION_NAME;

  if (!collectionName) {
    throw new Error('Please define the MONGODB_COLLECTION_NAME environment variable');
  }

  // Search by the 'id' field instead of '_id'
  return db.collection(collectionName).findOne({ id: id });
}

export async function saveExtractedData(id: string, extractedData: any) {
  const db = await connectToDatabase();
  const extractedDataCollectionName = process.env.MONGODB_EXTRACTED_DATA_COLLECTION_NAME;

  if (!extractedDataCollectionName) {
    throw new Error('Please define the MONGODB_EXTRACTED_DATA_COLLECTION_NAME environment variable');
  }

  return db.collection(extractedDataCollectionName).updateOne(
    { originalDocumentId: id },
    { $set: extractedData },
    { upsert: true }
  );
}

export async function updateDocumentWithInsights(id: string, insights: any) {
  const db = await connectToDatabase();
  const collectionName = process.env.MONGODB_COLLECTION_NAME;

  if (!collectionName) {
    throw new Error('Please define the MONGODB_COLLECTION_NAME environment variable');
  }

  return db.collection(collectionName).updateOne(
    { _id: new ObjectId(id) },
    { $set: { insights } }
  );
}
