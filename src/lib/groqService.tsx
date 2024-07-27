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
    model: "llama3-8B-8192",
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
    description: string;
  }[];

  monetary_values: {
    amount: string;
    description: string;
  }[];

  citations: {
    law_title: string;
    description: string;
  }[];

  wordcloud: string[];
}> {
  const extractionPrompt = `
  You are an AI assistant specialized in extracting specific information from Indonesian legal and financial documents. Analyze the following text and extract:

  1. Dates: Include only dates in this format: [day] [month] [year] (example: 21 Januari 2021). Ignore single years.
  2. Monetary values: Find monetary amounts, especially in Indonesian Rupiah (IDR/Rp). Include amounts written in words.
  3. Citation references: Extract any references to laws, regulations, or legal documents. These are often found in "mengingat" sections.
  4. Wordcloud: Identify 10 key phrases or terms that are most relevant and important to the document's content.

  Be thorough and extract all instances you can find. Use Bahasa Indonesia for the context explanations.
  
  Text to analyze:
  ${text}
  
  Format your response as follows:
  
  **Dates:**
  * [extracted date] - [context explanation]
  **Monetary values:**
  * [extracted amount] - [context explanation]
  **Citations:**
  * [extracted citation] - [context explanation]
  **Wordcloud:**
  [list of 10 key phrases or terms, separated by commas]

  If no information is found for a category, state "No information found" for that category.
`;

  console.log("Sending extraction prompt to Groq API");
  const groqResponse = await getGroqChatCompletion(extractionPrompt);
  console.log("Received response from Groq API");
  console.log("Groq response:", groqResponse);

  const dates: { date: string; description: string }[] = [];
  const monetary_values: { amount: string; description: string }[] = [];
  const citations: { law_title: string; description: string }[] = [];
  let wordcloud: string[] = [];

  const lines = groqResponse.split("\n");
  let currentSection = "";

  console.log("Parsing Groq API response");
  for (const line of lines) {
    if (line.startsWith("**Dates:**")) {
      currentSection = "dates";
    } else if (line.startsWith("**Monetary values:**")) {
      currentSection = "monetary_values";
    } else if (line.startsWith("**Citations:**")) {
      currentSection = "citations";
    } else if (line.startsWith("**Wordcloud:**")) {
      currentSection = "wordcloud";
    } else if (line.trim().startsWith("*")) {
      const content = line.trim().substring(1).trim();
      switch (currentSection) {
        case "dates":
          const [date, dateDescription] = content.split(" - ");
          dates.push({ date, description: await generateDescription(content, "date") });
          break;
        case "monetary_values":
          if (content !== "No monetary values extracted") {
            const [amount, valueDescription] = content.split(" - ");
            monetary_values.push({ amount, description: await generateDescription(content, "monetary value") });
          }
          break;
        case "citations":
          const [law_title, citationDescription] = content.split(" - ");
          citations.push({ law_title, description: await generateDescription(content, "citation") });
          break;
      }
    } else if (currentSection === "wordcloud" && line.trim() !== "") {
      wordcloud = line.trim().split(", ").map(term => term.trim());
      currentSection = ""; // Reset currentSection after processing wordcloud
    }
  }

  console.log(
    `Extracted: ${dates.length} dates, ${monetary_values.length} monetary values, ${citations.length} citations, ${wordcloud.length} wordcloud terms`
  );
  console.log("Wordcloud terms:", wordcloud);

  return { dates, monetary_values, citations, wordcloud };
}

export async function extractAndGenerateInsights(docTexts: {
  [key: string]: string;
}): Promise<{
  [key: string]: {
    dates: {
      date: string;
      description: string;
    }[];

    monetary_values: {
      amount: string;
      description: string;
    }[];

    citations: {
      law_title: string;
      description: string;
    }[];

    wordcloud: string[];
  };
}> {
  const extractedData: {
    [key: string]: {
      dates: {
        date: string;
        description: string;
      }[];

      monetary_values: {
        amount: string;
        description: string;
      }[];

      citations: {
        law_title: string;
        description: string;
      }[];

      wordcloud: string[];
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
        wordcloud: [],
      };
    }
  }

  return extractedData;
}