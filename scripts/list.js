class List {
  constructor(listName,icon)
  {
    this.id = this.generate_id();
    this.title = listName.trim()
    this.taskArray = [];
    this.dateCreated = Date.now();
    this.is_locked = false;
    if(icon==undefined)
      this.icon = "📜"
    else
      this.icon = icon
  }

  generate_id() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }
}