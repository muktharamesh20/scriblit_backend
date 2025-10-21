import {
  assertEquals,
  assertExists,
  assertNotEquals,
  assertStrictEquals,
} from "jsr:@std/assert";
import { testDb } from "@utils/database.ts"; // Assuming @utils/database.ts contains testDb
import { ID } from "@utils/types.ts"; // Assuming @utils/types.ts contains ID
import NotesConcept from "../Scriblink/notesConcept.ts"; // Import the concept to be tested

// Define some test User IDs
const userAlice = "user:Alice" as ID;
const userBob = "user:Bob" as ID;

// ============================================================================
// --- OPERATIONAL PRINCIPLE ---
// ============================================================================

Deno.test("Principle: User can create, view, rename, edit, and delete their own note", async (t) => {
  const [db, client] = await testDb();
  const notesConcept = new NotesConcept(db);

  try {
    console.log("\n📝 OPERATIONAL PRINCIPLE: Note Management Workflow");
    console.log("=".repeat(60));

    let noteId: ID; // To store the ID of the created note
    let initialCreationTime: Date;

    await t.step("1. User creates a new note with a title", async () => {
      console.log("\n📝 Step 1: Creating new note with title");
      const createResult = await notesConcept.createNote({
        title: "My First Note",
        user: userAlice,
      });
      assertNotEquals(
        "error" in createResult,
        true,
        "Note creation should not fail.",
      );
      ({ note: noteId } = createResult as { note: ID });
      assertExists(noteId);

      const noteDetails = await notesConcept.getNoteDetails({
        noteId,
        user: userAlice,
      });
      assertNotEquals(
        "error" in noteDetails,
        true,
        "Note details should be retrievable.",
      );
      assertStrictEquals((noteDetails as any).title, "My First Note");
      assertStrictEquals((noteDetails as any).content, "");
      assertStrictEquals((noteDetails as any).owner, userAlice);
      initialCreationTime = (noteDetails as any).date_created;
      assertStrictEquals(
        (noteDetails as any).last_modified.getTime(),
        initialCreationTime.getTime(),
      );
      console.log("   ✅ Note created successfully: 'My First Note'");
    });

    await t.step("2. User can view their own notes", async () => {
      console.log("\n👀 Step 2: Viewing user's notes");
      const userNotes = await notesConcept.getNotesByUser({
        ownerId: userAlice,
      });
      assertNotEquals(
        "error" in userNotes,
        true,
        "Getting notes by user should not fail.",
      );
      assertEquals(
        (userNotes as any[]).length,
        1,
        "There should be 1 note for user Alice.",
      );
      assertEquals((userNotes as any[])[0]._id, noteId);
      console.log("   ✅ User notes retrieved: 1 note found");
    });

    await t.step("3. User can rename their note", async () => {
      console.log("\n✏️  Step 3: Renaming note");
      const renameResult = await notesConcept.setTitle({
        noteId,
        user: userAlice,
        newTitle: "My Renamed Note",
      });
      assertNotEquals(
        "error" in renameResult,
        true,
        "Renaming note should not fail.",
      );

      const noteDetails = await notesConcept.getNoteDetails({
        noteId,
        user: userAlice,
      });
      assertNotEquals(
        "error" in noteDetails,
        true,
        "Note details should be retrievable after rename.",
      );
      assertStrictEquals((noteDetails as any).title, "My Renamed Note");
      // `last_modified` should NOT be updated for setTitle
      assertStrictEquals(
        (noteDetails as any).last_modified.getTime(),
        initialCreationTime.getTime(),
      );
      console.log("   ✅ Note renamed successfully: 'My Renamed Note'");
    });

    await t.step("4. User can edit the content of their note", async () => {
      console.log("\n📝 Step 4: Editing note content");
      const newContent = "This is the new content of my note.";
      const updateContentResult = await notesConcept.updateContent({
        noteId,
        user: userAlice,
        newContent: newContent,
      });
      assertNotEquals(
        "error" in updateContentResult,
        true,
        "Updating content should not fail.",
      );

      const noteDetails = await notesConcept.getNoteDetails({
        noteId,
        user: userAlice,
      });
      assertNotEquals(
        "error" in noteDetails,
        true,
        "Note details should be retrievable after content update.",
      );
      assertStrictEquals((noteDetails as any).content, newContent);
      // `last_modified` SHOULD be updated for updateContent
      assertNotEquals(
        (noteDetails as any).last_modified.getTime(),
        initialCreationTime.getTime(),
        "last_modified should be updated after content change.",
      );
      assertStrictEquals(
        (noteDetails as any).date_created.getTime(),
        initialCreationTime.getTime(),
        "date_created should remain the same.",
      );
      console.log("   ✅ Note content updated successfully");
    });

    await t.step("5. User can delete their note", async () => {
      console.log("\n🗑️  Step 5: Deleting note");
      const deleteResult = await notesConcept.deleteNote({
        noteId,
        user: userAlice,
      });
      assertNotEquals(
        "error" in deleteResult,
        true,
        "Deleting note should not fail.",
      );

      const noteDetailsAfterDelete = await notesConcept.getNoteDetails({
        noteId,
        user: userAlice,
      });
      assertEquals(
        "error" in noteDetailsAfterDelete,
        true,
        "Note should no longer be found after deletion.",
      );
      assertEquals(
        (noteDetailsAfterDelete as any).error,
        `Note with ID ${noteId} not found.`,
      );
      console.log("   ✅ Note deleted successfully");
    });

    console.log("\n🎉 OPERATIONAL PRINCIPLE COMPLETE");
    console.log("=".repeat(60));
  } finally {
    await client.close();
  }
});

// ============================================================================
// --- GENERAL CONCEPT METHOD TESTING ---
// ============================================================================

Deno.test("Action: createNote - default title and initial state", async () => {
  const [db, client] = await testDb();
  const notesConcept = new NotesConcept(db);

  try {
    const createResult = await notesConcept.createNote({ user: userAlice }); // No title provided
    assertNotEquals(
      "error" in createResult,
      true,
      "Note creation should succeed without title.",
    );
    const { note: noteId } = createResult as { note: ID };

    const noteDetails = await notesConcept.getNoteDetails({
      noteId,
      user: userAlice,
    });
    assertNotEquals(
      "error" in noteDetails,
      true,
      "Details for default note should be retrievable.",
    );
    assertStrictEquals(
      (noteDetails as any).title,
      "Untitled",
      "Default title should be 'Untitled'.",
    );
    assertStrictEquals(
      (noteDetails as any).content,
      "",
      "Content should be empty initially.",
    );
    assertStrictEquals(
      (noteDetails as any).owner,
      userAlice,
      "Owner should be set correctly.",
    );
    assertStrictEquals(
      (noteDetails as any).date_created.getTime(),
      (noteDetails as any).last_modified.getTime(),
      "date_created and last_modified should be the same on creation.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: deleteNote - requires existing note and ownership", async (t) => {
  const [db, client] = await testDb();
  const notesConcept = new NotesConcept(db);

  try {
    // Create a note for userAlice
    const { note: aliceNoteId } = (await notesConcept.createNote({
      title: "Alice's Note",
      user: userAlice,
    })) as { note: ID };

    await t.step("Deleting a non-existent note should fail", async () => {
      const fakeNoteId = "note:fake" as ID;
      const deleteResult = await notesConcept.deleteNote({
        noteId: fakeNoteId,
        user: userAlice,
      });
      assertEquals(
        "error" in deleteResult,
        true,
        "Deleting non-existent note should fail.",
      );
      assertEquals(
        (deleteResult as any).error,
        `Note with ID ${fakeNoteId} not found.`,
      );
    });

    await t.step(
      "Unauthorized user trying to delete another user's note should fail",
      async () => {
        const deleteResult = await notesConcept.deleteNote({
          noteId: aliceNoteId,
          user: userBob, // Bob tries to delete Alice's note
        });
        assertEquals(
          "error" in deleteResult,
          true,
          "Unauthorized deletion should fail.",
        );
        assertEquals(
          (deleteResult as any).error,
          `User ${userBob} is not authorized to access/modify note ${aliceNoteId}.`,
        );
      },
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: setTitle - requires existing note and ownership", async (t) => {
  const [db, client] = await testDb();
  const notesConcept = new NotesConcept(db);

  try {
    // Create a note for userAlice
    const { note: aliceNoteId } = (await notesConcept.createNote({
      title: "Initial Title",
      user: userAlice,
    })) as { note: ID };
    const originalNote = await notesConcept.getNoteDetails({
      noteId: aliceNoteId,
      user: userAlice,
    }) as any;
    const initialLastModified = originalNote.last_modified;

    await t.step(
      "Setting title on a non-existent note should fail",
      async () => {
        const fakeNoteId = "note:fake" as ID;
        const setResult = await notesConcept.setTitle({
          noteId: fakeNoteId,
          user: userAlice,
          newTitle: "New Fake Title",
        });
        assertEquals(
          "error" in setResult,
          true,
          "Setting title on non-existent note should fail.",
        );
      },
    );

    await t.step(
      "Unauthorized user trying to set title of another user's note should fail",
      async () => {
        const setResult = await notesConcept.setTitle({
          noteId: aliceNoteId,
          user: userBob, // Bob tries to rename Alice's note
          newTitle: "Bob's Title for Alice's Note",
        });
        assertEquals(
          "error" in setResult,
          true,
          "Unauthorized title change should fail.",
        );
        assertEquals(
          (setResult as any).error,
          `User ${userBob} is not authorized to access/modify note ${aliceNoteId}.`,
        );
      },
    );

    await t.step(
      "Setting the same title should be a no-op (no error, no modification)",
      async () => {
        const setResult = await notesConcept.setTitle({
          noteId: aliceNoteId,
          user: userAlice,
          newTitle: "Initial Title", // Same as original
        });
        assertNotEquals(
          "error" in setResult,
          true,
          "Setting same title should not error.",
        );
        const updatedNote = await notesConcept.getNoteDetails({
          noteId: aliceNoteId,
          user: userAlice,
        }) as any;
        assertStrictEquals(
          updatedNote.title,
          "Initial Title",
          "Title should remain unchanged.",
        );
        assertStrictEquals(
          updatedNote.last_modified.getTime(),
          initialLastModified.getTime(),
          "last_modified should not be updated if title is same.",
        );
      },
    );
  } finally {
    await client.close();
  }
});

Deno.test("Action: updateContent - requires existing note and ownership", async (t) => {
  const [db, client] = await testDb();
  const notesConcept = new NotesConcept(db);

  try {
    // Create a note for userAlice
    const { note: aliceNoteId } = (await notesConcept.createNote({
      title: "Content Note",
      user: userAlice,
    })) as { note: ID };
    const originalNote = await notesConcept.getNoteDetails({
      noteId: aliceNoteId,
      user: userAlice,
    }) as any;
    const initialLastModified = originalNote.last_modified;

    await t.step(
      "Updating content on a non-existent note should fail",
      async () => {
        const fakeNoteId = "note:fake" as ID;
        const updateResult = await notesConcept.updateContent({
          noteId: fakeNoteId,
          user: userAlice,
          newContent: "Fake Content",
        });
        assertEquals(
          "error" in updateResult,
          true,
          "Updating content on non-existent note should fail.",
        );
      },
    );

    await t.step(
      "Unauthorized user trying to update content of another user's note should fail",
      async () => {
        const updateResult = await notesConcept.updateContent({
          noteId: aliceNoteId,
          user: userBob, // Bob tries to edit Alice's note
          newContent: "Bob's content for Alice's note",
        });
        assertEquals(
          "error" in updateResult,
          true,
          "Unauthorized content update should fail.",
        );
        assertEquals(
          (updateResult as any).error,
          `User ${userBob} is not authorized to access/modify note ${aliceNoteId}.`,
        );
      },
    );

    await t.step(
      "Updating with the same content should be a no-op (no error, but last_modified might still update for robustness)",
      async () => {
        // First, create a note with some content
        const contentNoteId = (await notesConcept.createNote({
          title: "Same Content Test",
          user: userAlice,
        })) as any;
        const initialContent = "Hello World";
        await notesConcept.updateContent({
          noteId: contentNoteId.note,
          user: userAlice,
          newContent: initialContent,
        });
        const noteAfterFirstUpdate = await notesConcept.getNoteDetails({
          noteId: contentNoteId.note,
          user: userAlice,
        }) as any;
        const lastModifiedAfterFirstUpdate = noteAfterFirstUpdate.last_modified;

        // Now, update with the exact same content
        const updateResult = await notesConcept.updateContent({
          noteId: contentNoteId.note,
          user: userAlice,
          newContent: initialContent, // Same as current content
        });
        assertNotEquals(
          "error" in updateResult,
          true,
          "Updating with same content should not error.",
        );

        const noteAfterSecondUpdate = await notesConcept.getNoteDetails({
          noteId: contentNoteId.note,
          user: userAlice,
        }) as any;
        assertStrictEquals(
          noteAfterSecondUpdate.content,
          initialContent,
          "Content should remain unchanged.",
        );
        // The implementation explicitly checks for content equality and returns early.
        // So, last_modified should *not* change in this specific case.
        assertStrictEquals(
          noteAfterSecondUpdate.last_modified.getTime(),
          lastModifiedAfterFirstUpdate.getTime(),
          "last_modified should not be updated if content is the same due to early exit logic.",
        );
      },
    );
  } finally {
    await client.close();
  }
});

Deno.test("Query: getNoteDetails - requires existing note and ownership", async (t) => {
  const [db, client] = await testDb();
  const notesConcept = new NotesConcept(db);

  try {
    // Create a note for userAlice
    const { note: aliceNoteId } = (await notesConcept.createNote({
      title: "Alice's Viewable Note",
      user: userAlice,
    })) as { note: ID };

    await t.step(
      "Getting details for a non-existent note should fail",
      async () => {
        const fakeNoteId = "note:fake" as ID;
        const getResult = await notesConcept.getNoteDetails({
          noteId: fakeNoteId,
          user: userAlice,
        });
        assertEquals(
          "error" in getResult,
          true,
          "Getting non-existent note should fail.",
        );
        assertEquals(
          (getResult as any).error,
          `Note with ID ${fakeNoteId} not found.`,
        );
      },
    );

    await t.step(
      "Unauthorized user trying to get details of another user's note should fail",
      async () => {
        const getResult = await notesConcept.getNoteDetails({
          noteId: aliceNoteId,
          user: userBob, // Bob tries to view Alice's note
        });
        assertEquals(
          "error" in getResult,
          true,
          "Unauthorized viewing should fail.",
        );
        assertEquals(
          (getResult as any).error,
          `User ${userBob} is not authorized to access/modify note ${aliceNoteId}.`,
        );
      },
    );
  } finally {
    await client.close();
  }
});

Deno.test("Query: getNotesByUser - retrieves only owner's notes", async (t) => {
  const [db, client] = await testDb();
  const notesConcept = new NotesConcept(db);

  try {
    // Create notes
    const { note: aliceNote1Id } = (await notesConcept.createNote({
      title: "Alice Note 1",
      user: userAlice,
    })) as { note: ID };
    const { note: bobNote1Id } = (await notesConcept.createNote({
      title: "Bob Note 1",
      user: userBob,
    })) as { note: ID };
    const { note: aliceNote2Id } = (await notesConcept.createNote({
      title: "Alice Note 2",
      user: userAlice,
    })) as { note: ID };

    await t.step(
      "Retrieving notes for Alice should return only her notes",
      async () => {
        const aliceNotes = await notesConcept.getNotesByUser({
          ownerId: userAlice,
        });
        assertNotEquals(
          "error" in aliceNotes,
          true,
          "Retrieving notes for Alice should not fail.",
        );
        assertEquals(
          (aliceNotes as any[]).length,
          2,
          "Alice should have 2 notes.",
        );
        const retrievedIds = (aliceNotes as any[]).map((n) => n._id);
        assertExists(retrievedIds.find((id) => id === aliceNote1Id));
        assertExists(retrievedIds.find((id) => id === aliceNote2Id));
        assertNotEquals(
          retrievedIds.find((id) => id === bobNote1Id),
          bobNote1Id,
          "Alice's notes should not include Bob's note.",
        );
      },
    );

    await t.step(
      "Retrieving notes for Bob should return only his notes",
      async () => {
        const bobNotes = await notesConcept.getNotesByUser({
          ownerId: userBob,
        });
        assertNotEquals(
          "error" in bobNotes,
          true,
          "Retrieving notes for Bob should not fail.",
        );
        assertEquals((bobNotes as any[]).length, 1, "Bob should have 1 note.");
        assertEquals((bobNotes as any[])[0]._id, bobNote1Id);
      },
    );

    await t.step(
      "Retrieving notes for a user with no notes should return an empty array",
      async () => {
        const userCharlie = "user:Charlie" as ID;
        const charlieNotes = await notesConcept.getNotesByUser({
          ownerId: userCharlie,
        });
        assertNotEquals(
          "error" in charlieNotes,
          true,
          "Retrieving notes for Charlie should not fail.",
        );
        assertEquals(
          (charlieNotes as any[]).length,
          0,
          "Charlie should have 0 notes.",
        );
      },
    );
  } finally {
    await client.close();
  }
});

// ============================================================================
// --- INTERESTING SCENARIOS ---
// ============================================================================

Deno.test("Interesting Scenario 1: Note lifecycle with complex editing patterns", async () => {
  const [db, client] = await testDb();
  const notesConcept = new NotesConcept(db);

  try {
    console.log("\n📝 SCENARIO 1: Complex Note Editing Patterns");
    console.log("=".repeat(50));

    let noteId: ID;

    // 1. Create initial note
    console.log("\n📝 Step 1: Creating initial note");
    const createResult = await notesConcept.createNote({
      title: "Complex Note",
      user: userAlice,
    });
    assertNotEquals(
      "error" in createResult,
      true,
      "Note creation should succeed",
    );
    ({ note: noteId } = createResult as { note: ID });
    console.log("   ✅ Initial note created: 'Complex Note'");

    // 2. Add content gradually
    console.log("\n📝 Step 2: Adding content gradually");
    const edit1Result = await notesConcept.updateContent({
      noteId,
      user: userAlice,
      newContent: "This is the first paragraph of content.",
    });
    assertNotEquals("error" in edit1Result, true, "First edit should succeed");
    console.log("   ✅ First content added");

    const edit2Result = await notesConcept.updateContent({
      noteId,
      user: userAlice,
      newContent:
        "This is the first paragraph of content.\n\nThis is the second paragraph with more details.",
    });
    assertNotEquals("error" in edit2Result, true, "Second edit should succeed");
    console.log("   ✅ Content expanded with second paragraph");

    // 3. Rename note
    console.log("\n✏️  Step 3: Renaming note");
    const renameResult = await notesConcept.setTitle({
      noteId,
      user: userAlice,
      newTitle: "Complex Note - Updated",
    });
    assertNotEquals(
      "error" in renameResult,
      true,
      "Setting title should succeed",
    );
    console.log("   ✅ Note renamed: 'Complex Note - Updated'");

    // 4. Verify final state
    console.log("\n🔍 Step 4: Verifying final state");
    const finalDetails = await notesConcept.getNoteDetails({
      noteId,
      user: userAlice,
    });
    assertNotEquals(
      "error" in finalDetails,
      true,
      "Final retrieval should succeed",
    );
    assertEquals((finalDetails as any).title, "Complex Note - Updated");
    assertEquals(
      (finalDetails as any).content,
      "This is the first paragraph of content.\n\nThis is the second paragraph with more details.",
    );
    console.log("   ✅ Final state verified");
    console.log("   📊 Final note: 'Complex Note - Updated' with 2 paragraphs");

    console.log("\n🎉 SCENARIO 1 COMPLETE");
    console.log("=".repeat(50));
  } finally {
    await client.close();
  }
});

Deno.test("Interesting Scenario 2: Multi-user note isolation and permissions", async () => {
  const [db, client] = await testDb();
  const notesConcept = new NotesConcept(db);

  try {
    console.log("\n👥 SCENARIO 2: Multi-User Note Isolation");
    console.log("=".repeat(50));

    let aliceNoteId: ID;
    let bobNoteId: ID;

    // 1. Alice creates a note
    console.log("1. Alice creating a note...");
    const aliceCreateResult = await notesConcept.createNote({
      title: "Alice's Private Note",
      user: userAlice,
    });
    assertNotEquals(
      "error" in aliceCreateResult,
      true,
      "Alice's note creation should succeed",
    );
    ({ note: aliceNoteId } = aliceCreateResult as { note: ID });
    console.log("✓ Alice's note created");

    // 2. Bob creates a separate note
    console.log("2. Bob creating a separate note...");
    const bobCreateResult = await notesConcept.createNote({
      title: "Bob's Private Note",
      user: userBob,
    });
    assertNotEquals(
      "error" in bobCreateResult,
      true,
      "Bob's note creation should succeed",
    );
    ({ note: bobNoteId } = bobCreateResult as { note: ID });
    console.log("✓ Bob's note created");

    // 3. Bob tries to access Alice's note (should fail)
    console.log("3. Testing cross-user access restrictions...");
    const crossAccessResult = await notesConcept.getNoteDetails({
      noteId: aliceNoteId,
      user: userBob,
    });
    assertEquals(
      "error" in crossAccessResult,
      true,
      "Bob should not access Alice's note",
    );
    console.log("✓ Cross-user access correctly blocked");

    // 4. Bob tries to edit Alice's note (should fail)
    console.log("4. Testing cross-user edit restrictions...");
    const crossEditResult = await notesConcept.updateContent({
      noteId: aliceNoteId,
      user: userBob,
      newContent: "Hacked content",
    });
    assertEquals(
      "error" in crossEditResult,
      true,
      "Bob should not edit Alice's note",
    );
    console.log("✓ Cross-user edit correctly blocked");

    // 5. Both users work independently
    console.log("5. Verifying independent operations...");
    const aliceEditResult = await notesConcept.updateContent({
      noteId: aliceNoteId,
      user: userAlice,
      newContent: "Alice's updated content",
    });
    assertNotEquals(
      "error" in aliceEditResult,
      true,
      "Alice should edit her own note",
    );

    const bobEditResult = await notesConcept.updateContent({
      noteId: bobNoteId,
      user: userBob,
      newContent: "Bob's updated content",
    });
    assertNotEquals(
      "error" in bobEditResult,
      true,
      "Bob should edit his own note",
    );
    console.log("✓ Both users can work independently");

    console.log("\n🎉 SCENARIO 2 COMPLETE");
    console.log("=".repeat(50));
  } finally {
    await client.close();
  }
});

Deno.test("Interesting Scenario 3: Note deletion and recovery patterns", async () => {
  const [db, client] = await testDb();
  const notesConcept = new NotesConcept(db);

  try {
    console.log("\n🗑️  SCENARIO 3: Note Deletion and Recovery");
    console.log("=".repeat(50));

    let noteId: ID;

    // 1. Create and populate note
    console.log("1. Creating and populating note...");
    const createResult = await notesConcept.createNote({
      title: "Temporary Note",
      user: userAlice,
    });
    assertNotEquals(
      "error" in createResult,
      true,
      "Note creation should succeed",
    );
    ({ note: noteId } = createResult as { note: ID });

    const editResult = await notesConcept.updateContent({
      noteId,
      user: userAlice,
      newContent: "This is important content that will be deleted.",
    });
    assertNotEquals(
      "error" in editResult,
      true,
      "Content addition should succeed",
    );
    console.log("✓ Note created and populated");

    // 2. Delete the note
    console.log("2. Deleting the note...");
    const deleteResult = await notesConcept.deleteNote({
      noteId,
      user: userAlice,
    });
    assertNotEquals(
      "error" in deleteResult,
      true,
      "Note deletion should succeed",
    );
    console.log("✓ Note deleted");

    // 3. Try to access deleted note (should fail)
    console.log("3. Testing access to deleted note...");
    const accessDeletedResult = await notesConcept.getNoteDetails({
      noteId,
      user: userAlice,
    });
    assertEquals(
      "error" in accessDeletedResult,
      true,
      "Access to deleted note should fail",
    );
    console.log("✓ Deleted note access correctly blocked");

    // 4. Try to edit deleted note (should fail)
    console.log("4. Testing edit of deleted note...");
    const editDeletedResult = await notesConcept.updateContent({
      noteId,
      user: userAlice,
      newContent: "Attempted edit",
    });
    assertEquals(
      "error" in editDeletedResult,
      true,
      "Edit of deleted note should fail",
    );
    console.log("✓ Deleted note edit correctly blocked");

    // 5. Create new note with same title
    console.log("5. Creating new note with same title...");
    const recreateResult = await notesConcept.createNote({
      title: "Temporary Note", // Same title
      user: userAlice,
    });
    assertNotEquals(
      "error" in recreateResult,
      true,
      "Recreation with same title should succeed",
    );
    console.log("✓ New note created with same title");

    console.log("\n🎉 SCENARIO 3 COMPLETE");
    console.log("=".repeat(50));
  } finally {
    await client.close();
  }
});

Deno.test("Interesting Scenario 4: Rapid note operations and concurrency", async () => {
  const [db, client] = await testDb();
  const notesConcept = new NotesConcept(db);

  try {
    console.log("\n⚡ SCENARIO 4: Rapid Note Operations");
    console.log("=".repeat(50));

    const noteIds: ID[] = [];

    // 1. Rapid note creation
    console.log("1. Creating multiple notes rapidly...");
    const createPromises = [];
    for (let i = 0; i < 5; i++) {
      createPromises.push(
        notesConcept.createNote({
          title: `Rapid Note ${i}`,
          user: userAlice,
        }),
      );
    }

    const createResults = await Promise.all(createPromises);
    for (const result of createResults) {
      assertNotEquals(
        "error" in result,
        true,
        "All rapid note creations should succeed",
      );
      noteIds.push((result as { note: ID }).note);
    }
    console.log("✓ All rapid note creations succeeded");

    // 2. Rapid content editing
    console.log("2. Editing notes rapidly...");
    const editPromises = [];
    for (let i = 0; i < noteIds.length; i++) {
      editPromises.push(
        notesConcept.updateContent({
          noteId: noteIds[i],
          user: userAlice,
          newContent: `Content for rapid note ${i}
This is line 2
This is line 3`,
        }),
      );
    }

    const editResults = await Promise.all(editPromises);
    for (const result of editResults) {
      assertNotEquals(
        "error" in result,
        true,
        "All rapid edits should succeed",
      );
    }
    console.log("✓ All rapid edits succeeded");

    // 3. Rapid renaming
    console.log("3. Renaming notes rapidly...");
    const renamePromises = [];
    for (let i = 0; i < noteIds.length; i++) {
      renamePromises.push(
        notesConcept.setTitle({
          noteId: noteIds[i],
          user: userAlice,
          newTitle: `Updated Rapid Note ${i}`,
        }),
      );
    }

    const renameResults = await Promise.all(renamePromises);
    for (const result of renameResults) {
      assertNotEquals(
        "error" in result,
        true,
        "All rapid renames should succeed",
      );
    }
    console.log("✓ All rapid renames succeeded");

    // 4. Verify all notes
    console.log("4. Verifying all notes...");
    for (let i = 0; i < noteIds.length; i++) {
      const details = await notesConcept.getNoteDetails({
        noteId: noteIds[i],
        user: userAlice,
      });
      assertNotEquals(
        "error" in details,
        true,
        `Note ${i} should be retrievable`,
      );
      assertEquals((details as any).title, `Updated Rapid Note ${i}`);
      assertEquals(
        (details as any).content,
        `Content for rapid note ${i}
This is line 2
This is line 3`,
      );
    }
    console.log("✓ All notes verified");

    console.log("\n🎉 SCENARIO 4 COMPLETE");
    console.log("=".repeat(50));
  } finally {
    await client.close();
  }
});

Deno.test("Interesting Scenario 5: Note content edge cases and validation", async () => {
  const [db, client] = await testDb();
  const notesConcept = new NotesConcept(db);

  try {
    console.log(
      "=== Interesting Scenario 5: Content Edge Cases and Validation ===",
    );

    let noteId: ID;

    // 1. Create note with empty content
    console.log("1. Creating note with empty content...");
    const createResult = await notesConcept.createNote({
      title: "Edge Case Note",
      user: userAlice,
    });
    assertNotEquals(
      "error" in createResult,
      true,
      "Empty content note creation should succeed",
    );
    ({ note: noteId } = createResult as { note: ID });
    console.log("✓ Empty content note created");

    // 2. Test very long content
    console.log("2. Testing very long content...");
    const longContent = "A".repeat(10000); // 10,000 character content
    const longEditResult = await notesConcept.updateContent({
      noteId,
      user: userAlice,
      newContent: longContent,
    });
    assertNotEquals(
      "error" in longEditResult,
      true,
      "Long content should be accepted",
    );
    console.log("✓ Long content accepted");

    // 3. Test special characters
    console.log("3. Testing special characters...");
    const specialContent =
      "Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?/~`\nUnicode: 你好世界 🌍\nMath: ∑∞∫∂∇";
    const specialEditResult = await notesConcept.updateContent({
      noteId,
      user: userAlice,
      newContent: specialContent,
    });
    assertNotEquals(
      "error" in specialEditResult,
      true,
      "Special characters should be accepted",
    );
    console.log("✓ Special characters accepted");

    // 4. Test multiline content
    console.log("4. Testing multiline content...");
    const multilineContent =
      "Line 1\n\nLine 2\n\n\nLine 3\n\tIndented line\n  \n  \n  \nFinal line";
    const multilineEditResult = await notesConcept.updateContent({
      noteId,
      user: userAlice,
      newContent: multilineContent,
    });
    assertNotEquals(
      "error" in multilineEditResult,
      true,
      "Multiline content should be accepted",
    );
    console.log("✓ Multiline content accepted");

    // 5. Test title edge cases
    console.log("5. Testing title edge cases...");
    const longTitleResult = await notesConcept.setTitle({
      noteId,
      user: userAlice,
      newTitle: "A".repeat(200), // Very long title
    });
    assertNotEquals(
      "error" in longTitleResult,
      true,
      "Long title should be accepted",
    );
    console.log("✓ Long title accepted");

    const specialTitleResult = await notesConcept.setTitle({
      noteId,
      user: userAlice,
      newTitle: "Special Title: !@#$%^&*()_+-=[]{}|;:,.<>?/~` 你好世界 🌍",
    });
    assertNotEquals(
      "error" in specialTitleResult,
      true,
      "Special character title should be accepted",
    );
    console.log("✓ Special character title accepted");

    // 6. Verify final state
    console.log("6. Verifying final state...");
    const finalDetails = await notesConcept.getNoteDetails({
      noteId,
      user: userAlice,
    });
    assertNotEquals(
      "error" in finalDetails,
      true,
      "Final retrieval should succeed",
    );
    assertEquals((finalDetails as any).content, multilineContent);
    assertEquals(
      (finalDetails as any).title,
      "Special Title: !@#$%^&*()_+-=[]{}|;:,.<>?/~` 你好世界 🌍",
    );
    console.log("✓ Final state verified");

    console.log("\n🎉 SCENARIO 5 COMPLETE");
    console.log("=".repeat(50));
  } finally {
    await client.close();
  }
});
