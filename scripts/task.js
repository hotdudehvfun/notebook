//Task class to handle tasks
class Task {
  constructor(note_content) {
    this.title = note_content.trim();
    this.dateCreated = Date.now();
    this.isTaskCompleted = false;
    this.taskIcon = "radio_button_unchecked"
  }
}