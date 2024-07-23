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

async function generateDescription(
  value: string,
  type: string
): Promise<string> {
  const prompt = `Generate a brief description for the following ${type}: ${value} without any unnecessary prefixes or text but still informative and important.`;
  return getGroqChatCompletion(prompt);
}

async function extractInfoFromTextWithGroq(text: string): Promise<{
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

  1. Dates: Look for dates in the format (DD MM YYYY) ONLY. Explain the context of each date according to the document.
  2. Monetary values: Find monetary amounts, especially in Indonesian Rupiah (IDR). Include amounts written in words. Explain the context of each amount according to the document.
  3. Citations: Identify any references to laws, regulations, or decrees. Include the title and number. You can find this reference in "Mengingat" sections.

  Be thorough and extract all instances you can find.
  Provide the information directly without any prefixes or unnecessary text.

  Text to analyze:
  ${text}

  Format your response as follows:
  Dates:
  - [extracted date] - [context explanation]
  Monetary values:
  - [extracted amount] - [context explanation]
  Citations:
  - [extracted title]
  - [extracted number]

  If no information is found for a category, simply state "No information found" for that category and do the same for the description.
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
            description: await generateDescription(content, "date"),
          });
          break;
        case "monetary_values":
          monetary_values.push({
            amount: content,
            description: await generateDescription(content, "monetary value"),
          });
          break;
        case "citation":
          const citationRegex = /(.+?):\s*(.+)/;
          const citationMatch = citationRegex.exec(content);
          if (citationMatch) {
            const fullTitle = citationMatch[1].trim();
            const details = citationMatch[2].trim();

            const lawNumberMatch = /Nomor\s+(\d+)/i.exec(fullTitle);
            const lawNumber = lawNumberMatch ? lawNumberMatch[1] : "";

            const lawTitle = fullTitle.replace(/Nomor\s+\d+.*$/i, "").trim();

            citation.push({
              law_title: lawTitle,
              law_number: lawNumber,
              description: await generateDescription(
                `${fullTitle}: ${details}`,
                "law"
              ),
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
