class List {

  static COMPLETED = 1;
  static PRIORITY = 2;
  static ALL = 3;
  static PENDING = 4;

  constructor(listName,icon)
  {
    this.title = listName.trim();
    this.taskArray = [];
    this.dateCreated = Date.now();
    this.dateCompleted = "";
    //default color
    this.borderColor=getRandomColor();
    //google font icon default
    if(icon==undefined)
      this.icon = "folder"
    else
      this.icon = icon
  }

  //get task by id from a list
  static getTaskById(id, list) {
    let result = list.taskArray.filter(item => { return item.dateCreated == id });
    if (result.length == 1)
      return result[0];
    return null;
  }

  //get index of task
  static getTaskIndexById(id, list) {
    for (let index = 0; index < list.taskArray.length; index++) {
      if (list.taskArray[index].dateCreated == id)
        return index;
    }
    return -1;
  }

  static getProgressText = (separator, list) => {
    //5/5 or 5 out of 5
    return List.getCount(List.COMPLETED, list) + separator + list.taskArray.length;
  }

  static isListCompleted = (list) => {
    return List.getCount(List.COMPLETED, list) == list.taskArray.length;
  }

  //in percent
  static getListProgress = (list) => {
    if (list.taskArray.length != 0)
      return Math.floor((List.getCount(List.COMPLETED, list) / list.taskArray.length) * 100)

    return 0;
  }
  static getCount = (type, list) => {
    if (type == List.COMPLETED)
      return list.taskArray.filter(function (task) { return task.isTaskCompleted == true }).length;

    if (type == List.PRIORITY)
      return list.taskArray.filter(function (task) { return task.isPriorityTasked == true }).length;
  }

  static getUpcomingTasks = (list, type) => {
    let temp = [];
    list.taskArray.forEach(item => {
      let diff = timeToGo(item.dateToBoCompletedBy);
      switch (type) {
        case List.COMPLETED:
          if (item.isTaskCompleted)
            temp.push({ "diff": diff, "task": item });
          break;
        case List.PENDING:
          if (!item.isTaskCompleted)
          {
            if(diff=="Past tasks")
              temp.push({ "diff": "Expired Tasks", "task": item });
            else
              temp.push({ "diff": diff, "task": item });
          }
          break;
        case List.PRIORITY:
          if (item.isPriorityTasked)
            temp.push({ "diff": diff, "task": item });
          break;
        case undefined:
          temp.push({ "diff": diff, "task": item });
          break;
      }
    });
    let group = groupBy(temp, temp => temp.diff);
    return group;
  }
}