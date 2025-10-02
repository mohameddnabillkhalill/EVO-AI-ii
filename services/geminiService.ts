import { GoogleGenAI, Modality } from "@google/genai";

interface ImageData {
  data: string;
  mimeType: string;
}

interface GenerateImageParams {
  design: ImageData;
  product: ImageData;
  logo: ImageData;
  aspectRatio: string;
}

interface ModifyImageParams {
  baseImage: ImageData;
  prompt: string;
}

const apiKey = process.env.API_KEY;
if (!apiKey) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });

export const generateProductImage = async ({ design, product, logo, aspectRatio }: GenerateImageParams): Promise<string | null> => {
  const prompt = `You are an expert AI image editor with a specialized task. Your goal is to create a photorealistic composite image by following a strict set of rules. Failure to follow these rules precisely will result in an incorrect output.

**Image Inputs & Their Roles:**
1.  **First Image ("التصميم"):** This is the Reference Image. It provides the complete, unchangeable background, environment, lighting, and perspective.
2.  **Second Image ("صورتك"):** This is the Product Image. It contains the user's product to be extracted.
3.  **Third Image ("لوجو"):** This is the Logo Image. It is the logo to be placed as a watermark.

**Strict Processing Rules (No Exceptions):**

**1. Background & Style Rule:**
   - **MUST USE:** The background, environment, perspective, and lighting **ONLY** from the first image ("التصميم").
   - **MUST NOT:** Use, mix, or blend any part of the background from the second image ("صورتك"). The final background must be **identical** to the first image.

**2. Product Replacement Rule:**
   - **EXTRACT:** From the second image ("صورتك"), extract **only the product** (e.g., T-shirt, pants, shirt, jacket, shorts). Ignore its original background and lighting completely.
   - **REPLACE:** Perfectly replace the product in the first image ("التصميم") with the extracted product from the second image.
   - **PRESERVE DETAILS:** The user's product must retain **all** of its original details from their photo with absolute fidelity: texture, stitching, folds, colors, proportions, and imperfections.
   - **ERASE OLD PRODUCT:** Ensure absolutely no trace of the original product from the first image ("التصميم") remains in the final output.

**3. Logo Placement Rule:**
   - **ADD LOGO:** Take the logo from the third image ("لوجو").
   - **POSITION:** Place it **ONLY** in the **top-left corner** of the final composite image.
   - **LOCATION:** The logo **MUST BE** placed outside the product area, acting as a watermark for the entire scene.
   - **BACKGROUND:** The logo **MUST ALWAYS** have a transparent background, removing any solid background it might have.
   - **STYLING:** The logo must be small, proportional, and clearly visible without being intrusive.

**4. Output Specifications:**
   - **ASPECT RATIO:** The final output image **MUST** have an aspect ratio of exactly **${aspectRatio}**.
   - **FORMULA:** Final Image = [Background & Lighting from "التصميم"] + [Product ONLY from "صورتك"] + [Transparent Logo from "لوجو" in Top-Left Corner]

The output must be a single, photorealistic, clean, and seamless image. Adhere to these instructions without deviation.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { data: design.data, mimeType: design.mimeType } },
          { inlineData: { data: product.data, mimeType: product.mimeType } },
          { inlineData: { data: logo.data, mimeType: logo.mimeType } },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("فشل الاتصال بخدمة الذكاء الاصطناعي.");
  }
};

export const modifyGeneratedImage = async ({ baseImage, prompt }: ModifyImageParams): Promise<string | null> => {
  const modificationPrompt = `You are a sophisticated AI image editor. Your task is to modify the provided image based on the user's instructions.

**User's Instruction:** "${prompt}"

**Rules:**
1. Apply the user's instruction precisely to the image.
2. Do not alter any other part of the image that is not related to the instruction.
3. Maintain the photorealistic quality and style of the original image.
4. Output only the final, modified image. Do not output text.

For example, if the user says "change the logo position to the bottom-right corner", you must move the existing logo to that corner without changing anything else. If the user says "add the text 'Sale' in red", you must add that text overlay creatively.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          { text: modificationPrompt },
          { inlineData: { data: baseImage.data, mimeType: baseImage.mimeType } },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error calling Gemini API for modification:", error);
    throw new Error("فشل الاتصال بخدمة الذكاء الاصطناعي لتطبيق التعديلات.");
  }
};