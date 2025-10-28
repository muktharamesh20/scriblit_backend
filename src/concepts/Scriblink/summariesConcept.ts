import { Collection, Db } from "npm:mongodb";
// Assuming these types are defined in your project as per the example context
// For instance:
// export type ID = string;
// export type Empty = Record<string, never>;
import { Empty, ID } from "@utils/types.ts";
import { Config, GeminiLLM } from "./gemini-llm.ts";

// --- START: External LLM and Config Utilities (adapted from provided Summarizer example) ---
// These would typically reside in separate files (e.g., `gemini-llm.ts`, `config.ts`)
// but are included here for a self-contained solution as per the prompt's context.

/**
 * Loads the API configuration, prioritizing environment variables.
 * Adapts `loadConfig` from the Summarizer example for a Deno environment.
 */

function loadConfig(): Config {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (GEMINI_API_KEY && GEMINI_API_KEY.trim()) {
    return { apiKey: GEMINI_API_KEY.trim() } as Config;
  }
  console.warn(
    "❌ Warning: GEMINI_API_KEY environment variable not set. LLM calls will use a MOCK_API_KEY.",
  );
  return { apiKey: "GEMINI_API_KEY_NOT_SET" };
}
// --- END: External LLM and Config Utilities ---

// Collection prefix to ensure namespace separation in MongoDB
const PREFIX = "Summary" + ".";

// Re-using Item from the example's context
type Item = ID;

/**
 * Internal entity type for a Summary document stored in MongoDB.
 * The `_id` of this document is the `Item` ID it summarizes.
 */
interface SummaryDocument {
  _id: Item; // The ID of the Item being summarized
  summary: string; // The concise summary text
}

/**
 * @concept Summaries
 * @purpose To highlight the most important part of an Item.
 */
export default class SummariesConcept {
  summariesCollection: Collection<SummaryDocument>;
  private llm: GeminiLLM;
  private readonly summaryPromptTemplate: string;

  constructor(private readonly db: Db) {
    this.summariesCollection = this.db.collection(PREFIX + "summaries");
    const config = loadConfig();
    this.llm = new GeminiLLM(config);

    // The core prompt from the Summarizer example, adjusted for direct integration.
    this.summaryPromptTemplate =
      `Summarize the following notes to help a student understand the concept better.
	If you detect that your summary might not match the topic or meaning of the notes, do not output a summary — instead, respond with:
	"The summary could not be generated because the content was unclear or unrelated."
	Provide only the summary itself, with no meta-language.
  Do not use phrases like "the following is a summary" or "in summary".
	Write bullet points that highlight key ideas, steps, or common mistakes,
	but make it like a table of contents and keep it very concise.
	Again, to reiterate, keep it as concise as possible, making it at most 40% of the total transcript length.
	Try writing 3–5 bullet points total.
	Make sure that you only add high level concepts, not detailed steps.
	Keep it accurate, relevant, and tied directly to the notes provided.
  Keep it under 180 words.`;
  }

  /**
   * Action: Sets or updates a summary for a given item manually.
   *
   * @param summary The summary string provided by the user.
   * @param item The ID of the Item to summarize.
   * @effects If `item` already exists, change its summary. If not, create a new summary for `item`.
   * @returns The created/updated summary document, or an error.
   */
  async setSummary(
    { summary, item }: { summary: string; item: Item },
  ): Promise<SummaryDocument | { error: string }> {
    // Validate summary against invariants before saving.
    // For manual summaries, we cannot reliably check length ratio or content relevance
    // against the original item content unless it's explicitly passed or fetched.
    // However, the absolute word count limit and meta-language check can still be applied.
    if (summary.trim().length === 0) {
      return { error: "Summary cannot be empty." };
    }

    const result = await this.summariesCollection.updateOne(
      { _id: item },
      { $set: { summary: summary } },
      { upsert: true }, // Create if not exists, update if exists
    );

    if (result.acknowledged) {
      return { _id: item, summary: summary };
    } else {
      return { error: `Failed to set manual summary for item ${item}.` };
    }
  }

  /**
   * Action: Generates a summary for an item using an LLM and associates it with the item.
   *
   * @param text The full content of the Item to be summarized by the LLM.
   * @param item The ID of the Item to summarize.
   * @requires text is nonempty
   * @effects Creates a summary of `text` with an LLM and associates it with the item.
   * @returns The generated summary document, or an error.
   */
  async setSummaryWithAI(
    { text, item }: { text: string; item: Item },
  ): Promise<SummaryDocument | { error: string }> {
    if (!text || text.trim().length === 0) {
      return { error: "Text to summarize cannot be empty." };
    }

    const fullPrompt = `${this.summaryPromptTemplate}\n\n${text}`;
    let generatedSummary: string;

    try {
      generatedSummary = (await this.llm.executeLLM(fullPrompt)).trim();

      // Validate the AI-generated summary against all invariants
      this.validateSummary(generatedSummary, text);
    } catch (e: any) {
      console.error(
        `Error generating or validating AI summary for item ${item}:`,
        e,
      );
      return {
        error: `Failed to generate or validate AI summary: ${e.message}`,
      };
    }

    // Now, save the validated summary to the database
    const result = await this.summariesCollection.updateOne(
      { _id: item },
      { $set: { summary: generatedSummary } },
      { upsert: true },
    );

    if (result.acknowledged) {
      return { _id: item, summary: generatedSummary };
    } else {
      return { error: `Failed to save AI-generated summary for item ${item}.` };
    }
  }

  // --- Invariant validation methods (adapted from the Summarizer example) ---
  /**
   * Orchestrates the validation of a summary against all defined invariants.
   * @param summary The summary text.
   * @param originalText The original content of the item. Required for relevance and ratio-based length checks.
   * @param checkContentSpecifics If true, perform relevance and ratio-based length checks.
   */
  private validateSummary(
    summary: string,
    originalText: string,
  ): void {
    // Invariant: summary contains no meta-language or AI disclaimers
    this.validateNoMetaLanguage(summary);

    // Invariant: summary is at most 50% the length of the item's content or under 150 words
    this.validateSummaryLength(summary, originalText, 0.5, 150);

    // Invariant: summary is a concise, relevant, and readable highlight of the item's content
    this.validateContentRelevance(summary, originalText);
  }

  /**
   * Validates the length of the summary.
   * Invariant: summary is at most 50% the length of the item's content OR under 150 words.
   * @param summary The summary text.
   * @param originalText The original content of the item (for ratio check).
   * @param maxLengthRatio The maximum allowed ratio of summary words to original text words.
   * @param maxWordCount The absolute maximum word count allowed for the summary.
   */
  private validateSummaryLength(
    summary: string,
    originalText: string,
    maxLengthRatio: number = 0.5,
    maxWordCount: number = 150,
  ): void {
    const summaryWords = summary.split(/\s+/).filter(Boolean).length;

    // Rule 1: If summary is under the absolute word count, it's valid by this rule.
    if (summaryWords <= maxWordCount) {
      return;
    }

    // Rule 2: If summary is over the absolute word count, then it must satisfy the ratio rule.
    const originalWords = originalText.split(/\s+/).filter(Boolean).length;

    if (originalWords === 0) {
      // If original text is not provided or empty, and summary is over maxWordCount, it's invalid.
      throw new Error(
        `SummaryTooLongError: Summary is ${summaryWords} words. Exceeds absolute max of ${maxWordCount} words, and original text content is unavailable for ratio comparison.`,
      );
    }

    const ratio = summaryWords / originalWords;

    if (ratio > maxLengthRatio) {
      throw new Error(
        `SummaryTooLongError: Summary is ${summaryWords} words, which is ${
          (ratio * 100).toFixed(1)
        }% of original text length (${originalWords} words). Exceeds ${
          maxLengthRatio * 100
        }% limit.`,
      );
    }
  }

  /**
   * Validates the relevance of the summary to the original content.
   * Invariant: summary is relevant to the item's content.
   * @param summary The summary text.
   * @param originalText The original content of the item.
   * @param minOverlapRatio Minimum required overlap ratio of meaningful words.
   */
  private validateContentRelevance(
    summary: string,
    originalText: string,
    minOverlapRatio: number = 0.1, // A heuristic, can be adjusted
  ): void {
    // Extract meaningful words (4+ alphanumeric characters) from both texts
    const extractWords = (text: string) =>
      new Set(text.toLowerCase().match(/\b[a-z0-9]{4,}\b/g) || []);

    const originalWords = extractWords(originalText);
    const summaryWords = extractWords(summary);

    if (summaryWords.size === 0) {
      throw new Error(
        "ContentRelevanceError: Summary contains no meaningful words for relevance check.",
      );
    }
    if (originalWords.size === 0) {
      // If original text has no meaningful words, we cannot establish relevance.
      // This might indicate an issue with the original content itself or the relevance check.
      // For now, we'll allow it if there's no original content to compare against.
      return;
    }

    // Find overlap between summary and original text
    const overlap = [...summaryWords].filter((word) => originalWords.has(word));
    const overlapRatio = overlap.length / summaryWords.size;

    if (overlapRatio < minOverlapRatio) {
      throw new Error(
        `ContentRelevanceError: Summary appears unrelated to source text. Only ${
          (
            overlapRatio * 100
          ).toFixed(1)
        }% of summary words overlap with original content (min ${
          minOverlapRatio * 100
        }% required).`,
      );
    }
  }

  /**
   * Validates that the summary does not contain meta-language or AI disclaimers.
   * Invariant: summary contains no meta-language or AI disclaimers.
   * @param summary The summary text.
   */
  private validateNoMetaLanguage(summary: string): void {
    const metaPatterns = [
      "as an ai",
      "i am an ai",
      "i'm an ai",
      "as a language model",
      "i cannot",
      "i'm not able to",
      "i don't have the ability",
      "i'm sorry, but",
      "unfortunately, i",
      "i would need more information",
      "here's a summary",
      "in summary",
      "this text discusses",
      "overall, the passage talks about",
      "the following is a summary",
      "this is a summary",
      "the summary of",
      "to summarize",
      "in conclusion",
      "based on the provided text",
      "the main points are",
      "key takeaways include",
      "this document summarizes",
      "it is important to note",
      "this summary covers",
      "my purpose is to",
      "I do not have personal opinions", // Added more robust patterns
      "i do not have access to",
      "as an artificial intelligence",
      "i can't provide",
      "I am designed to",
      "the summary could not be generated because the content was unclear or unrelated.",
    ];

    const summaryLower = summary.toLowerCase();
    const foundPatterns = metaPatterns.filter((pattern) =>
      summaryLower.includes(pattern)
    );

    if (foundPatterns.length > 0) {
      throw new Error(
        `MetaLanguageError: Found AI meta-language or summary boilerplate: '${
          foundPatterns.join("', '")
        }'`,
      );
    }
  }

  /**
   * Query: Retrieves a summary for a given item.
   * @param item The ID of the item whose summary is sought.
   * @returns The summary document if found, otherwise `null` or an error.
   */
  async getSummary(
    { item }: { item: Item },
  ): Promise<SummaryDocument | { error: string }> {
    try {
      const summaryDoc = await this.summariesCollection.findOne({ _id: item });
      if (!summaryDoc) {
        return { error: `No summary found for item ${item}.` };
      }
      return summaryDoc;
    } catch (e: any) {
      console.error(`Error getting summary for item ${item}:`, e);
      return { error: `Error getting summary for item ${item}: ${e.message}` };
    }
  }

  /**
   * Action: Deletes a summary for a given item.
   * @param item The ID of the item whose summary should be deleted.
   * @effects Removes the summary associated with the specified item.
   */
  async deleteSummary(
    { item }: { item: Item },
  ): Promise<Empty | { error: string }> {
    try {
      const deleteResult = await this.summariesCollection.deleteOne({
        _id: item,
      });
      if (deleteResult.deletedCount === 1) {
        return {};
      } else if (deleteResult.deletedCount === 0) {
        return { error: `No summary found for item ${item} to delete.` };
      } else {
        return { error: `Failed to delete summary for item ${item}.` };
      }
    } catch (e: any) {
      console.error(`Error deleting summary for item ${item}:`, e);
      return { error: `Error deleting summary for item ${item}: ${e.message}` };
    }
  }
}
