import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function getGroqChatCompletion(content: string): Promise<string> {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content,
      },
    ],
    model: "llama-3.1-70b-versatile",
  });
  return chatCompletion.choices[0]?.message?.content ?? "";
}

async function generateDescription(
  value: string,
  type: string
): Promise<string> {
  const prompt = `
  Generate a description for the following ${type}: ${value}
  You can use the [context explanation] provided in the extraction response for additional information.
  Be concise and provide a clear and informative description, focusing on the extracted ${value}.
  Use Bahasa Indonesia and ensure the description is relevant to the context.

  If ${value} is 'No information found', simply state "No information found" for the description.
  `;
  return getGroqChatCompletion(prompt);
}

async function extractInfoFromTextWithGroq(text: string): Promise<{
  dates: { 
    date: string; 
    description: string 
  }[];
  
  monetary_values: { 
    amount: string; 
    description: string 
  }[];

  citations: {
    law_title: string;
    description: string;
  }[];
}> {
  const extractionPrompt = `
  You are an AI assistant specialized in extracting specific information from Indonesian legal and financial documents. Analyze the following text and extract:

  1. Dates: Include only this date format:[day] [month] [year], if you find a singular year on the document, ignore it.
  2. Monetary values: Find monetary amounts, especially in Indonesian Rupiah (IDR/Rp). Include amounts written in words.
  3. Citation references: Extract any references to laws, regulations, or legal documents. You can find this in "mengingat" sections.

  Be thorough and extract all instances you can find, use Bahasa Indonesia for the [context explanation].
  Provide the information directly without any prefixes or unnecessary text.

  Text to analyze:
  ${text}

  Format your response as follows:
  Dates:
  - [extracted date] - [context explanation]
  Monetary values:
  - [extracted amount] - [context explanation]
  Citations:
  - [extracted citation] - [context explanation]

  If no information is found for a category, simply state "No information found" for that category and do the same for the description.
`;

  console.log("Sending extraction prompt to Groq API");
  const groqResponse = await getGroqChatCompletion(extractionPrompt);
  console.log("Received response from Groq API");
  console.log("Groq response:", groqResponse);

  // Parse the text response
  const dates: { 
    date: string; 
    description: string 
  }[] = [];
  
  const monetary_values: { 
    amount: string; 
    description: string 
  }[] = [];

  const citations: {
    law_title: string;
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
          const dateMatch = RegExp(/(\d{1,2}\s\w+\s\d{4})/).exec(content);
          if (dateMatch) {
            dates.push({
              date: dateMatch[1],
              description: await generateDescription(content, "date"),
            });
          }
          break;
        case "monetary_values":
          monetary_values.push({
            amount: content,
            description: await generateDescription(content, "monetary value"),
          });
          break;
        case "citation":
          const lawTitleMatch = RegExp(/^(.+?\s\d{4})/).exec(content);
          if(lawTitleMatch) {
            citations.push({
              law_title: lawTitleMatch[1],
              description: await generateDescription(content, "citation"),
            });
          }
          break;
      }
    }
  }

  console.log(
    `Extracted: ${dates.length} dates, ${monetary_values.length} monetary values, ${citations.length} citations`
  );

  return { dates, monetary_values, citations };
}

export async function extractAndGenerateInsights(docTexts: {
  [key: string]: string;
}): Promise<{
  [key: string]: {
    dates: { 
      date: string; 
      description: string 
    }[];
    
    monetary_values: { 
      amount: string; 
      description: string 
    }[];

    citations: {
      law_title: string;
      description: string;
    }[];
  };
}> {
  const extractedData: {
    [key: string]: {
      dates: { 
        date: string; 
        description: string 
      }[];
      
      monetary_values: { 
        amount: string; 
        description: string 
      }[];

      citations: {
        law_title: string;
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
        citations: [],
      };
    }
  }

  return extractedData;
}
