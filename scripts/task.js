//Task class to handle tasks
class Task {
  constructor(taskName) {
    //text of task to display
    this.title = taskName.trim();
    //name of list which to task belongs
    this.listName = "";
    this.dateCreated = Date.now();
    this.dateCompleted = "";
    this.dateToBoCompletedBy = Date.now() + 864000000;

    //true or false
    this.isTaskCompleted = false;
    this.dashedWidth = 0;
    this.dashedHeight = 0;
    this.isPriorityTasked = false;
    //default is bubble_chart
    this.taskIcon = "radio_button_unchecked"
  }
  static NOT_SCHEDULED = "not a time event";
}