// src/concepts/Scriblink/notes.test.ts

import {
  assertEquals,
  assertExists,
  assertNotEquals,
  assertStrictEquals,
} from "jsr:@std/assert";
import { testDb } from "@utils/database.ts"; // Assuming @utils/database.ts contains testDb
import { ID } from "@utils/types.ts"; // Assuming @utils/types.ts contains ID
import NotesConcept from "./notes.ts"; // Import the concept to be tested

// Define some test User IDs
const userAlice = "user:Alice" as ID;
const userBob = "user:Bob" as ID;

Deno.test("Principle: User can create, view, rename, edit, and delete their own note", async (t) => {
  const [db, client] = await testDb();
  const notesConcept = new NotesConcept(db);

  try {
    let noteId: ID; // To store the ID of the created note
    let initialCreationTime: Date;

    await t.step("1. User creates a new note with a title", async () => {
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
    });

    await t.step("2. User can view their own notes", async () => {
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
    });

    await t.step("3. User can rename their note", async () => {
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
    });

    await t.step("4. User can edit the content of their note", async () => {
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
    });

    await t.step("5. User can delete their note", async () => {
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
    });
  } finally {
    await client.close();
  }
});

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
        const contentNoteId =
          (await notesConcept.createNote({
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
