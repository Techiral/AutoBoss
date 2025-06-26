
'use server';

import axios from 'axios';

/**
 * @fileOverview A flow for generating agent images using a custom provider.
 *
 * - generateAgentImage - Creates an image from a prompt and returns a Data URI.
 */

export async function generateAgentImage(prompt: string): Promise<string | null> {
  const apiKey = process.env.A4F_API_KEY;
  const timestamp = new Date().toISOString();

  if (!apiKey) {
    console.error(`[${timestamp}] [Image Gen Flow] Error: A4F_API_KEY is not set in .env file.`);
    return null;
  }

  console.log(`[${timestamp}] [Image Gen Flow] Generating image with custom provider.`);

  try {
    const response = await axios.post(
      "https://api.a4f.co/v1/images/generations",
      {
        model: "provider-2/flux.1-schnell",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const imageUrl = response.data?.data?.[0]?.url;

    if (!imageUrl) {
      console.error(`[${timestamp}] [Image Gen Flow] API did not return a valid image URL.`, response.data);
      throw new Error('Image generation failed: No URL returned from provider.');
    }

    console.log(`[${timestamp}] [Image Gen Flow] Fetching generated image from URL: ${imageUrl.substring(0, 50)}...`);
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data, 'binary');
    const mimeType = imageResponse.headers['content-type'] || 'image/png';
    const base64Image = imageBuffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64Image}`;

    console.log(`[${timestamp}] [Image Gen Flow] Successfully generated and converted image to Data URI.`);
    return dataUri;

  } catch (error: any) {
    console.error(`[${timestamp}] [Image Gen Flow] Critical error during image generation:`, error.response?.data || error.message);
    let userFriendlyError = 'The image generation service failed.';
    if (error.response?.data?.error?.message) {
        userFriendlyError += ` Provider message: ${error.response.data.error.message}`;
    }
    throw new Error(userFriendlyError);
  }
}
