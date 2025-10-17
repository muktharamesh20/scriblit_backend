**Notes[User]**
- **Purpose** records written information
- **Principle** Each user can create and manage their own notes.
A note belongs to exactly one user and contains a title and body text.
Users can view, edit, rename, and delete their own notes.
- **State** 
    - Set of Notes with
        - title String
        - content String
        - owner User
        - date_created Date
        - last_modified Date

    -invariants
        - each note has exactly one owner
        - last_modified ≥ date_created
        - only the owner can modify or delete the note
- **Actions**
    - `createNote(t?: String, u: User): (n: Note)`
        - **effect:** Creates a new note.  If t is specified, the title is t.  Otherwise, the title is "Untitled".  date_created and last_modified is set to the current time.  The owner is u.  
    - `deleteNote(note: Note)`
        - **requires** note exists
        - **effect** deletes the notes
    - `setTitle(t: String, n: Note)`
        - **effect** Renames the title of note n with as t 
    - `updateContent(t: String, n: Note)`
        - **effect** Replaces the content associated with `n` with `t`.  Also updates last_modified to the current time.