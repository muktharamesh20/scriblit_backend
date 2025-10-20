---
timestamp: 'Mon Oct 20 2025 18:54:32 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_185432.542cad41.md]]'
content_id: 8bcad52b1f4377cb891dfe32f52024c75a8f4922ec12032f99eb499f3096038a
---

# concept specifications:

**Tags\[Item, User]**

* **Purpose** Flags items for later
* **Principle:** a user labels item to flag it.  Later, the user can grab just the items with a certain tag, so it makes it easier to access.
* **State:**
  * Set of tags with
    * `label` string
    * set of `item`
    * `owner` User
* **Actions:**
  * `addTag(user: User, label: String, item: Item): (t: Tag)`
    * **requires** there does not already exist a tag associated with that label and item, the label also must not be empty or only whitespaace
    * **effect** creates a tag with that label and item
  * `removeTagFromItem(t: Tag, i: Item)`
    * **requires** `t` is associated with item `i`
    * **effect** removes the tag from the item
