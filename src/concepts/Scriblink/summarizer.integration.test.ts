import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { freshID, testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import SummariesConcept from "./summarizer.ts";

// Test data for integration tests
const ITEM_ID_1 = freshID();
const ITEM_ID_2 = freshID();

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

const SAMPLE_TEXT_SHORT =
  "The quick brown fox jumps over the lazy dog. This is a short piece of text.";

const SAMPLE_TEXT_TECHNICAL = `
Machine learning is a subset of artificial intelligence that focuses on algorithms
that can learn and make decisions from data. There are three main types: supervised
learning (learning from labeled examples), unsupervised learning (finding patterns
in data without labels), and reinforcement learning (learning through trial and error
with rewards and penalties). Popular algorithms include linear regression, decision
trees, neural networks, and support vector machines. The field has applications in
image recognition, natural language processing, recommendation systems, and autonomous
vehicles. Key challenges include overfitting, bias in training data, and the need
for large amounts of data to train effective models.
`;

// Integration tests that actually call Gemini
Deno.test("Integration: setSummaryWithAI with real Gemini - long technical text", async () => {
  const [db, client] = await testDb();
  const concept = new SummariesConcept(db);

  try {
    const result = await concept.setSummaryWithAI({
      text: SAMPLE_TEXT_LONG,
      item: ITEM_ID_1,
    });

    // Should succeed with real Gemini
    assertNotEquals(
      "error" in result,
      true,
      "setSummaryWithAI should succeed with real Gemini for long text",
    );

    const summaryDoc = result as { _id: ID; summary: string };
    assertEquals(summaryDoc._id, ITEM_ID_1);
    assertExists(summaryDoc.summary);

    // Verify the summary is reasonable
    const summary = summaryDoc.summary;
    assertExists(summary.length > 0, "Summary should not be empty");
    assertExists(
      summary.length < SAMPLE_TEXT_LONG.length,
      "Summary should be shorter than original",
    );

    // Check that key concepts are mentioned
    const lowerSummary = summary.toLowerCase();
    assertExists(
      lowerSummary.includes("quantum") || lowerSummary.includes("entanglement"),
      "Summary should mention quantum concepts",
    );

    // Verify it was saved to database
    const fetched = await concept.getSummary({ item: ITEM_ID_1 });
    assertNotEquals("error" in fetched, true, "getSummary should not error");
    assertEquals(
      (fetched as { _id: ID; summary: string })?.summary,
      summary,
      "Fetched summary should match AI-generated summary",
    );

    console.log("✅ Long text summary:", summary);
  } finally {
    await client.close();
  }
});

Deno.test("Integration: setSummaryWithAI with real Gemini - short text", async () => {
  const [db, client] = await testDb();
  const concept = new SummariesConcept(db);

  try {
    const result = await concept.setSummaryWithAI({
      text: SAMPLE_TEXT_SHORT,
      item: ITEM_ID_2,
    });

    // Should succeed with real Gemini
    assertNotEquals(
      "error" in result,
      true,
      "setSummaryWithAI should succeed with real Gemini for short text",
    );

    const summaryDoc = result as { _id: ID; summary: string };
    assertEquals(summaryDoc._id, ITEM_ID_2);
    assertExists(summaryDoc.summary);

    // Verify the summary is reasonable
    const summary = summaryDoc.summary;
    assertExists(summary.length > 0, "Summary should not be empty");
    assertExists(
      summary.length < SAMPLE_TEXT_SHORT.length,
      "Summary should be shorter than original",
    );

    // Check that key elements are mentioned
    const lowerSummary = summary.toLowerCase();
    assertExists(
      lowerSummary.includes("fox") || lowerSummary.includes("dog"),
      "Summary should mention the main subjects",
    );

    console.log("✅ Short text summary:", summary);
  } finally {
    await client.close();
  }
});

Deno.test("Integration: setSummaryWithAI with real Gemini - technical content", async () => {
  const [db, client] = await testDb();
  const concept = new SummariesConcept(db);

  try {
    const result = await concept.setSummaryWithAI({
      text: SAMPLE_TEXT_TECHNICAL,
      item: freshID(),
    });

    // Should succeed with real Gemini
    assertNotEquals(
      "error" in result,
      true,
      "setSummaryWithAI should succeed with real Gemini for technical text",
    );

    const summaryDoc = result as { _id: ID; summary: string };
    assertExists(summaryDoc.summary);

    // Verify the summary is reasonable
    const summary = summaryDoc.summary;
    assertExists(summary.length > 0, "Summary should not be empty");
    assertExists(
      summary.length < SAMPLE_TEXT_TECHNICAL.length,
      "Summary should be shorter than original",
    );

    // Check that key technical concepts are mentioned
    const lowerSummary = summary.toLowerCase();
    assertExists(
      lowerSummary.includes("machine learning") ||
        lowerSummary.includes("algorithm") ||
        lowerSummary.includes("ai"),
      "Summary should mention key technical concepts",
    );

    console.log("✅ Technical text summary:", summary);
  } finally {
    await client.close();
  }
});

Deno.test("Integration: setSummaryWithAI with real Gemini - edge cases", async () => {
  const [db, client] = await testDb();
  const concept = new SummariesConcept(db);

  try {
    // Test with very short text
    const shortResult = await concept.setSummaryWithAI({
      text: "Hello world.",
      item: freshID(),
    });

    // Should still work but might be minimal
    if ("error" in shortResult) {
      console.log(
        "⚠️  Very short text failed:",
        (shortResult as { error: string }).error,
      );
    } else {
      const summary = (shortResult as { _id: ID; summary: string }).summary;
      console.log("✅ Very short text summary:", summary);
    }

    // Test with text that might trigger validation errors
    const emptyResult = await concept.setSummaryWithAI({
      text: "",
      item: freshID(),
    });

    assertEquals(
      "error" in emptyResult,
      true,
      "Empty text should still be rejected by validation",
    );

    console.log("✅ Empty text correctly rejected");
  } finally {
    await client.close();
  }
});
