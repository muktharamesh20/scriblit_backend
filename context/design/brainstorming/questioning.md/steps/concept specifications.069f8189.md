---
timestamp: 'Mon Oct 20 2025 18:51:28 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_185128.b72574e3.md]]'
content_id: 069f8189f22c2aa0ad7103d041926e3c6a2302eb635291fce038fec615db258d
---

# concept specifications:

**Notes\[User]**

* **Purpose** records written information
* **Principle** Each user can create and manage their own notes.
  A note belongs to exactly one user and contains a title and body text.
  Users can view, edit, rename, and delete their own notes.
* **State**

  * Set of Notes with
    * title String
    * content String
    * owner User
    * date\_created Date
    * last\_modified Date

  -invariants
  \- each note has exactly one owner
  \- last\_modified ≥ date\_created
  \- only the owner can modify or delete the note
* **Actions**
  * `createNote(t?: String, u: User): (n: Note)`
    * **effect:** Creates a new note.  If t is specified, the title is t.  Otherwise, the title is "Untitled".  date\_created and last\_modified is set to the current time.  The owner is u.
  * `deleteNote(note: Note)`
    * **requires** note exists
    * **effect** deletes the notes
  * `setTitle(t: String, n: Note)`
    * **effect** Renames the title of note n with as t
  * `updateContent(t: String, n: Note)`
    * **effect** Replaces the content associated with `n` with `t`.  Also updates last\_modified to the current time.
