class List {
  constructor(listName,icon)
  {
    this.title = listName.trim()
    this.taskArray = [];
    this.dateCreated = Date.now();
    if(icon==undefined)
      this.icon = "folder"
    else
      this.icon = icon
  }
}