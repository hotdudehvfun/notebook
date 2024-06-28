let app = angular.module("myapp", []);
//use this to create new properties on previous version
let patchApplied = false;
console.log("app version:3.2.0")
console.log(`
Features
  > Added progress bar code:@20%
  > Merge tasks
  > Delete Tasks
  > Delete Notebooks

`)


app.filter("sanitize", ['$sce', function ($sce) {
  return function (htmlCode) {
    return $sce.trustAsHtml(htmlCode);
  }
}]);


app.controller('myctrl', function ($scope, $sce) {
  // handle html for task input
  $scope.handle_task_html = function(text){
    //handle progress bar
    text = parseWikiTextToHTML(text)
    return text
  }


  //for searching made easy
  $scope.getTasksOnly = function () {
    var allTasks = [];
    $scope.listArray.forEach(list => {
      allTasks = allTasks.concat(list.taskArray)
    });
    //console.log(allTasks);
    return allTasks;
  };


  $scope.load_list_info = function(index)
  {
    $scope.selectedListIndex = index;
    $scope.list_index_for_hold_event = index
    $scope.show_delete_list_option = true
    $scope.show_purge_list_option = true
  }

  $scope.loadList = function (index) {
    // a valid list is selected
    if (index >= 0) {
      $scope.taskArray = $scope.listArray[index].taskArray;
      // when name is changed list view is hided and task view is shown
      $scope.selectedListName = $scope.listArray[index].title;
      $scope.pageTitle = $scope.selectedListName;
      // console.log($scope.selectedListName)
      //load list info, this function also used by tap and hold event to load list info
      $scope.load_list_info(index)
      if ($scope.moveInProgress) {
        //save task to move
        $scope.taskArray.push($scope.noteToMove);
        showToast("Note moved!")
        $scope.moveInProgress = false
        $scope.noteToMove = null;
        $scope.saveData();
      }

    }


  }


  $scope.handleBackButton = function () {
    //on back button show notebooks
    //hide notes
    try {
      // console.log("back button clicked")
      $scope.search = "";
      $scope.pageTitle = $scope.defaultPageTitle;
      $scope.show_delete_list_option = false
      $scope.show_purge_list_option = false
      $scope.selectedListIndex = -1
    } catch (err) {
      console.log("Error while back button",err)
    }
  }

  $scope.init_hammer_touch_events = function () {
    var hammertime = new Hammer(document.querySelector("body"));
    console.log(hammertime)
    hammertime.on('swiperight', function (ev) {
      $scope.handleBackButton()
      $scope.$apply();
    });
  }


  $scope.checkIfEnterPressed = function (e) {
    if (e.keyCode == 13) {
      $scope.handleCreateList()
      e.target.value = "";
    }
  }

  $scope.handleCreateList = function () {
    if ($scope.newListName.length > 1) {
      let newList = new List($scope.newListName);
      // $scope.selectedListIndex = 
      $scope.listArray.push(newList)
      showToast(`Notebook create:  ${newList.title}`);
      document.querySelector(".add-new-list-title").value = ""
      $scope.saveData();
    }
  }


  $scope.handleSaveTask = function () {
    try {
      if(
        $scope.newTaskContent.trim().length>0 && 
        ($scope.selectedListIndex != undefined ||$scope.selectedListIndex>=0) )
        {
          let newTask = new Task($scope.newTaskContent.trim())
          $scope.listArray[$scope.selectedListIndex].taskArray.push(newTask)
          $scope.taskArray = $scope.listArray[$scope.selectedListIndex].taskArray
          

          //reset options
          $scope.newTaskContent = ""
          $scope.new_task_content_height = 80
          $scope.show_add_task_edit_options = false

          $scope.saveData();
          showToast(`Note added`);
      }
    } catch (err) {
      console.log(err)
      showToast(`Unable to add note`)
    }
  }


  $scope.saveData = function () {
    //save data about app in local
    let json = angular.toJson($scope.listArray);
    localStorage.appData = json;
    //save selectedListIndex
    localStorage.selectedListIndex = $scope.selectedListIndex;

    //save theme
    localStorage.theme = $scope.theme
    console.log("theme saved = ", localStorage.theme)
  }

  $scope.emptyList = handleNoTasksState();


  $scope.handleDeleteList = function () {
    if ($scope.selectedListIndex >= 0) {
      //show message removed
      console.log("List at index removed:", $scope.selectedListIndex)
      showToast("List Deleted!");
      let removedList = $scope.listArray.splice($scope.selectedListIndex, 1);
      $scope.saveData();
      $scope.toggle_list_more_options_visibility()
      //go back to main screen after delete
      $scope.handleBackButton();
    }
  }

  $scope.handleClickOnTask = function (event, key) {

    // console.log(event.currentTarget)
    if ($scope.mergeInProgress) {
      //merge in progress no need to show options
      //merger with selected task
      $scope.taskI = key;
      if ($scope.taskI == $scope.oldTaskI) {
        showToast("Cannot merge with same Note");
      } else {

        //concat selected content at the end
        $scope.taskArray[$scope.taskI].title += "\n" + $scope.taskArray[$scope.oldTaskI].title;

        //remove old note now
        $scope.deleteTask($scope.oldTaskI);
        $scope.oldTaskI = -1;

        $scope.mergeInProgress = false;

        showToast("Merge complete");
        $scope.saveData();
      }

    } else {
      //key is the index number of note in list
      // console.log(key);
      //key = taskI will be used perform actions on selected task
      $scope.taskI = key;
      $scope.show_task_more_options = true
      //also get completed status of task to change value of strike out or not
      $scope.task_completed_state = $scope.taskArray[$scope.taskI].isTaskCompleted
    }
  }

  $scope.close_task_more_options = function () {
    $scope.show_task_more_options = false
  }
  $scope.handle_click_on_blockscreen=function(){
    if($scope.show_list_more_options)
      $scope.toggle_list_more_options_visibility()
    
    if($scope.show_task_more_options)
      $scope.close_task_more_options()
  }

  $scope.handle_remove_completed_tasks = function()
  {
    try {
      $scope.taskArray = $scope.taskArray.filter(task => !task.isTaskCompleted)
      $scope.listArray[$scope.selectedListIndex].taskArray = $scope.taskArray
      $scope.saveData()
      $scope.toggle_list_more_options_visibility()  
    } catch (error) {
      console.log(error)
    }
    
  }


  $scope.deleteTask = function (index) {
    let indexToRemove = -1;
    if (index !== undefined) {
      //use supplied argument
      indexToRemove = index;
    } else {
      //no args try getting selected note
      if ($scope.taskI >= 0) {
        indexToRemove = $scope.taskI;
        $scope.taskI = -1;
      }
    }

    if (indexToRemove != -1) {
      let removed = $scope.taskArray.splice(indexToRemove, 1);
      $scope.saveData();
      $scope.show_task_more_options = false
      showToast("Note deleted!");
    } else {
      showToast("Error while removing note");
    }
  }


  $scope.moveTask = function () {
    //move to another list
    $scope.noteToMove = $scope.taskArray[$scope.taskI];
    $scope.moveInProgress = true;
    showToast("Tap on List to move note in List");
    $scope.show_task_more_options = false

    $scope.handleBackButton();

  }


  $scope.mergeTask = function () {
    //save selected note position
    $scope.oldTaskI = $scope.taskI;

    //close panel
    $scope.show_task_more_options = false


    //show message
    showToast("Tap on note to merge selected note");

    //active merge task in progress
    $scope.mergeInProgress = true;
  }

  $scope.cancelAction = function () {
    //cancel move or merge
    $scope.mergeInProgress = false;
    $scope.oldTaskI = -1

    $scope.moveInProgress = false;
    $scope.noteToMove = null;
    console.log("action cancelled")
    showToast("Action Cancelled")
  }

  $scope.editTask = function () {
    //open add box done from event open close nav bar js
    //close more options
    $scope.show_task_more_options = false
    //set content
    $scope.newTaskContent = $scope.taskArray[$scope.taskI].title
    //change add to edit
    document.querySelector("#confirm-change-button").style.display = "block";
    document.querySelector("#add-new-task-ok").style.display = "none";

  }

  $scope.updateTask = function () {
    $scope.taskArray[$scope.taskI].title = $scope.newTaskContent

    //revert back
    document.querySelector("#confirm-change-button").style.display = "none";
    document.querySelector("#add-new-task-ok").style.display = "block";
    $scope.newTaskContent = ""
    showToast("Note updated");
    $scope.saveData()
  }

  $scope.cancelNewTask = function () {
    document.querySelector("#confirm-change-button").style.display = "none";
    document.querySelector("#add-new-task-ok").style.display = "block";
    $("#newTaskContent").html("")
  }

  $scope.purgeList = function () {
    if ($scope.selectedListIndex >= 0) {
      $scope.taskArray = []
      $scope.listArray[$scope.selectedListIndex].taskArray = [];
      $scope.saveData();
      $scope.toggle_list_more_options_visibility()
      showToast("List is empty now")
    }
  }

  $scope.toggle_task_complete = function ($event, key) {
    // move completed tasks at end
    if (key != undefined) {
      let task = $scope.taskArray[key]
      task.isTaskCompleted = !task.isTaskCompleted;
      task.taskIcon = task.isTaskCompleted ? "radio_button_checked" : "radio_button_unchecked";
      $scope.taskArray[key] = task
      if (task.isTaskCompleted) {
        $scope.taskArray.splice(key, 1);
        $scope.taskArray.push(task)
      }
      $scope.saveData();
      $scope.show_task_more_options = false
      //showToast("Note Strike out!");
    }
  }

  $scope.move_task = function (distance) {
    // move completed tasks at end
    if ($scope.taskI != undefined) {
      let key = $scope.taskI

      if (key + distance < 0) {
        showToast("Task already at top")
      } else if (key + distance >= $scope.taskArray.length) {
        showToast("Task already at bottom")
      } else {
        let temp = $scope.taskArray[key + distance]
        $scope.taskArray[key + distance] = $scope.taskArray[key]
        $scope.taskArray[key] = temp
        let str = distance < 0 ? "Task moved up" : "Task moved down";
        showToast(str)
      }
      $scope.saveData();
      $scope.show_task_more_options = false
    }
  }


  $scope.strike_out_task = function () {

    if ($scope.taskI >= 0) {
      let task = $scope.taskArray[$scope.taskI]
      task.isTaskCompleted = !task.isTaskCompleted;
      //also update icon
      task.taskIcon = task.isTaskCompleted ? "radio_button_checked" : "radio_button_unchecked";
      //also add strike out class
      $scope.taskArray[$scope.taskI] = task
      $scope.saveData();
      $scope.show_task_more_options = false

      //showToast("Note Strike out!");
    }
  }


  $scope.toggle_list_more_options_visibility = function () {
    $scope.show_list_more_options = !$scope.show_list_more_options
    $scope.nav_more_vert_icon = $scope.show_list_more_options ? "close" : "more_horiz";
    // console.log($scope.show_list_more_options)
    $scope.app_size()
  }

  $scope.app_size = function () {
    var _lsTotal = 0, _xLen, _x;
    for (_x in localStorage) {

      if (!localStorage.hasOwnProperty(_x)) {
        continue;
      }
      _xLen = ((localStorage[_x].length + _x.length) * 2);
      _lsTotal += _xLen;
      //console.log(_x.substr(0, 50) + " = " + (_xLen / 1024).toFixed(2) + " KB")
    };
    //console.log("Total = " + (_lsTotal / 1024).toFixed(2) + " KB");
    $scope.app_size_value = "Total Size: " + (_lsTotal / 1024).toFixed(2) + " KB"
  }


  $scope.toggle_theme = function () {
    if ($scope.theme == "light") {
      //change to dark dark_mode
      $scope.theme = "dark"
      $scope.theme_menu_text = "Turn On Light Theme"
      $scope.theme_menu_icon = "light_mode"
      document.querySelector("#theme-color").setAttribute("content","#131417")
    } else {
      //change to light_mode
      $scope.theme = "light"
      $scope.theme_menu_text = "Turn On Dark Theme"
      $scope.theme_menu_icon = "dark_mode"
      document.querySelector("#theme-color").setAttribute("content","aliceblue")
      document.querySelector("#theme-color").setAttribute("content","aliceblue")
    }
    $scope.toggle_list_more_options_visibility()
    $scope.saveData()
  }

  $scope.init_theme = function () {
    const old_theme = localStorage.theme || "light";
    $scope.theme = old_theme;

    if ($scope.theme === "light") {
      $scope.theme_menu_text = "Turn On Dark Theme";
      $scope.theme_menu_icon = "dark_mode";
      document.querySelector("#theme-color").setAttribute("content","aliceblue")
    } else {
      $scope.theme_menu_text = "Turn On Light Theme";
      $scope.theme_menu_icon = "light_mode";
      document.querySelector("#theme-color").setAttribute("content","#131417")
    }
  };

  $scope.create_notification = function () {
    new Notification(
      "Button Clicked!",
      { body: "Notification body text.", icon: "/logo.png" })
  }

  // notification
  $scope.show_notification = function () {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        $scope.create_notification()
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            $scope.create_notification()
          }
        })
      }
    } else {
      alert("Notification not supported")
    }
  }

  $scope.mouse_down = function()
  {
    $scope.mouse_down_time = new Date().getTime()
  }
  
  $scope.mouse_up = function(list_index)
  {
    $scope.mouse_up_time = new Date().getTime()
    let diff = $scope.mouse_up_time - $scope.mouse_down_time
    if(diff<300)
    {
      console.log("click event")
      $scope.loadList(list_index)
    }else
    {
      console.log("hold event")
      //list info is required to show more options 
      $scope.load_list_info(list_index)
      $scope.toggle_list_more_options_visibility()
    }
    $scope.mouse_up_time = 0
    $scope.mouse_down_time = 0
  }

  $scope.handle_keypress_newtask = function(e){
    try {
        //handle height
        console.log(e.keyCode);
        (e.keyCode==13 && $scope.new_task_content_height<250) ? $scope.new_task_content_height +=10:0;

        //handle codes
        if(e.keyCode==32 || e.keyCode==13)
        {
          //#today #now #day
          var codes = {
            "#today": formatDate(new Date()),
            "#now": formatTime(new Date()),
            "#day": formatDay(new Date())
          };
          for (var code in codes) {
            if ($scope.newTaskContent.includes(code)) {
                $scope.newTaskContent = $scope.newTaskContent.replace(code, codes[code]);
            }
          }
        }
    } catch (error) {
      console.log(error)
    }
  }
  




  //define all funcions above init
  $scope.init = function () {
    // console.log("initializing app...");
    
    $scope.mouse_down_time = 0
    $scope.mouse_up_time = 0
    $scope.moveInProgress = false
    $scope.mergeInProgress = false
    $scope.show_list_more_options = false
    $scope.show_task_more_options = false
    $scope.nav_more_vert_icon = "more_horiz"
    $scope.show_nav_more_vert_button = false
    $scope.show_delete_list_option = false
    $scope.show_purge_list_option = false
    $scope.selectedListIndex = -1
    $scope.show_searchbar=false
    $scope.new_task_content_height = 80
    //by default edit options are hidden
    $scope.show_add_task_edit_options = false

    //read saved data
    $scope.listArray = readData();

    if (patchApplied) {
      //if new property added to previous version
      //save these properties now
      $scope.saveData();
    }

    $scope.taskArray = [];
    console.log("Total notebooks found:",$scope.listArray.length);
    $scope.defaultPageTitle = "Notebooks";
    $scope.pageTitle = $scope.defaultPageTitle;
    $scope.newTaskContent = ""
    $scope.taskI = -1;
    $scope.allTasks = $scope.getTasksOnly();
    $scope.init_hammer_touch_events()

    //default theme
    $scope.init_theme()

  };

  $scope.init();

});



function readData() {
  try {
    let appData = localStorage.appData;
    if (appData == undefined || appData == "[]") {
      return setupDemoList();
    } else {
      //load
      let json = JSON.parse(appData);
      return json;
    }
  } catch (error) {
    return setupDemoList();
  }
}

// if no data is found create demo files
function setupDemoList() {
  let list = new List("Your First Notebook");
  let task = new Task("We have added first note!");
  list.taskArray.push(task);
  return [list];
}

