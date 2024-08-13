let app = angular.module("myapp", []);
//use this to create new properties on previous version
let patchApplied = false;
const original_console = console.log

console.log("App version:3.2.0")
console.log(`
Features
> Added progress bar code:#20%
> Merge tasks
> Delete Tasks
> Delete Notebooks
> {2+2} = 4 Expression evaluation
> #Today #now #weekday now works
> Swipe back to notebooks
`)
var system_vars = {}

//contains custom variables
//add vars from system notebook
app.filter("sanitize", ['$sce', function ($sce) {
  return function (htmlCode) {
    return $sce.trustAsHtml(htmlCode);
  }
}]);


app.controller('myctrl', function ($scope, $sce, $timeout,$compile) {

  // output  of task content
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


  $scope.load_list_info = function (index) {
    $scope.selectedListIndex = index;
    $scope.list_index_for_hold_event = index
    $scope.show_delete_list_option = true
    $scope.show_purge_list_option = true
    $scope.default_app_icon = $scope.listArray[$scope.selectedListIndex].icon
  }

  $scope.open_notebook = function (index) {
    if ($scope.select_notebooks) {
      //instead of opening notebooks
      //toggle selection
      if ($scope.is_notebook_selected(index)) {
        //unselect
        let pos = $scope.selected_notebooks.indexOf(index)
        $scope.select_notebooks.splice(pos, 1)
      } else {
        //select
        $scope.selected_notebooks.push(index);
      }
    } else {
      if (index >= 0) {
        $scope.swiper.slideTo(1)
        $scope.taskArray = $scope.listArray[index].taskArray;
        // when name is changed list view is hided and task view is shown
        $scope.selectedListName = $scope.listArray[index].title;
        $scope.pageTitle = $scope.selectedListName;
        console.log("Opening notebook = ", $scope.pageTitle)
        //load list info, this function also used by tap and hold event to load list info
        $scope.load_list_info(index)
        $scope.new_task_placeholder = `Create task in ${$scope.selectedListName}`
        // $scope.show_select_notebooks_dropdown = false
      }
    }
  }


  $scope.reset_view = function () {
    try {
      console.log("reset called")
      $scope.search = "";
      $scope.pageTitle = $scope.defaultPageTitle;
      $scope.show_delete_list_option = false
      $scope.show_purge_list_option = false
      $scope.selectedListIndex = -1
      $scope.selectedListName = null
    } catch (err) {
      console.log("Error while reseting button", err)
    }
  }


  $scope.handle_input_on_notebook = function (e) {
    if (e.keyCode == 13) {
      $scope.create_notebook()
      e.target.value = "";
    } else {
      $scope.new_notebook_icon = getIconForTitle($scope.new_list_name)
    }
  }

  $scope.get_list_icon = function (list) {
    if (list.hasOwnProperty("icon"))
      return list.icon
    else
      return "folder"
  }

  $scope.get_list_info = function (taskArray) {
    var completed = taskArray.filter(function (task) { return task.isTaskCompleted == true }).length;
    if (completed == 0)
      return taskArray.length;
    return `${completed}/${taskArray.length}`
  }

  $scope.create_notebook = function () {
    try {
      if ($scope.new_list_name.length > 1) {
          let duplicate = $scope.listArray.some(list => list.title.toLowerCase() === $scope.new_list_name.toLowerCase())
          if (duplicate) {
              alert(`Notebook "${$scope.new_list_name}" already exists.`);
              return; 
          }
          let new_list = new List($scope.new_list_name, $scope.new_notebook_icon);
          $scope.listArray.push(new_list)
          showToast(`Notebook created: ${new_list.title}`);
          $scope.new_list_name = ""
          $scope.show_create_notebook_popup = false
          $scope.saveData();
      }
    } catch (err) {
      console.log("Error while creating notebook",err)
      showToast("Failed to created notebook");
    }
}


  

  $scope.create_task = function () {
    try {
      if (
        $scope.newTaskContent.trim().length > 0 &&
        ($scope.selectedListIndex != undefined || $scope.selectedListIndex >= 0)) {
        let multiple_tasks = split_text_into_tasks($scope.newTaskContent, "$")
        if (multiple_tasks.length > 0) {
          //add multiple tasks
          multiple_tasks.forEach((item, index) => {
            let newTask = new Task(item)
            newTask.taskIcon = $scope.icons.unchecked;
            $scope.listArray[$scope.selectedListIndex].taskArray.push(newTask)
          })
        } else {
          //add single task
          let newTask = new Task($scope.newTaskContent.trim())
          newTask.taskIcon = $scope.icons.unchecked;
          $scope.listArray[$scope.selectedListIndex].taskArray.push(newTask)
        }
        $scope.taskArray = $scope.listArray[$scope.selectedListIndex].taskArray

        //reset options
        $scope.newTaskContent = ""
        $scope.new_task_content_height = 64
        document.querySelector("#newTaskContent").style.height = 64
        $scope.show_add_task_edit_options = false
        $scope.show_create_task_popup =false

        $scope.saveData();
        let toast_text = "Note added"
        if (multiple_tasks.length > 1)
          toast_text = `${multiple_tasks.length} notes added`;
        showToast(toast_text);
      }
    } catch (err) {
      console.log(err)
      showToast(`Unable to add note`)
    }
  }

  $scope.get_system_vars = function() {
    let tasks = [];
    let _vars = {};
    const systemItem = $scope.listArray.find(item => item.title.toLocaleLowerCase() === "system");

    if (systemItem) {
        tasks = systemItem.taskArray;
    }

    tasks.forEach((item) => {
        let lines = item.title.trim().split("\n");
        if (lines.length === 2) {
            let var_name = lines[0].trim();
            let value = lines[1].trim();

            // Replace any existing keys within the value
            value = value.replace(/{(.*?)}/g, (_, expr) => {
                try {
                    return eval(expr.replace(/\b(\w+)\b/g, (match) => {
                        return _vars.hasOwnProperty(match) ? _vars[match] : match;
                    }));
                } catch (e) {
                    console.error(`Error evaluating expression: ${expr}`);
                    return "";
                }
            });

            if (var_name && value !== undefined) {
                _vars[var_name] = value;
            }
        }
    });
    return _vars;
};

$scope.insert_system_var_at_cursor = function()
{
  //console.log($scope.selected_system_var)
  insertTextAtCursor('newTaskContent',$scope.selected_system_var)
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

    //update system vars
    system_vars = $scope.get_system_vars()
    console.log("System vars",JSON.stringify(system_vars))
  }

  $scope.emptyList = handleNoTasksState();


  $scope.handleDeleteList = function () {
    if ($scope.selectedListIndex >= 0) {
      if (confirm("Are you sure?")) {
        //show message removed
        console.log("List at index removed:", $scope.selectedListIndex)
        showToast("Notebook Deleted");
        let removedList = $scope.listArray.splice($scope.selectedListIndex, 1);
        $scope.saveData();
        $scope.toggle_list_more_options_visibility()
        //go back to main screen after delete
        //reset is called when we go to slide 0
        $scope.swiper.slideTo(0)
      }
    }
  }

  $scope.handleClickOnTask = function (event, key) {

    // console.log(event.currentTarget)
    if ($scope.mergeInProgress) {
      //merge in progress no need to show options
      //merger with selected task
      $scope.selected_task_index = key;
      if ($scope.selected_task_index == $scope.oldselected_task_index) {
        showToast("Cannot merge with same Note");
      } else {

        //concat selected content at the end
        $scope.taskArray[$scope.selected_task_index].title += "\n" + $scope.taskArray[$scope.oldselected_task_index].title;

        //remove old note now
        $scope.deleteTask($scope.oldselected_task_index);
        $scope.oldselected_task_index = -1;

        $scope.mergeInProgress = false;

        showToast("Merge complete");
        $scope.saveData();
      }

    } else {
      //key is the index number of note in list
      // console.log(key);
      //key = selected_task_index will be used perform actions on selected task
      $scope.selected_task_index = key;
      $scope.show_task_more_options = true
      //also get completed status of task to change value of strike out or not
      $scope.task_completed_state = $scope.taskArray[$scope.selected_task_index].isTaskCompleted
    }
  }

  $scope.close_task_more_options = function () {
    $scope.show_task_more_options = false
  }
  $scope.handle_click_on_blockscreen = function () {
    if ($scope.show_list_more_options)
      $scope.toggle_list_more_options_visibility()

    if ($scope.show_task_more_options)
      $scope.close_task_more_options()
  }

  $scope.handle_remove_completed_tasks = function () {
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
    let show_confirm = false
    if (index !== undefined) {
      //use supplied argument
      indexToRemove = index;
    } else {
      //no args try getting selected note
      //show prompt when deleting single task
      if ($scope.selected_task_index >= 0) {
        show_confirm = true
        indexToRemove = $scope.selected_task_index;
        $scope.selected_task_index = -1;
      }
    }

    if (indexToRemove != -1) {
      if (confirm("Are you sure?") == true) {
        let removed = $scope.taskArray.splice(indexToRemove, 1);
        $scope.saveData();
        $scope.show_task_more_options = false
        showToast("Note deleted!")
      }
    } else {
      showToast("Error while removing note");
    }
  }


  $scope.copy_task = function () {
    //move to another list
    $scope.copied_task = $scope.taskArray[$scope.selected_task_index]
    showToast("Task Copied");
    $scope.show_task_more_options = false
    // $scope.reset_view();
  }


  $scope.paste_task = function () {
    try {
      //append copied task to selected task
      //save selected note position
      $scope.taskArray[$scope.selected_task_index].title = $scope.taskArray[$scope.selected_task_index].title.concat(
        "\n", $scope.copied_task.title
      )
      console.log($scope.taskArray)
      showToast("Task Pasted")
      $scope.saveData()
      $scope.show_task_more_options = false

    } catch (err) {
      console.log("Cannot paste task", err)
    }
  }
  $scope.paste_task_inside_notebook = function () {
    if ($scope.selectedListIndex >= 0) {
      $scope.taskArray.push($scope.copied_task);
      showToast("Task Pasted")
      $scope.copied_task = null;
      $scope.show_list_more_options = false
      $scope.saveData();
    }
  }

  $scope.editTask = function () {
    $scope.newTaskContent = $scope.taskArray[$scope.selected_task_index].title
    $scope.show_update_task_button = true
    $scope.open_create_new_note_popup()
  }

  $scope.updateTask = function () {
    $scope.taskArray[$scope.selected_task_index].title = $scope.newTaskContent
    //revert back
    $scope.show_update_task_button = false
    $scope.show_create_task_popup = false
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
    //delete all tasks inside notebook
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

      task.taskIcon = task.isTaskCompleted ? $scope.icons.checked : $scope.icons.unchecked;
      $scope.taskArray[key] = task
      if (task.isTaskCompleted) {
        $scope.taskArray.splice(key, 1);
        $scope.taskArray.push(task)
      }
      $scope.saveData();
      $scope.show_task_more_options = false
    }
  }

  $scope.move_task = function (distance) {
    // move completed tasks at end
    if ($scope.selected_task_index != undefined) {
      let key = $scope.selected_task_index

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

    if ($scope.selected_task_index >= 0) {
      let task = $scope.taskArray[$scope.selected_task_index]
      task.isTaskCompleted = !task.isTaskCompleted;
      //also update icon
      task.selected_task_indexcon = task.isTaskCompleted ? "radio_button_checked" : "radio_button_unchecked";
      //also add strike out class
      $scope.taskArray[$scope.selected_task_index] = task
      $scope.saveData();
      $scope.show_task_more_options = false

      //showToast("Note Strike out!");
    }
  }

  $scope.nav_more_vert_icon = function () {
    return $scope.show_list_more_options ? "close" : "more_horiz";
  }



  $scope.toggle_list_more_options_visibility = function () {

    $scope.show_list_more_options = !$scope.show_list_more_options
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
      document.querySelector("#theme-color").setAttribute("content", "#131417")
    } else {
      //change to light_mode
      $scope.theme = "light"
      $scope.theme_menu_text = "Turn On Dark Theme"
      $scope.theme_menu_icon = "dark_mode"
      document.querySelector("#theme-color").setAttribute("content", "aliceblue")
      document.querySelector("#theme-color").setAttribute("content", "aliceblue")
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
      document.querySelector("#theme-color").setAttribute("content", "aliceblue")
    } else {
      $scope.theme_menu_text = "Turn On Light Theme";
      $scope.theme_menu_icon = "light_mode";
      document.querySelector("#theme-color").setAttribute("content", "#131417")
    }
  };

  $scope.handle_click_on_notebook_title = function () {
    if ($scope.selectedListIndex >= 0) {
      $scope.show_task_more_options = false
      $scope.show_list_more_options = true
    }
  }

  $scope.handle_keypress_newtask = function (e) {
    try {
      //handle height
      // console.log(e.keyCode);
      (e.keyCode == 13 && $scope.new_task_content_height < 250) ? $scope.new_task_content_height += 10 : 0;

      //handle codes
      if (e.keyCode == 32 || e.keyCode == 13) {
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

  $scope.init_swiper = function () {
    $scope.swiper = new Swiper('.swiper', {
      on: {
        slideChange: function () {
          switch($scope.swiper.activeIndex)
          {
            case 0:
              console.log("notebook view")
              $scope.reset_view()
              break;
            case 1:
                console.log("tasks view")
                break;
            case 2:
                console.log("Console View")
                $scope.pageTitle = "Console"
                $scope.$apply()

          }
        }
      }
    });
  }

  $scope.clear_console = function()
  {
    document.querySelector("#console-output").innerText = ""
    $scope.show_list_more_options = false
  }

  $scope.init_notify = function () {
    // Check if the browser supports notifications
    if (!('Notification' in window)) {
      alert('This browser does not support notifications.');
      return;
    }

    // Request permission if not already granted
    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then(function (permission) {
        if (permission === 'granted') {
          sendNotification();
        }
      });
    } else {
      sendNotification();
    }
  }

  $scope.handle_select_notebooks = function () {
    $scope.select_notebooks = !$scope.select_notebooks
    $scope.select_notebooks_menu_text = $scope.select_notebooks ? "Cancel Selection" : "Select Notebooks";
    $scope.show_list_more_options = false
    $scope.show_task_more_options = false
  }

  $scope.notebook_selected_state = function (index) {
    //return checked and unchecked icon based on selection state
    if ($scope.is_notebook_selected(index)) {
      return $scope.icons.checked
    }
    return $scope.icons.unchecked
  }

  $scope.is_notebook_selected = function (notebook_index) {
    return $scope.selected_notebooks.indexOf(notebook_index) != -1
  }

  $scope.delete_selected_notebooks = function () {
    // Sort the selected notebooks in descending order to avoid index issues while removing
    $scope.selected_notebooks.sort((a, b) => b - a);

    // Remove each selected notebook from listArray
    $scope.selected_notebooks.forEach((index) => {
      $scope.listArray.splice(index, 1);
    });

    // Optionally, clear the selected notebooks array
    $scope.selected_notebooks = [];
    $scope.select_notebooks = false
    $scope.select_notebooks_menu_text = "Select Notebooks"
    $scope.show_task_more_options = false
    $scope.show_list_more_options = false
    $scope.saveData();
  };

  $scope.get_total = function () {
    let total_tasks = 0, total_notebooks = $scope.listArray.length
    $scope.listArray.forEach((item, index) => {
      total_tasks += item.taskArray.length;
    })
    return {
      "total_tasks": total_tasks,
      "total_notebooks": total_notebooks
    }
  }

  $scope.get_notebooks_list = function() {
    //map function returns 
    let notebooks =  $scope.listArray.map(function(listItem) {
        return listItem.title;
    });
    // console.log(notebooks)
    return notebooks
};

  $scope.update_selected_list_index = function(key)
  {
    $scope.selectedListIndex=key
    console.log($scope.selectedListIndex)
  }



  $scope.override_console = function(){
     console.log = function(...args) {
      original_console.apply(console, args);
      // Convert arguments to a string and append to the div
      const outputDiv = document.getElementById("console-output");
      outputDiv.innerText += args.join(' ') + '\n';
  };
  }

  $scope.open_create_new_note_popup = function()
  {
    $scope.show_task_more_options = false
    $scope.show_list_more_options = false
    
    $scope.show_create_task_popup = true
    //check slide index and show drop down
    if($scope.selectedListIndex==-1)
      $scope.show_select_notebooks_dropdown = true
    else
      $scope.show_select_notebooks_dropdown = false

  }



  //define all funcions above init
  $scope.init = function () {
    $scope.override_console()
    //handle copied task
    $scope.copied_task = null

    $scope.show_list_more_options = false
    $scope.show_task_more_options = false
    $scope.show_create_notebook_popup = false
    $scope.show_create_task_popup = false
    

    $scope.show_nav_more_vert_button = false
    $scope.show_delete_list_option = false
    $scope.show_purge_list_option = false
    $scope.show_searchbar = false
    $scope.new_task_content_height = 64
    $scope.new_notebook_icon = "folder"
    $scope.icons = {
      checked: "radio_button_checked",
      unchecked: "radio_button_unchecked"
    }
    //by default edit options are hidden
    $scope.show_add_task_edit_options = false

    //enable select notebooks
    $scope.select_notebooks = false
    $scope.selected_notebooks = []
    $scope.select_notebooks_menu_text = "Select Notebooks"

    //handle swiper varible
    $scope.swiper = null

    //read saved data
    $scope.listArray = readData();

    if (patchApplied) {
      //if new property added to previous version
      //save these properties now
      $scope.saveData();
    }

    $scope.taskArray = [];
    console.log("Total notebooks found:", $scope.listArray.length);
    $scope.selectedListIndex = -1
    $scope.selectedListName = null

    $scope.defaultPageTitle = "Notebooks";
    $scope.default_app_icon = "eco"
    $scope.pageTitle = $scope.defaultPageTitle;
    $scope.show_select_notebooks_dropdown = true

    
    $scope.newTaskContent = ""
    $scope.new_list_name = ""
    $scope.selected_task_index = -1;
    $scope.new_task_placeholder = "Create Task"
    $scope.allTasks = $scope.getTasksOnly();
    $scope.show_update_task_button = false
    //default theme
    $scope.init_theme()

    //init swiper
    $scope.init_swiper()
    
    //check for system vars
    system_vars = $scope.get_system_vars()
    console.log("System vars",JSON.stringify(system_vars))
    
  };
  $scope.init();
});