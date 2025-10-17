
**Tags[Item, User]** 
- **Purpose** Flags items for later 
- **Principle:** a user labels item to flag it.  Later, the user can grab just the items with a certain tag, so it makes it easier to access.
- **State:** 
    - Set of tags with 
        - `label` string
        - set of `item` 
        - `owner` User
- **Actions:**
    - `addTag(user: User, label: String, item: Item): (t: Tag)`
        - **requires** there does not already exist a tag associated with that label and item, the label also must not be empty or only whitespaace
        - **effect** creates a tag with that label and item
    - `removeTagFromItem(t: Tag, i: Item)`
        - **requires** `t` is associated with item `i`
        - **effect** removes the tag from the item