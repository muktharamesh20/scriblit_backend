
## Concepts

**Notes[User]**
- **Purpose** records written information
- **Principle** Each user can create and manage their own notes.
A note belongs to exactly one user and contains a title and body text.
Users can view, edit, rename, and delete their own notes.
- **State** Set of Notes with
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

**PasswordAuth**  
- **Purpose:** Limit access to known users  
- **Principle:** After setting a username and password for a user, the user can authenticate with that username and password and be treated each time as the same user.
- **State:** Set of Users with 
    - `username` string
    - `password` string  
- **Actions:**
    - `register(username: String, password: String): (user: User)`
        - **requires:** the username does not exist
        - **effect** create a new user with this username and password and returns the user  
    - `authenticate(user: username, password: String): (user: User)`
        - **requires:** the username and password combination exists in the set of users
        - **effect** returns the user


**Tags[Item]** 
- **Purpose** Flags items for later 
- **Principle:** a user labels item to flag it.  Later, the user can grab just the items with a certain tag, so it makes it easier to access.
- **State:** 
    - Set of tags with 
        - `label` string
        - set of `item` 
- **Actions:**
    - `addTag(label: String, item: Item): (t: Tag)`
        - **requires** there does not already exist a tag associated with that label and item
        - **effect** creates a tag with that label and item
    - `removeTag(t: Tag)`
        - **requires** t is in the set of tags
        - **effect** removes the tag

**concept Summaries[Item]**
-**purpose**
    - highlights the most important part of Item
-**principle**
    - the user can either manually create a summary or ask an LLM to generate one. 
    - If AI is chosen, the LLM receives the Item content and then returns a concise, readable summary. 
    - The user can accept or edit this summary.
- **state**
    - a set of `Item` with 
        - summary String  

    - invariants
        -every item has at most one summary
        -summary is a concise, relevant, and readable highlight of the item's content
        -summary contains no meta-language or AI disclaimers
        -summary is at most 50% the length of the item's content or under 150 words
- **actions**
    - setSummary(summary: String, item: Item): (s: Summary)
        - effect if `item` already exists, change the summary associated with `item` to `summary`.  
        - If `item` does not exist in Summaries, create a new summary for `item` with a summary `summary`.
    - setSummaryWithAI(text: String, item: Item): (s: Summary)
        - requires text is nonempty
        - effect creates a summary of `text` with an LLM and associates it with the item


**Folder[Item]**  
- **Purpose:** Organize items hierarchically  
- **Principle:** After you create a folder and insert elements into it, you can move the folder into another folder and all the elements still belong to it.  You can insert folders or items inside a folder.
- **State:** 
    - Set of Folders with 
        - name String
        - a contained set of Folders
        - an elements set of `Item`
- **Actions:** 
    - `createRootFolder(): (f: Folder)`
        - **requires** no other folder has been created
        - **effect** creates a root folder to nest elements and folders inside of
    - `insertFolder(f1: Folder, f2: Folder)`
        - **requires** f2 is not hierarchcly a descendent of f1.  In other words, f2 cannot be inside of f1 through any path of folders.
        - **effect** if f1 is already in a folder, remove it from that folder and move it into f2.  If f1 is a new folder, just add it to f2.
    - `deleteFolder(f: Folder)`
        - **effect** deletes f and everything contained inside of f from the folder hierarchy 
    - `insertItem(i: Item, f: Folder)`
        - **effect** if i is already in a folder, remove it from that folder and insert it into f.  Otherwise, simply insert it into f


**Request**
