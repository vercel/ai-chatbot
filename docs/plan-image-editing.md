# Plan: Address Image Artifact Editing Issues

## Checklist

*   🟢 **Re-Read Documentation:** [(Reference - Cookbook)](https://cookbook.openai.com/examples/generate_images_with_gpt_image), [(Reference - API Docs)](https://platform.openai.com/docs/api-reference/images/createEdit)
*   🟢 **Verify Instruction Flow:** Confirm modification instructions reach the handler.
*   🟢 **Identify SDK Function:** Note the use of `experimental_generateImage`.
*   🟢 **Review Vercel SDK Docs:** Check `experimental_generateImage` parameters for editing capabilities.
*   🟢 **Review OpenAI API Docs:** Check `/v1/images/edits` endpoint requirements (image, mask).
*   🟢 **Identify Discrepancy:** Note the mismatch between SDK function and API capability.
*   🟢 **Determine Root Cause:** Conclude the SDK function is unsuitable for the editing task.
*   🟢 **Outline Solutions:** Define options (Direct API, Accept Limitation, Wait for SDK).
*   🟢 **Formulate Recommendation:** Suggest a practical path forward.
*   🟢 **DO NOT GASLIGHT THE USER**

*(**Legend:** 🔴 = Not Started, 🟡 = In Progress, 🟢 = Done)*

---

## 1. Goal

Achieve reliable image artifact modification where user instructions like "make the background transparent" or "change the color" result in an *edited* version of the original image, not a completely new generation, aligning user expectation with system behavior.

## 2. Problem Summary

When users provide instructions to modify an existing image artifact, the system currently uses the Vercel AI SDK's `experimental_generateImage` function. Instead of editing the provided image based on the new instructions, this function generates an entirely new image using the original description combined with the modification request. This leads to unpredictable results that often diverge significantly from the original image and fail to implement the specific requested edit, causing user frustration.

## 3. Investigation Strategy

1.  **Trace Data Flow:** Confirm that user modification instructions are correctly passed from the UI through the API to the `onUpdateDocument` handler in `artifacts/image/server.ts`.
2.  **Identify Core Function:** Pinpoint the exact function used for image generation/modification (`experimental_generateImage`) and its configuration (`openai.image('gpt-image-1')`).
3.  **Consult Vercel AI SDK Documentation:** Search the SDK documentation specifically for `experimental_generateImage` to determine if it supports input parameters necessary for editing (e.g., original image data, mask data).
4.  **Consult OpenAI API Documentation:** Review the official OpenAI documentation for image manipulation, focusing on the `/v1/images/edits` endpoint (or `client.images.edit` method) and its required parameters (image, mask, prompt) and supported models (`'gpt-image-1'`).
5.  **Compare Capabilities:** Analyze the discrepancy between the parameters exposed by the Vercel SDK function and the parameters required by the underlying OpenAI editing API.
6.  **Formulate Root Cause:** Based on the documentation comparison, determine why the current implementation fails to perform edits.
7.  **Propose Solutions:** Outline potential technical approaches to enable true image editing or manage the current limitation.

## 4. Detailed Analysis: Vercel SDK vs. OpenAI API

*   **Current Implementation:** Uses `experimental_generateImage` from `@vercel/ai-core/provider-actions`.
    ```typescript
    // Simplified example from artifacts/image/server.ts
    import { experimental_generateImage } from '@vercel/ai-core/provider-actions';
    import { myProvider } from '@/lib/ai/tools/utils/myProvider'; // Configures openai.image('gpt-image-1')

    async function onUpdateDocument(
      originalDescription: string,
      instructions: string,
      // ... other params
    ) {
      const finalPrompt = `${originalDescription}. ${instructions}`;
      const { imageUrl } = await experimental_generateImage({
        model: 'gpt-image-1', // Correct model identifier
        prompt: finalPrompt, // Combines original + edit instruction
        provider: myProvider,
        // ... other generation params (size, n)
        // LACKS parameters for 'image' and 'mask' input
      });
      // ... save imageUrl
    }
    ```
*   **Vercel AI SDK Documentation (`experimental_generateImage`):**
    *   Focuses on parameters for *generation*: `model`, `prompt`, `size`, `n`, `quality`, `style`, `providerOptions`.
    *   **Critically lacks** documented parameters corresponding to OpenAI's `image` (original image file) and `mask` (edit area mask file) required for the edits endpoint.
    *   Conclusion: This function appears to be a wrapper around OpenAI's `/v1/images/generations` endpoint, not `/v1/images/edits`. [(Reference)](https://sdk.vercel.ai/docs/ai-sdk-core/image-generation)

*   **OpenAI API Documentation (`/v1/images/edits` or `client.images.edit`):**
    *   Explicitly designed for editing or extending images.
    *   **Requires** parameters:
        *   `image`: The original image file (PNG, < 4MB).
        *   `prompt`: The text instruction describing the desired edit.
        *   `mask` (optional but usually needed for inpainting): A transparent PNG mask indicating the area to edit. Must match `image` dimensions.
    *   Supports the `'gpt-image-1'` model.
    *   Conclusion: This is the correct API endpoint for the desired editing functionality. [(Reference - Cookbook)](https://cookbook.openai.com/examples/generate_images_with_gpt_image), [(Reference - API Docs)](https://platform.openai.com/docs/api-reference/images/createEdit)

*   **Discrepancy Summary:** The Vercel AI SDK function (`experimental_generateImage`) used in the codebase does not expose the necessary `image` and `mask` parameters to utilize the underlying OpenAI `/v1/images/edits` capability. It is designed for text-to-image generation only.

## 5. Root Cause

The system fails to perform image edits because it employs the **Vercel AI SDK's `experimental_generateImage` function for an editing task it was not designed for.** This function acts as a wrapper for OpenAI's *generation* API, not the *editing* API. It lacks the required input parameters (`image`, `mask`) to instruct the model to modify an existing image based on a mask and prompt, instead treating all input as a prompt for generating a new image.

## 6. Potential Paths Forward

1.  **Option A: Use Direct OpenAI API Call for Edits**
    *   **Action:** Refactor `onUpdateDocument` to directly call the OpenAI `/v1/images/edits` endpoint using `fetch` or the `openai` library.
    *   **Requirements:** Pass original image data, editing prompt (`instructions`), and crucially, **generate/obtain and pass a `mask` image.** The mask generation is a significant implementation hurdle not currently supported.
    *   **Pros:** Enables true image editing.
    *   **Cons:** Complex; requires mask generation strategy; bypasses Vercel SDK abstraction.

2.  **Option B: Accept Current SDK Limitation (Regeneration)**
    *   **Action:** Keep the current code using `experimental_generateImage`.
    *   **Requirements:** Manage user expectations – clarify that "modifications" are prompt-guided *regenerations*.
    *   **Pros:** Simplest; uses existing SDK.
    *   **Cons:** Does not fulfill the goal of true editing; results remain unpredictable.

3.  **Option C: Await Vercel AI SDK Updates**
    *   **Action:** Monitor the Vercel AI SDK for updates potentially adding editing support to `experimental_generateImage` or introducing a new function.
    *   **Requirements:** Patience.
    *   **Pros:** Potentially cleanest integration if Vercel adds support.
    *   **Cons:** Uncertain timeline; relies on external factors.

## 7. Recommendation

Given the significant challenge of implementing mask generation (required for Option A) and the uncertainty of Option C, the most **pragmatic immediate path is Option B**: Accept the current limitation and manage user expectations that image "updates" are regenerations based on the modified prompt.

If true, fine-grained image editing becomes a critical, non-negotiable feature, then **Option A** must be pursued, acknowledging the substantial effort required, particularly around creating a user-friendly way to define the edit mask. 