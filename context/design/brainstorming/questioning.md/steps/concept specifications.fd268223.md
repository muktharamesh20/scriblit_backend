---
timestamp: 'Mon Oct 20 2025 18:35:52 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_183552.3923372f.md]]'
content_id: fd268223666d5bef7954255bea52309502857c856d7fb972ba74ebf2282d54c8
---

# concept specifications:

**Folder\[Item, User]**

* **Purpose:** Organize items hierarchically
* **Principle:** After you create a folder and insert elements into it, you can move the folder into another folder and all the elements still belong to it.  You can insert folders or items inside a folder.
* **State:**
  * Set of Folders with
    * title String
    * an owner User
    * a contained set of Folders
    * an elements set of `Item`
* **Actions:**
  * `initializeFolders(u: User): (f: Folder)`
    * **requires** the user `u` has created no other folders
    * **effect** creates a root folder to nest elements and folders inside of that the user owns
  * `createFolder(u: User, title: String, parent: Folder): (f: Folder)`
    * **requires** `parent` exists and has owner `u`
    * **effect** creates a folder with title `title` that is a child of the folder `parent`
  * `moveFolder(f1: Folder, f2: Folder)`
    * **requires** f2 is not hierarchcly a descendent of f1.  In other words, f2 cannot be inside of f1 through any path of folders.  Both folders must have the same owner.
    * **effect** if f1 is already in a folder, remove it from that folder and move it into f2.  If f1 is a new folder, just add it to f2.
  * `deleteFolder(f: Folder)`
    * **effect** deletes f and everything contained inside of f from the folder hierarchy
  * `insertItem(i: Item, f: Folder)`
    * **effect** if i is already in a folder, remove it from that folder and insert it into f.  Otherwise, simply insert it into f
  * `deleteItem(i: Item)`
    * **requires** the item exists
    * **effect** removes the item from whichever folder it is currently located in.
