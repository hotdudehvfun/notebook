class List {
  constructor(listName,icon)
  {
    this.title = listName.trim()
    this.taskArray = [];
    this.dateCreated = Date.now();
    this.is_locked = false;
    if(icon==undefined)
      this.icon = "📜"
    else
      this.icon = icon
  }
}