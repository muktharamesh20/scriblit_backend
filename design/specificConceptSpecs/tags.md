
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