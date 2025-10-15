# prompt: 
Create a test file for the following summarizer concept that looks similar to the example that I show below for a different concept.  Make sure that all the types work out, and try using the same libraries (like testDb) from the project itself.  Please test what is in the summarizerConcept class, and do not create any mock extended classes.

[@summarizerConcept](../../src/concepts/Scriblink/summarizer.ts)

'// This import loads the `.env` file as environment variables
import "jsr:@std/dotenv/load";
import { Db, MongoClient } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { generate } from "jsr:@std/uuid/unstable-v7";

async function initMongoClient() {
  const DB_CONN = Deno.env.get("MONGODB_URL");
  if (DB_CONN === undefined) {
    throw new Error("Could not find environment variable: MONGODB_URL");
  }
  const client = new MongoClient(DB_CONN);
  try {
    await client.connect();
  } catch (e) {
    throw new Error("MongoDB connection failed: " + e);
  }
  return client;
}

async function init() {
  const client = await initMongoClient();
  const DB_NAME = Deno.env.get("DB_NAME");
  if (DB_NAME === undefined) {
    throw new Error("Could not find environment variable: DB_NAME");
  }
  return [client, DB_NAME] as [MongoClient, string];
}

async function dropAllCollections(db: Db): Promise<void> {
  try {
    // Get all collection names
    const collections = await db.listCollections().toArray();

    // Drop each collection
    for (const collection of collections) {
      await db.collection(collection.name).drop();
    }
  } catch (error) {
    console.error("Error dropping collections:", error);
    throw error;
  }
}

/**
 * MongoDB database configured by .env
 * @returns {[Db, MongoClient]} initialized database and client
 */
export async function getDb() {
  const [client, DB_NAME] = await init();
  return [client.db(DB_NAME), client];
}

/**
 * Test database initialization
 * @returns {[Db, MongoClient]} initialized test database and client
 */
export async function testDb() {
  const [client, DB_NAME] = await init();
  const test_DB_NAME = `test-${DB_NAME}`;
  const test_Db = client.db(test_DB_NAME);
  await dropAllCollections(test_Db);
  return [test_Db, client] as [Db, MongoClient];
}

/**
 * Creates a fresh ID.
 * @returns {ID} UUID v7 generic ID.
 */
export function freshID() {
  return generate() as ID;
}
'

```
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import LikertSurveyConcept from "./LikertSurveyConcept.ts";

const authorA = "author:Alice" as ID;
const respondentB = "respondent:Bob" as ID;
const respondentC = "respondent:Charlie" as ID;

Deno.test("Principle: Author creates survey, respondent answers, author views results", async () => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);

  try {
    // 1. Author creates a survey with a 1-5 scale
    const createSurveyResult = await surveyConcept.createSurvey({
      author: authorA,
      title: "Customer Satisfaction",
      scaleMin: 1,
      scaleMax: 5,
    });
    assertNotEquals(
      "error" in createSurveyResult,
      true,
      "Survey creation should not fail.",
    );
    const { survey } = createSurveyResult as { survey: ID };
    assertExists(survey);

    // 2. Author adds several questions
    const addQ1Result = await surveyConcept.addQuestion({
      survey,
      text: "How satisfied are you with our product?",
    });
    assertNotEquals(
      "error" in addQ1Result,
      true,
      "Adding question 1 should not fail.",
    );
    const { question: q1 } = addQ1Result as { question: ID };

    const addQ2Result = await surveyConcept.addQuestion({
      survey,
      text: "How likely are you to recommend us?",
    });
    assertNotEquals(
      "error" in addQ2Result,
      true,
      "Adding question 2 should not fail.",
    );
    const { question: q2 } = addQ2Result as { question: ID };

    const questions = await surveyConcept._getSurveyQuestions({ survey });
    assertEquals(
      questions.length,
      2,
      "There should be two questions in the survey.",
    );

    // 3. A respondent submits their answers to those questions
    const submitR1Result = await surveyConcept.submitResponse({
      respondent: respondentB,
      question: q1,
      value: 5,
    });
    assertEquals(
      "error" in submitR1Result,
      false,
      "Submitting response 1 should succeed.",
    );

    const submitR2Result = await surveyConcept.submitResponse({
      respondent: respondentB,
      question: q2,
      value: 4,
    });
    assertEquals(
      "error" in submitR2Result,
      false,
      "Submitting response 2 should succeed.",
    );

    // 4. The author can view the collected responses
    const surveyResponses = await surveyConcept._getSurveyResponses({ survey });
    assertEquals(
      surveyResponses.length,
      2,
      "There should be two responses for the survey.",
    );
    assertEquals(surveyResponses.find((r) => r.question === q1)?.value, 5);
    assertEquals(surveyResponses.find((r) => r.question === q2)?.value, 4);

    const respondentAnswers = await surveyConcept._getRespondentAnswers({
      respondent: respondentB,
    });
    assertEquals(
      respondentAnswers.length,
      2,
      "The respondent should have two answers recorded.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: createSurvey requires scaleMin < scaleMax", async () => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);

  try {
    const invalidResult = await surveyConcept.createSurvey({
      author: authorA,
      title: "Invalid Survey",
      scaleMin: 5,
      scaleMax: 1,
    });
    assertEquals(
      "error" in invalidResult,
      true,
      "Should fail when scaleMin > scaleMax.",
    );

    const equalResult = await surveyConcept.createSurvey({
      author: authorA,
      title: "Invalid Survey",
      scaleMin: 3,
      scaleMax: 3,
    });
    assertEquals(
      "error" in equalResult,
      true,
      "Should fail when scaleMin == scaleMax.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: addQuestion requires an existing survey", async () => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);
  const nonExistentSurveyId = "survey:fake" as ID;

  try {
    const result = await surveyConcept.addQuestion({
      survey: nonExistentSurveyId,
      text: "This will fail",
    });
    assertEquals(
      "error" in result,
      true,
      "Adding a question to a non-existent survey should fail.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: submitResponse requirements are enforced", async () => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);

  try {
    // Setup a valid survey and question
    const { survey } =
      (await surveyConcept.createSurvey({
        author: authorA,
        title: "Test Survey",
        scaleMin: 1,
        scaleMax: 5,
      })) as { survey: ID };
    const { question } =
      (await surveyConcept.addQuestion({ survey, text: "A question" })) as {
        question: ID;
      };

    // Requires: question must exist
    const nonExistentQuestionId = "question:fake" as ID;
    const res1 = await surveyConcept.submitResponse({
      respondent: respondentB,
      question: nonExistentQuestionId,
      value: 3,
    });
    assertEquals(
      "error" in res1,
      true,
      "Submitting a response to a non-existent question should fail.",
    );

    // Requires: respondent must not have already submitted a response
    await surveyConcept.submitResponse({
      respondent: respondentB,
      question,
      value: 3,
    }); // First submission is OK
    const res2 = await surveyConcept.submitResponse({
      respondent: respondentB,
      question,
      value: 4,
    }); // Second submission fails
    assertEquals(
      "error" in res2,
      true,
      "Submitting a response twice for the same question should fail.",
    );
    assertEquals(
      (res2 as { error: string }).error,
      "Respondent has already answered this question. Use updateResponse to change it.",
    );

    // Requires: value must be within survey's scale
    const res3 = await surveyConcept.submitResponse({
      respondent: respondentC,
      question,
      value: 0,
    }); // Below min
    assertEquals(
      "error" in res3,
      true,
      "Submitting a value below the minimum scale should fail.",
    );
    const res4 = await surveyConcept.submitResponse({
      respondent: respondentC,
      question,
      value: 6,
    }); // Above max
    assertEquals(
      "error" in res4,
      true,
      "Submitting a value above the maximum scale should fail.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: updateResponse successfully updates a response and enforces requirements", async () => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);
  try {
    // Setup
    const { survey } =
      (await surveyConcept.createSurvey({
        author: authorA,
        title: "Test Survey",
        scaleMin: 1,
        scaleMax: 5,
      })) as { survey: ID };
    const { question } =
      (await surveyConcept.addQuestion({ survey, text: "A question" })) as {
        question: ID;
      };
    await surveyConcept.submitResponse({
      respondent: respondentB,
      question,
      value: 3,
    });

    // Requires: A response must already exist to be updated
    const res1 = await surveyConcept.updateResponse({
      respondent: respondentC,
      question,
      value: 4,
    });
    assertEquals(
      "error" in res1,
      true,
      "Updating a non-existent response should fail.",
    );

    // Requires: value must be within survey's scale
    const res2 = await surveyConcept.updateResponse({
      respondent: respondentB,
      question,
      value: 6,
    });
    assertEquals(
      "error" in res2,
      true,
      "Updating with a value outside the scale should fail.",
    );

    // Successful update
    const successResult = await surveyConcept.updateResponse({
      respondent: respondentB,
      question,
      value: 5,
    });
    assertEquals(
      "error" in successResult,
      false,
      "A valid update should succeed.",
    );

    // Verify the update
    const answers = await surveyConcept._getRespondentAnswers({
      respondent: respondentB,
    });
    assertEquals(answers.length, 1, "There should still be only one answer.");
    assertEquals(
      answers[0].value,
      5,
      "The answer's value should be updated to 5.",
    );
  } finally {
    await client.close();
  }
});
```

# response:

```typescript

```

For the setSummaryWithAI testing, use this as a reference for how to test it, but make it in the same format as above: "import { Summarizer, Section } from "./summarizer";

// Test function that uses pre-transcribed text instead of calling vision API
async function testSummarizationWithPreTranscribedText() {
  const summarizer = new Summarizer();

  // Test case 1: Gaussian Elimination notes
  const gaussianNotes = `## Lecture 8: Gaussian Elimination

Last Time: $Ax=b$, used Gaussian elimination + back-substitution to solve for $x$. We had a unique solution last time, but we will see other cases.

This time: Gaussian elimination with matrix multiplication (instead of a system of equations).

$Ax=b$
or
$(A|b)$

The augmented matrix:
$$ \\left( \\begin{array}{ccc|c} 1 & -1 & 2 & 1 \\\\ -2 & 2 & -3 & -1 \\\\ -3 & -1 & 2 & -3 \\end{array} \\right) $$
The elements $1, -2, -3$ in the first column are the initial *pivots*.

**Step 1:** Eliminate all elements except the first column pivot.

The new first equation will be exactly the same as the old one.
To eliminate elements in the first column below the pivot, we use the elementary matrix $G_1$:
$$ G_1 = \\begin{pmatrix} 1 & 0 & 0 \\\\ 2 & 1 & 0 \\\\ 3 & 0 & 1 \\end{pmatrix} $$
Applying $G_1$ to the augmented matrix $(A|b)$:
$$ \\begin{pmatrix} 1 & 0 & 0 \\\\ 2 & 1 & 0 \\\\ 3 & 0 & 1 \\end{pmatrix} \\left( \\begin{array}{ccc|c} 1 & -1 & 2 & 1 \\\\ -2 & 2 & -3 & -1 \\\\ -3 & -1 & 2 & -3 \\end{array} \\right) = \\left( \\begin{array}{ccc|c} 1 & -1 & 2 & 1 \\\\ 0 & 0 & 1 & 1 \\\\ 0 & -4 & 8 & 0 \\end{array} \\right) $$
The resulting matrix parts are $G_1 A$ and $G_1 b$.

**Step 2:** Swap rows 2 and 3.

We use the elementary matrix $G_2$ for the row swap:
$$ G_2 = \\begin{pmatrix} 1 & 0 & 0 \\\\ 0 & 0 & 1 \\\\ 0 & 1 & 0 \\end{pmatrix} $$
Applying $G_2$ to the previous result $(G_1 A | G_1 b)$:
$$ \\left( \\begin{array}{ccc|c} 1 & -1 & 2 & 1 \\\\ 0 & -4 & 8 & 0 \\\\ 0 & 0 & 1 & 1 \\end{array} \\right) $$
The resulting matrix parts are $G_2 G_1 A$ and $G_2 G_1 b$.

This final matrix is in **REF FORM!** (Row Echelon Form).
This transformed augmented matrix is called $(\\tilde{A}|\\tilde{b})$.`;

  // Test case 2: Fractions notes (from notes2.png transcription)
  const fractionsNotes = `Think of the "denominator" as the total number of equal parts something is divided into, and the "numerator" as how many of those parts you have or are considering.

When comparing or adding fractions, you MUST have the same "size" of parts (same denominator). This often means finding a "common denominator."

Students sometimes try to add or subtract numerators and denominators directly without finding a common denominator, leading to incorrect answers.

Imagine a pizza cut into 8 slices. If you eat 3 slices, you've eaten 3/8 of the pizza. The 8 is the total slices (denominator), and the 3 is how many you ate (numerator).`;

  console.log("=== TESTING SUMMARIZATION WITH PRE-TRANSCRIBED TEXT ===\n");

  // Test case 3: Gauss Jordan notes
  const gaussJordanNotes = `Gauss-Jordan additional steps: make all pivots = 1, make non-zero entries above pivots

_make all pivots = 1_
$G_3 = \begin{pmatrix} 1 & 0 & 0 \\ 0 & -1/4 & 0 \\ 0 & 0 & 1 \end{pmatrix} \begin{pmatrix} 1 & -1 & 2 & | & 1 \\ 0 & -4 & 8 & | & 0 \\ 0 & 0 & 1 & | & 1 \end{pmatrix} = \begin{pmatrix} 1 & -1 & 2 & | & 1 \\ 0 & 1 & -2 & | & 0 \\ 0 & 0 & 1 & | & 1 \end{pmatrix}$

Labels:
$G_3$ (below the first matrix)
($\tilde{A}$ | $\tilde{B}$) (below the augmented matrix)
$G_3 G_2 G_1 A$ (below the A-part of the result)
$G_3 G_2 G_1 B$ (below the B-part of the result)

_eliminate above pivots_
$\begin{pmatrix} 1 & 1 & 0 \\ 0 & 1 & 2 \\ 0 & 0 & 1 \end{pmatrix} \begin{pmatrix} 1 & -1 & 2 & | & 1 \\ 0 & 1 & -2 & | & 0 \\ 0 & 0 & 1 & | & 1 \end{pmatrix} = \begin{pmatrix} 1 & 0 & 0 & | & 1 \\ 0 & 1 & 0 & | & 2 \\ 0 & 0 & 1 & | & 1 \end{pmatrix}$

Reduced Row Echelon Form? RREF`;

  // Test 1: Gaussian Elimination
  console.log("--- Test 1: Gaussian Elimination Notes ---");
  const section1: Section = {
    id: "1",
    title: "Gaussian Elimination",
    imageData: "dummy_image_data",
    mimeType: "image/png",
  };
  const summary1 = await summarizer.setSummaryWithAI(gaussianNotes, section1);
  summarizer.setSummary(summary1, section1);
  console.log("Summary:", summary1);
  console.log("");

  // Test 2: Fractions
  console.log("--- Test 2: Fractions Notes ---");
  const section2: Section = {
    id: "2",
    title: "Fractions",
    imageData: "dummy_image_data",
    mimeType: "image/png",
  };

  // Test case 3: Gauss Jordan notes
  console.log("--- Test 3: Gauss Jordan Notes ---");
  const section3: Section = {
    id: "3",
    title: "Gauss Jordan",
    imageData: "dummy_image_data",
    mimeType: "image/png",
  };
  const summary3 = await summarizer.setSummaryWithAI(
    gaussJordanNotes,
    section3
  );
  summarizer.setSummary(summary3, section3);
  console.log("Summary:", summary3);
  console.log("");

  const summary2 = await summarizer.setSummaryWithAI(fractionsNotes, section2);
  summarizer.setSummary(summary2, section2);
  console.log("Summary:", summary2);
  console.log("");

  console.log("=== ALL SUMMARIES ===");
  const summaries = summarizer.getSummaries();
  for (const [sectionId, summaryText] of Object.entries(summaries)) {
    console.log(`\nSection ${sectionId}:`);
    console.log(summaryText);
  }
}

async function main() {
  // Only run pre-transcribed text tests
  await testSummarizationWithPreTranscribedText();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
"



```typescript
import {
  assertEquals,
  assertExists,
  assertNotEquals,
  assertRejects,
  assertThrows,
} from "jsr:@std/assert";
import { stub } from "jsr:@std/testing/mock";
import { testDb, freshID } from "@utils/database.ts";
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
    assertEquals(concept.summariesCollection.name, "Summary.summaries");
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
    await concept.setSummary({ item: ITEM_ID_2, summary: SAMPLE_SUMMARY_SHORT });

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

Deno.test("Query: getSummary returns null for non-existent summary", async () => {
  const [db, client] = await testDb();
  const concept = new SummariesConcept(db);

  try {
    const result = await concept.getSummary({ item: ITEM_ID_NON_EXISTENT });
    assertEquals(
      result,
      null,
      "getSummary should return null for a non-existent item.",
    );
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
    assertExists(fetched, "Summary should exist before deletion.");

    const deleteResult = await concept.deleteSummary({ item: ITEM_ID_1 });
    assertNotEquals(
      "error" in deleteResult,
      true,
      "deleteSummary should not return an error.",
    );
    assertEquals(Object.keys(deleteResult).length, 0, "Should return an Empty object.");

    fetched = await concept.getSummary({ item: ITEM_ID_1 });
    assertEquals(fetched, null, "Summary should be null after deletion.");
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
    assertEquals(summaryDoc.summary, SAMPLE_SUMMARY_LONG_VALID);

    const fetched = await concept.getSummary({ item: ITEM_ID_1 });
    assertNotEquals("error" in fetched, true, "getSummary should not error");
    assertEquals(
      (fetched as { _id: ID; summary: string })?.summary,
      SAMPLE_SUMMARY_LONG_VALID,
      "Fetched summary should match AI-generated summary",
    );
    assertEquals(stubbedExecuteLLM.calls.length, 1, "LLM should have been called once.");
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
    const result = await concept.setSummaryWithAI({ text: "", item: ITEM_ID_1 });
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
```