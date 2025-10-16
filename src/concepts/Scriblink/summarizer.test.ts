import {
  assertEquals,
  assertExists,
  assertNotEquals,
  assertRejects,
  assertThrows,
} from "jsr:@std/assert";
import { stub } from "jsr:@std/testing/mock";
import { freshID, testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import SummariesConcept from "./summarizer.ts";
import { GeminiLLM } from "./gemini-llm.ts"; // Required to mock its method

// Test data
const ITEM_ID_1 = freshID();
const ITEM_ID_2 = freshID();
const ITEM_ID_NON_EXISTENT = freshID();

const SAMPLE_TEXT_SHORT =
  "The quick brown fox jumps over the lazy dog. This is a short piece of text.";
const SAMPLE_SUMMARY_SHORT = "• Fox is quick\n• Dog is lazy";

const SAMPLE_TEXT_LONG = `
In the realm of theoretical physics, quantum entanglement is a phenomenon
where two or more particles become linked in such a way that they share the
same fate, regardless of the distance separating them. This means that
measuring the quantum state of one entangled particle instantly influences
the state of its partner, even if they are light-years apart. Albert Einstein
famously referred to this as "spooky action at a distance." This concept
challenges classical notions of locality and has profound implications for
our understanding of reality, paving the way for technologies like quantum
computing and quantum cryptography. The measurement problem in quantum mechanics
is closely related, questioning when and how a quantum superposition
collapses into a definite state.
`;
const SAMPLE_SUMMARY_LONG_VALID = `
• Quantum entanglement: linked particles share fate
• Instant influence regardless of distance ("spooky action")
• Challenges classical locality
• Key for quantum computing/cryptography
`;

const SAMPLE_SUMMARY_TOO_LONG_FOR_SHORT_TEXT = `
The quick brown fox is a fascinating creature, known for its incredible speed and agility.
It often hunts small prey and is a common sight in many ecosystems. The lazy dog, on the
other hand, represents a more sedentary lifestyle, enjoying naps in the sun and minimal
physical exertion. This contrast highlights different approaches to life in the animal kingdom.
`; // ~60 words for a ~16 word text, > 50% ratio and > 150 words

const SAMPLE_SUMMARY_WITH_METALANGUAGE = `
As an AI, I have summarized the following text. The main points are:
• Quantum entanglement: linked particles share fate
• Instant influence regardless of distance
`;

const SAMPLE_SUMMARY_UNRELATED = `
The capital of France is Paris. It is famous for the Eiffel Tower and its rich history.
Many tourists visit Paris each year to enjoy its culture and cuisine.
`;

const LLM_UNSUCCESSFUL_GENERATION_MESSAGE =
  "The summary could not be generated because the content was unclear or unrelated.";

Deno.test("Constructor: Initializes SummariesConcept correctly", async () => {
  const [db, client] = await testDb();
  try {
    const concept = new SummariesConcept(db);
    assertExists(concept.summariesCollection);
    assertEquals(
      concept.summariesCollection.collectionName,
      "Summary.summaries",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: setSummary successfully creates a new summary", async () => {
  const [db, client] = await testDb();
  const concept = new SummariesConcept(db);

  try {
    const result = await concept.setSummary({
      item: ITEM_ID_1,
      summary: SAMPLE_SUMMARY_SHORT,
    });
    assertNotEquals(
      "error" in result,
      true,
      "setSummary should not return an error on creation.",
    );
    const summaryDoc = result as { _id: ID; summary: string };
    assertEquals(summaryDoc._id, ITEM_ID_1);
    assertEquals(summaryDoc.summary, SAMPLE_SUMMARY_SHORT);

    const fetched = await concept.getSummary({ item: ITEM_ID_1 });
    assertExists(fetched, "getSummary should not return null");
    assertNotEquals("error" in fetched, true, "getSummary should not error");
    assertEquals(
      (fetched as { _id: ID; summary: string })?.summary,
      SAMPLE_SUMMARY_SHORT,
      "Fetched summary should match created summary",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: setSummary successfully updates an existing summary", async () => {
  const [db, client] = await testDb();
  const concept = new SummariesConcept(db);
  const updatedSummary = "An updated summary.";

  try {
    // Create initial summary
    await concept.setSummary({
      item: ITEM_ID_2,
      summary: SAMPLE_SUMMARY_SHORT,
    });

    // Update summary
    const updateResult = await concept.setSummary({
      item: ITEM_ID_2,
      summary: updatedSummary,
    });
    assertNotEquals(
      "error" in updateResult,
      true,
      "setSummary should not return an error on update.",
    );
    const summaryDoc = updateResult as { _id: ID; summary: string };
    assertEquals(summaryDoc._id, ITEM_ID_2);
    assertEquals(summaryDoc.summary, updatedSummary);

    const fetched = await concept.getSummary({ item: ITEM_ID_2 });
    assertExists(fetched, "getSummary should not return null");
    assertNotEquals("error" in fetched, true, "getSummary should not error");
    assertEquals(
      (fetched as { _id: ID; summary: string })?.summary,
      updatedSummary,
      "Fetched summary should match updated summary",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: setSummary returns error for empty summary", async () => {
  const [db, client] = await testDb();
  const concept = new SummariesConcept(db);

  try {
    const result = await concept.setSummary({ item: ITEM_ID_1, summary: "" });
    assertEquals(
      "error" in result,
      true,
      "setSummary should return an error for an empty summary.",
    );
    assertEquals(
      (result as { error: string }).error,
      "Summary cannot be empty.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Query: getSummary returns existing summary", async () => {
  const [db, client] = await testDb();
  const concept = new SummariesConcept(db);

  try {
    await concept.setSummary({
      item: ITEM_ID_1,
      summary: SAMPLE_SUMMARY_SHORT,
    });

    const result = await concept.getSummary({ item: ITEM_ID_1 });
    assertExists(result, "getSummary should not return null");
    assertNotEquals(
      "error" in result,
      true,
      "getSummary should not return an error.",
    );
    assertExists(result);
    assertEquals((result as { _id: ID; summary: string })._id, ITEM_ID_1);
    assertEquals(
      (result as { _id: ID; summary: string }).summary,
      SAMPLE_SUMMARY_SHORT,
    );
  } finally {
    await client.close();
  }
});

Deno.test("Query: getSummary returns an error for non-existent summary", async () => {
  const [db, client] = await testDb();
  const concept = new SummariesConcept(db);

  try {
    const result = await concept.getSummary({ item: ITEM_ID_NON_EXISTENT });
    assertEquals(
      "error" in result,
      true,
      "getSummary should return an error for a non-existent item.",
    );
    assertExists((result as { error: string }).error);
  } finally {
    await client.close();
  }
});

Deno.test("Action: deleteSummary successfully deletes an existing summary", async () => {
  const [db, client] = await testDb();
  const concept = new SummariesConcept(db);

  try {
    await concept.setSummary({
      item: ITEM_ID_1,
      summary: SAMPLE_SUMMARY_SHORT,
    });
    let fetched = await concept.getSummary({ item: ITEM_ID_1 });
    assertExists(fetched, "getSummary should not return null");
    assertExists(fetched, "Summary should exist before deletion.");

    const deleteResult = await concept.deleteSummary({ item: ITEM_ID_1 });
    assertNotEquals(
      "error" in deleteResult,
      true,
      "deleteSummary should not return an error.",
    );
    assertEquals(
      Object.keys(deleteResult).length,
      0,
      "Should return an Empty object.",
    );

    fetched = await concept.getSummary({ item: ITEM_ID_1 });
    assertExists(fetched, "getSummary should not return null");
    assertEquals(
      "error" in fetched,
      true,
      "getSummary should return an error after deletion.",
    );
    assertExists((fetched as { error: string }).error);
  } finally {
    await client.close();
  }
});

Deno.test("Action: deleteSummary returns error for non-existent summary", async () => {
  const [db, client] = await testDb();
  const concept = new SummariesConcept(db);

  try {
    const deleteResult = await concept.deleteSummary({
      item: ITEM_ID_NON_EXISTENT,
    });
    assertEquals(
      "error" in deleteResult,
      true,
      "deleteSummary should return an error for a non-existent item.",
    );
    assertEquals(
      (deleteResult as { error: string }).error,
      `No summary found for item ${ITEM_ID_NON_EXISTENT} to delete.`,
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: setSummaryWithAI successfully generates and saves a summary", async () => {
  const [db, client] = await testDb();
  const concept = new SummariesConcept(db);

  // Stub the LLM call
  const stubbedExecuteLLM = stub(
    GeminiLLM.prototype,
    "executeLLM",
    () => Promise.resolve(SAMPLE_SUMMARY_LONG_VALID),
  );

  try {
    const result = await concept.setSummaryWithAI({
      text: SAMPLE_TEXT_LONG,
      item: ITEM_ID_1,
    });
    assertNotEquals(
      "error" in result,
      true,
      "setSummaryWithAI should not return an error.",
    );
    const summaryDoc = result as { _id: ID; summary: string };
    assertEquals(summaryDoc._id, ITEM_ID_1);
    // Normalize whitespace for comparison (collapse multiple spaces/newlines into single spaces)
    const normalizeWhitespace = (str: string) =>
      str.replace(/\s+/g, " ").trim();
    assertEquals(
      normalizeWhitespace(summaryDoc.summary),
      normalizeWhitespace(SAMPLE_SUMMARY_LONG_VALID),
    );

    const fetched = await concept.getSummary({ item: ITEM_ID_1 });
    assertExists(fetched, "getSummary should not return null");
    assertNotEquals("error" in fetched, true, "getSummary should not error");
    assertEquals(
      normalizeWhitespace((fetched as { _id: ID; summary: string })?.summary),
      normalizeWhitespace(SAMPLE_SUMMARY_LONG_VALID),
      "Fetched summary should match AI-generated summary",
    );
    assertEquals(
      stubbedExecuteLLM.calls.length,
      1,
      "LLM should have been called once.",
    );
  } finally {
    stubbedExecuteLLM.restore(); // Restore original method
    await client.close();
  }
});

Deno.test("Action: setSummaryWithAI returns error for empty text", async () => {
  const [db, client] = await testDb();
  const concept = new SummariesConcept(db);

  // No LLM stub needed as validation happens before LLM call
  try {
    const result = await concept.setSummaryWithAI({
      text: "",
      item: ITEM_ID_1,
    });
    assertEquals(
      "error" in result,
      true,
      "setSummaryWithAI should return an error for empty text.",
    );
    assertEquals(
      (result as { error: string }).error,
      "Text to summarize cannot be empty.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: setSummaryWithAI handles LLM generation failure", async () => {
  const [db, client] = await testDb();
  const concept = new SummariesConcept(db);
  const llmErrorMessage = "LLM API failed to respond.";

  const stubbedExecuteLLM = stub(
    GeminiLLM.prototype,
    "executeLLM",
    () => Promise.reject(new Error(llmErrorMessage)),
  );

  try {
    const result = await concept.setSummaryWithAI({
      text: SAMPLE_TEXT_SHORT,
      item: ITEM_ID_1,
    });
    assertEquals(
      "error" in result,
      true,
      "setSummaryWithAI should return an error if LLM fails.",
    );
    assertExists((result as { error: string }).error.includes(llmErrorMessage));
    assertEquals(stubbedExecuteLLM.calls.length, 1);
  } finally {
    stubbedExecuteLLM.restore();
    await client.close();
  }
});

Deno.test("Action: setSummaryWithAI rejects summary with meta-language", async () => {
  const [db, client] = await testDb();
  const concept = new SummariesConcept(db);

  const stubbedExecuteLLM = stub(
    GeminiLLM.prototype,
    "executeLLM",
    () => Promise.resolve(SAMPLE_SUMMARY_WITH_METALANGUAGE),
  );

  try {
    const result = await concept.setSummaryWithAI({
      text: SAMPLE_TEXT_LONG,
      item: ITEM_ID_1,
    });
    assertEquals(
      "error" in result,
      true,
      "setSummaryWithAI should return an error for summaries with meta-language.",
    );
    assertExists(
      (result as { error: string }).error.includes("MetaLanguageError"),
    );
    assertEquals(stubbedExecuteLLM.calls.length, 1);
  } finally {
    stubbedExecuteLLM.restore();
    await client.close();
  }
});

Deno.test("Action: setSummaryWithAI rejects summary that is too long (ratio or absolute)", async () => {
  const [db, client] = await testDb();
  const concept = new SummariesConcept(db);

  const stubbedExecuteLLM = stub(
    GeminiLLM.prototype,
    "executeLLM",
    () => Promise.resolve(SAMPLE_SUMMARY_TOO_LONG_FOR_SHORT_TEXT),
  );

  try {
    const result = await concept.setSummaryWithAI({
      text: SAMPLE_TEXT_SHORT,
      item: ITEM_ID_1,
    });
    assertEquals(
      "error" in result,
      true,
      "setSummaryWithAI should return an error for summaries that are too long.",
    );
    assertExists(
      (result as { error: string }).error.includes("SummaryTooLongError"),
    );
    assertEquals(stubbedExecuteLLM.calls.length, 1);
  } finally {
    stubbedExecuteLLM.restore();
    await client.close();
  }
});

Deno.test("Action: setSummaryWithAI rejects summary that is irrelevant", async () => {
  const [db, client] = await testDb();
  const concept = new SummariesConcept(db);

  const stubbedExecuteLLM = stub(
    GeminiLLM.prototype,
    "executeLLM",
    () => Promise.resolve(SAMPLE_SUMMARY_UNRELATED),
  );

  try {
    const result = await concept.setSummaryWithAI({
      text: SAMPLE_TEXT_LONG,
      item: ITEM_ID_1,
    });
    assertEquals(
      "error" in result,
      true,
      "setSummaryWithAI should return an error for irrelevant summaries.",
    );
    assertExists(
      (result as { error: string }).error.includes("ContentRelevanceError"),
    );
    assertEquals(stubbedExecuteLLM.calls.length, 1);
  } finally {
    stubbedExecuteLLM.restore();
    await client.close();
  }
});

Deno.test("Action: setSummaryWithAI handles LLM returning 'unclear/unrelated' message", async () => {
  const [db, client] = await testDb();
  const concept = new SummariesConcept(db);

  const stubbedExecuteLLM = stub(
    GeminiLLM.prototype,
    "executeLLM",
    () => Promise.resolve(LLM_UNSUCCESSFUL_GENERATION_MESSAGE),
  );

  try {
    const result = await concept.setSummaryWithAI({
      text: SAMPLE_TEXT_SHORT,
      item: ITEM_ID_1,
    });
    assertEquals(
      "error" in result,
      true,
      "setSummaryWithAI should return an error if LLM returns the 'unclear/unrelated' message.",
    );
    assertExists(
      (result as { error: string }).error.includes("MetaLanguageError"), // The internal validation catches this as meta-language
    );
    assertEquals(stubbedExecuteLLM.calls.length, 1);
  } finally {
    stubbedExecuteLLM.restore();
    await client.close();
  }
});
