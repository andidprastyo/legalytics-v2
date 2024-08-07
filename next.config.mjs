/** @type {import('next').NextConfig} */
const nextConfig = {
	env: {
	  MONGODB_URL: process.env.MONGODB_URL,
	  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
	  MONGODB_COLLECTION_NAME: process.env.MONGODB_COLLECTION_NAME,
	  GROQ_API_KEY: process.env.GROQ_API_KEY,
	},
  };
  
  export default nextConfig;
  