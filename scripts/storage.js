class App {

  constructor() {
    //contains version of app
    this.listArray = [];
    this.selectedListIndex = 0;
  }

  //call init at startup
  init = () => {
    //everything starts from here
    let read = this.readData();
    // console.log(read);
    if (-1 == read)
    {
      //first time app load default values
      console.log('No previous record found.')
      this.setupDemoList();
      this.selectedListIndex = 0;
      this.saveData();
      this.loadList(this.selectedListIndex);
    } else if (1 == read) {
      //already saved something load first list
      let tempIndex = localStorage.selectedListIndex;
      if (isNaN(localStorage.selectedListIndex))
        this.selectedListIndex = 0;
      else
        this.selectedListIndex = localStorage.selectedListIndex;

      //this.loadList(this.selectedListIndex);
    }
    //also load rest of the lists in view all lists panel
  }


  clearData = () => {
    localStorage.clear();
  }

  readData = () => {
    try {
      let appData = localStorage.appData;
      if (appData == undefined) {
        return -1;
      } else {
        //load
        let json = JSON.parse(appData);
        this.listArray = json;
        return 1;
      }
    } catch (error) {
      console.log("Error occurred while reading Data" + error);
      return 0;
    }
  }

  removeCompletedTasks = () =>
  {
    try
    {
      if(this.listArray.length>0)
      {
        let filteredArray = this.listArray[this.selectedListIndex].taskArray.filter(function (item) {
          return item.isTaskCompleted == false;
        });
        // console.log(filteredArray);
        this.listArray[this.selectedListIndex].taskArray = filteredArray;
        this.saveData();
        this.loadList(this.selectedListIndex);
        toggleMoreOptionsState(false);
        return true
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  
  removeList=()=>
  {
    try
    {
      let removedList=this.listArray.splice(this.selectedListIndex,1);    
      if(removedList.length==1)
      {
        if(this.listArray.length>=1)
        {
          this.selectedListIndex=0;
        }else
        {
          this.selectedListIndex=-1;
        }
        this.loadList(this.selectedListIndex);
        this.saveData();
        toggleMoreOptionsState(false);
        return true;
      }
      else
        return false;
    }catch(e)
    {
      return false;
    }
  }

  purgeList = () => {
    try{
      if(this.listArray.length>0)
      {
        this.listArray[this.selectedListIndex].taskArray = [];
        this.saveData();
        this.loadList(this.selectedListIndex);
        toggleMoreOptionsState(false);
        return true;
      }
    }catch(e){
      return false;
    }
  }

  saveData = () => {
    //save data about app in local
    try {
      //save listArray
      let json = JSON.stringify(this.listArray);
      localStorage.appData = json;
      //save selectedListIndex
      localStorage.selectedListIndex = this.selectedListIndex;
    } catch (error) {
      console.log("Error occurred while saving Data" + error);
    }
  }

  setupDemoList = () =>
  {
    let list = new List("Todo tasks");
    list.taskArray.push(new Task("Call Tanya to say hi!"))
    list.taskArray.push(new Task("Remind me send email in the evening"))
    this.selectedListIndex = 0
  }

  getSelectedList = () => {
    try {
      return this.listArray[this.selectedListIndex];
    } catch (e) {
      console.log(e);
    }
    return null;
  }


  //load tasks of a list
  loadList = (index) => 
  {
    if (index >= 0 && index < this.listArray.length)
    {
      this.selectedListIndex = index;
      this.saveData();
      let list = this.listArray[index];
      if (list != null || list != undefined)
      {
        //remove disbaled 
        document.querySelector("#open-more-panel").setAttribute("class","nav-bar-item");
        document.querySelector("#open-add-new-task-panel").setAttribute("class","nav-bar-item");

        //also hide search bar
        document.querySelector("#back-button").style.display="none";
        $("#back-button").val("");
        
        
        document.querySelector("#back-button").style.display="block";
        document.querySelector("#selectedList").style.display="block";
        document.querySelector("#selectedList").innerHTML = list.title;

        //list age
        document.querySelector("#list-age").innerHTML=timeSince(list.dateCreated);

        let container = document.querySelector("#tasks-container");
        let html = "";

        //first load completed tasks
        if (List.getCount(List.COMPLETED, list) > 0) {
          html += `<div class="list-upcoming-tasks-headline">Completed Tasks</div>`;
          list.taskArray.forEach(function (element, taskNo) {
            if (element.isTaskCompleted) {
              html += `<div id="${index},${element.dateCreated}" class="task completed `;
              if (element.isPriorityTasked)
                html += ` priority `;
              html += `"`;
              html += `onClick="handleClickOnTask(this)">`;
              html += `<i class="material-icons">${element.taskIcon}</i>`;
              html += `<span>${element.title.trim()}</span> `;
              html += `</div>`;
            }
          });
        }

        //then upcoming pending tasks
        let upComingTasks = List.getUpcomingTasks(list, List.PENDING);
        upComingTasks.forEach(function (array, key) {
          html += `<div class="list-upcoming-tasks-headline">${key}</div>`;
          array.forEach(function (item) {
            let element = item.task;
            html += `<div id="${index},${element.dateCreated}" class="task`;
            if (element.isTaskCompleted)
              html += ` completed `;
            if (element.isPriorityTasked)
              html += ` priority `;
            html += `"`;
            html += `onClick="handleClickOnTask(this)" >`;
            html += `<i class="material-icons">${element.taskIcon}</i>`;
            html += `<span>${element.title.trim()}</span> `;
            html += `</div>`;
          });
        });
        
        if (html.length == 0)
        {
         handleNoTasksState();
        }else
        {
          container.innerHTML = html;
          this.updateListProperties(list);


          
        }
      }
    }else
    {
      //empty list
      console.log("no list ");
      handleNoListState();
    }
  }

  updateListProperties = (list) =>
  {    
    document.querySelector("#list-progress-1").innerHTML = List.getProgressText('/', list);
    document.querySelector("#list-progress-2").innerHTML = List.getCount(List.PRIORITY, list)+" favs";
  }


  updateTaskState = (id, state, width, heigth) =>
  {
    try
    {
      let ids = id.split(",");
      if (id != null || id != undefined)
      {
        if (ids.length == 2)
        {
          let taskPos = List.getTaskIndexById(ids[1], this.listArray[ids[0]]);
          this.listArray[ids[0]].taskArray[taskPos].isTaskCompleted = state;
          //this.listArray[ids[0]].taskArray[taskPos].dashedWidth = width;
          //this.listArray[ids[0]].taskArray[taskPos].dashedHeight = heigth;
        }
      }
      this.saveData();
      this.updateListProperties(this.getSelectedList())
      this.loadList(this.selectedListIndex);
      return this.listArray[ids[0]].taskArray[taskPos].isTaskCompleted; 
    } catch (error)
    {
      return null;      
    }
    return null;
  }

  updateTaskPriority = (id, state) =>
  {
    try
    {
      let ids = id.split(",");
      if (id != null || id != undefined)
      {
        if (ids.length == 2)
        {
          let taskPos = List.getTaskIndexById(ids[1], this.listArray[ids[0]]);
          this.listArray[ids[0]].taskArray[taskPos].isPriorityTasked = state;
        }
      }
      this.saveData();
      this.updateListProperties(this.getSelectedList())
      this.loadList(this.selectedListIndex);
      return this.listArray[ids[0]].taskArray[taskPos].isPriorityTasked; 
    } catch (error)
    {
      return null;      
    }
    return null;
  }

  //passing id as 0,11233
  getTaskState=(listIdAndTaskId)=>
  {
    if (listIdAndTaskId != null || listIdAndTaskId != undefined) {
      let ids = listIdAndTaskId.split(",");
      if (ids.length == 2) 
      {
        let taskPos = List.getTaskIndexById(ids[1], this.listArray[ids[0]]);
        return this.listArray[ids[0]].taskArray[taskPos].isTaskCompleted
      }
    } 
    return null;   
  }

  //pass id as 0,13323232
  getTaskPriority=(listIdAndTaskId)=>
  {
    if (listIdAndTaskId != null || listIdAndTaskId != undefined) {
      let ids = listIdAndTaskId.split(",");
      if (ids.length == 2) 
      {
        let taskPos = List.getTaskIndexById(ids[1], this.listArray[ids[0]]);
        return this.listArray[ids[0]].taskArray[taskPos].isPriorityTasked;
      }
    } 
    return null;   
  }

    //passing id as 0,11233
    removeTask=(listIdAndTaskId)=>
    {
      if (listIdAndTaskId != null || listIdAndTaskId != undefined) {
        let ids = listIdAndTaskId.split(",");
        if (ids.length == 2) 
        {
          let taskPos = List.getTaskIndexById(ids[1], this.listArray[ids[0]]);
          this.listArray[ids[0]].taskArray.splice(taskPos,1);
        }
        this.saveData();
        this.updateListProperties(this.getSelectedList())
        this.loadList(this.selectedListIndex);
      } 
    }



    //search tasks
    getSearchResults=(text)=>
    {
      let results=[];
      if (this.listArray.length > 0)
      {
          this.listArray.forEach(function (list,listno)
          {
            list.taskArray.forEach(function(item,taskIndex)
            {
              if(item.title.toLocaleLowerCase().includes(text.toLocaleLowerCase()))
              {
                item.tempListNo=listno;
                item.tempIndexNo=taskIndex;
                results.push(item);
              }
            });
        });
      }
      return results;
    }

}


//---------------------------------------------------




class Icons {

  //get task to according to hint
  static getTaskIcon = () =>
  {
      return icon_database[Math.floor(Math.random() * icon_database.length)];
  }
}

//create default list and a first task
var appObject = new App();

