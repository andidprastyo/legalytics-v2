import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function getGroqChatCompletion(content: string): Promise<string> {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content,
      },
    ],
    model: "llama3-8b-8192",
  });
  return chatCompletion.choices[0]?.message?.content ?? "";
}

async function generateDescription(value: string, type: string): Promise<string> {
  const prompt = `Generate a brief description for the following ${type}: ${value}`;
  return getGroqChatCompletion(prompt);
}

async function extractInfoFromTextWithGroq(
  text: string
): Promise<{
  dates: { date: string; description: string }[];
  monetary_values: { amount: string; description: string }[];
  citation: {
    law_title: string;
    law_number: string;
    description: string;
  }[];
}> {
  const extractionPrompt = `
    You are an AI assistant specialized in extracting specific information from Indonesian legal and financial documents. Analyze the following text and extract:

    1. Dates: Look for any dates in any format (e.g., DD/MM/YYYY, DD Month YYYY, etc.).
    2. Monetary values: Find any monetary amounts, especially in Indonesian Rupiah (IDR). Include amounts written in words.
    3. Citations: Identify any references to laws, regulations, or decrees. Include the title and number.

    Be thorough and extract all instances you can find. If you're unsure about something, include it and note your uncertainty.

    Examples:
    - Date: 1 Januari 2024
    - Monetary value: Rp1.000.000 (satu juta rupiah)
    - Citation: Peraturan Menteri Keuangan Nomor 46/PMK.01/2024

    Text to analyze:
    ${text}

    Format your response as follows:
    Dates:
    - [extracted date]
    Monetary values:
    - [extracted amount]
    Citations:
    - Law Title: [extracted title], Law Number: [extracted number]

    If no information is found for a category, state "No information found" for that category.
  `;

  console.log("Sending extraction prompt to Groq API");
  console.log("First 500 characters of text:", text.substring(0, 500));
  const groqResponse = await getGroqChatCompletion(extractionPrompt);
  console.log("Received response from Groq API");
  console.log("Groq response:", groqResponse);

  // Parse the text response
  const dates: { date: string; description: string }[] = [];
  const monetary_values: { amount: string; description: string }[] = [];
  const citation: {
    law_title: string;
    law_number: string;
    description: string;
  }[] = [];

  const lines = groqResponse.split("\n");
  let currentSection = "";

  console.log("Parsing Groq API response");
  for (const line of lines) {
    if (line.toLowerCase().includes("dates:")) {
      currentSection = "dates";
    } else if (line.toLowerCase().includes("monetary values:")) {
      currentSection = "monetary_values";
    } else if (line.toLowerCase().includes("citations:")) {
      currentSection = "citation";
    } else if (line.trim().startsWith("-")) {
      const content = line.trim().substring(1).trim();
      switch (currentSection) {
        case "dates":
          dates.push({
            date: content,
            description: await generateDescription(content, 'date')
          });
          break;
        case "monetary_values":
          monetary_values.push({
            amount: content,
            description: await generateDescription(content, 'monetary value')
          });
          break;
        case "citation":
          const lawMatch = content.match(/Law Title:\s*(.+?),\s*Law Number:\s*(.+)/i);
          if (lawMatch) {
            const lawTitle = lawMatch[1].trim();
            const lawNumber = lawMatch[2].trim();
            citation.push({
              law_title: lawTitle,
              law_number: lawNumber,
              description: await generateDescription(`${lawTitle} (${lawNumber})`, 'law')
            });
          }
          break;
      }
    }
  }

  console.log(
    `Extracted: ${dates.length} dates, ${monetary_values.length} monetary values, ${citation.length} citations`
  );

  return { dates, monetary_values, citation };
}

export async function extractAndGenerateInsights(docTexts: {
  [key: string]: string;
}): Promise<{
  [key: string]: {
    dates: { date: string; description: string }[];
    monetary_values: { amount: string; description: string }[];
    citation: {
      law_title: string;
      law_number: string;
      description: string;
    }[];
  };
}> {
  const extractedData: {
    [key: string]: {
      dates: { date: string; description: string }[];
      monetary_values: { amount: string; description: string }[];
      citation: {
        law_title: string;
        law_number: string;
        description: string;
      }[];
    };
  } = {};

  for (const [filename, text] of Object.entries(docTexts)) {
    console.log(`Processing file: ${filename}`);
    console.log(`Text length: ${text.length} characters`);
    try {
      const extractedInfo = await extractInfoFromTextWithGroq(text);
      extractedData[filename] = extractedInfo;
      console.log(`Extraction completed for ${filename}`);
      console.log(`Extracted data:`, JSON.stringify(extractedInfo, null, 2));
    } catch (error) {
      console.error(`Error extracting info from ${filename}:`, error);
      extractedData[filename] = {
        dates: [],
        monetary_values: [],
        citation: [],
      };
    }
  }

  return extractedData;
}