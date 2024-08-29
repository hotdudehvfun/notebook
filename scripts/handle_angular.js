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
  $scope.handle_task_html = function(text)
  {
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
    $scope.show_rename_list_option = true
    $scope.default_app_icon = $scope.listArray[$scope.selectedListIndex].icon
    console.log($scope.default_app_icon)
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
        $scope.taskArray = $scope.listArray[index].taskArray;
        // when name is changed list view is hided and task view is shown
        $scope.selectedListName = $scope.listArray[index].title;
        $scope.pageTitle = $scope.selectedListName;
        console.log("Opening notebook = ", $scope.pageTitle)
        //load list info, this function also used by tap and hold event to load list info
        $scope.load_list_info(index)
        $scope.new_task_placeholder = `Create task in ${$scope.selectedListName}`
        // $scope.show_select_notebooks_dropdown = false
        $scope.open_sidebar(false)
      }
    }
    $scope.saveData()
  }

  $scope.open_sidebar = function(state)
  {
    let left_val = state?"0px":"-75vw";
    $scope.sidebar_left = {left:left_val}
    $scope.is_sidebar_menu_open = state
  }

  $scope.reset_view = function () {
    try {
      console.log("reset called")
      $scope.search = "";
      $scope.pageTitle = $scope.defaultPageTitle;
      $scope.show_delete_list_option = false
      $scope.show_purge_list_option = false
      $scope.show_rename_list_option = false
      $scope.selectedListIndex = -1
      $scope.selectedListName = null
    } catch (err) {
      console.log("Error while reseting button", err)
    }
  }

  $scope.handle_input_on_rename_notebook = function (e) {
    if (e.keyCode == 13) {
      $scope.rename_notebook()
    } else {
      $scope.new_notebook_icon = getIconForTitle($scope.new_list_name)
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

  $scope.insertTextAtCursor = function(id,value)
  {
    insertTextAtCursor(id,value)
  }

  $scope.get_list_info = function (key,taskArray) {
    let title = $scope.listArray[key].title
    if(title.toLowerCase()=="system")
    {
      return Object.keys(system_vars).length
    }
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
        //if we are creating without opening the notebook
        $scope.pageTitle = $scope.selectedListName

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

  $scope.get_system_vars = function()
  {
    return system_vars
  }

  $scope.edit_var = function(key,value)
  {
    $scope.system_var_popup_title = "Edit Variable"
    $scope.system_var_popup_create_button_text = "Update Variable"
    $scope.show_create_system_var_popup = true
    $scope.show_delete_system_var_button = true
    $scope.new_var_name = key
    $scope.new_var_value = system_vars[key]
  }

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

    //save system vars
    localStorage.system_vars = JSON.stringify(system_vars) 
    console.log("System vars",JSON.stringify(system_vars))
  }

  $scope.readData = function()
  {
    try {
      //read system vars
      if (localStorage.system_vars != undefined)
      {
        system_vars = JSON.parse(localStorage.system_vars)
      }
      let appData = localStorage.appData
      if (appData == undefined || appData == "[]") {
        return setupDemoList();
      } else
      {
        let json = JSON.parse(appData);
        return json;
      }
    } catch (error) {
      return setupDemoList();
    }
  }

  $scope.emptyList = handleNoTasksState();


  $scope.handleDeleteList = function () {
    if ($scope.selectedListIndex >= 0) {
      if (confirm("Are you sure?")) {
        console.log("List at index removed:", $scope.selectedListIndex)
        showToast("Notebook Deleted");
        let removedList = $scope.listArray.splice($scope.selectedListIndex, 1);
        $scope.selectedListIndex = 0
        if($scope.listArray.length!=0)
        {
          $scope.open_notebook($scope.selectedListIndex)
        }else{
          //all notebooks removed
          $scope.taskArray = []
          $scope.pageTitle = $scope.defaultPageTitle
        }
        $scope.toggle_list_more_options_visibility()
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

    $scope.open_sidebar(false)
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
    $scope.open_create_new_note_popup()
    $scope.newTaskContent = $scope.taskArray[$scope.selected_task_index].title
    console.log($scope.newTaskContent)
    $scope.show_update_task_button = true
    var textarea = document.querySelector('#newTaskContent');
    textarea.style.height = '250px';
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
    if (confirm("Are you sure?") == true) {
      if ($scope.selectedListIndex >= 0) {
        $scope.taskArray = []
        $scope.listArray[$scope.selectedListIndex].taskArray = [];
        $scope.saveData();
        $scope.toggle_list_more_options_visibility()
        showToast("List is empty now")
      }
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
  }

  $scope.app_size = function () {
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        let value = localStorage.getItem(key);
        totalSize += key.length + value.length;
    }
    return `App storage is ${(totalSize / 1024).toFixed(2)} kb`
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

  $scope.init_notification = function(){
    //temp notification
    if (Notification.permission === 'denied' || Notification.permission === 'default') {
      console.log("notification false")
      $scope.askNotificationPermission()
    } else {
      console.log("notification true")

    }

    if (Notification.permission === 'granted') {
      $scope.createNotification("hello world")
    }
  }


  $scope.askNotificationPermission = function() {
    function handlePermission(permission) {
      if (!Reflect.has(Notification, 'permission')) {
        Notification.permission = permission;
      }
      // Set the button to shown or hidden, depending on what the user answers
      // if (Notification.permission === 'denied' || Notification.permission === 'default') {
      //   notificationBtn.style.display = 'block';
      // } else {
      //   notificationBtn.style.display = 'none';
      // }
    };

    // Check if the browser supports notifications
    if (!Reflect.has(window, 'Notification')) {
      console.log('This browser does not support notifications.');
    } else {
      if ($scope.checkNotificationPromise()) {
        Notification.requestPermission().then(handlePermission);
      } else {
        Notification.requestPermission(handlePermission);
      }
    }
  };

  $scope.checkNotificationPromise = function() {
    try {
      Notification.requestPermission().then();
    } catch(e) {
      return false;
    }
    return true;
  };

  $scope.createNotification=function(title) {
    // Create and show the notification
    const img = 'img/ios/128.png';
    const text = `Hello notebooks`;
    const notification = new Notification('Notebook', { body: text, icon: img });
  };


  $scope.load_last_notebook = function () {
    //check number of notebooks
    const old_list_index = localStorage.selectedListIndex || 0;

    $scope.open_notebook(old_list_index)
  };


  $scope.handle_click_on_notebook_title = function () {
    if ($scope.selectedListIndex >= 0) {
      $scope.show_task_more_options = false
      $scope.show_list_more_options = true
    }
  }

  $scope.handle_keypress_newtask = function (e) {
    try {
      let textarea = document.querySelector("#newTaskContent")
      // if(e.keyCode==13)
      let h = textarea.scrollHeight
      // if(h>400)
      //   h=400
      textarea.style.height = `${h}px`
      
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
      if(e.keyCode==13)
      {
        let value = textarea.value;
        let lines = value.split('\n');
        let lastLine = lines[lines.length - 1];
        let match = lastLine.match(/^(\d+)\.\s/);
        if (match) {
            let currentNumber = parseInt(match[1]);
            textarea.value += `\n${currentNumber + 1}. `;
            e.preventDefault();
        }
      }
      }
    } catch (error) {
      console.log(error)
    }
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
    let notebooks =  $scope.listArray.map(function(listItem)
    {
      return listItem.title;
    });
    notebooks = notebooks.filter((list)=>list.toLocaleLowerCase()!="system")
    // console.log(notebooks)
    return notebooks
};

  $scope.update_selected_list_index = function(key)
  {
    $scope.selectedListIndex = key
    $scope.selectedListName = $scope.listArray[$scope.selectedListIndex].title;
    console.log($scope.selectedListIndex)
  }



  $scope.override_console = function(){
  //    console.log = function(...args) {
  //     original_console.apply(console, args);
  //     // Convert arguments to a string and append to the div
  //     const outputDiv = document.getElementById("console-output");
  //     outputDiv.innerText += args.join(' ') + '\n';
  // };
  }

  $scope.open_create_system_var_popup = function()
  {
    $scope.show_create_system_var_popup = true
    $scope.new_var_name = ""
    $scope.new_var_value = ""
    $scope.system_var_popup_title = "Create Variable"
    $scope.system_var_popup_create_button_text = "Create"
    $scope.show_delete_system_var_button = false
  }

  $scope.evaluate_exp = function(value) {
    // Recursive function to evaluate expressions
    function evaluate(value) {
        return value.replace(/\b[a-zA-Z_]\w*\b/g, function(match) {
            if (system_vars.hasOwnProperty(match)) {
                // If the match is an expression, evaluate it recursively
                let expr = system_vars[match];
                if (typeof expr === 'string') {
                    return evaluate(expr);
                } else {
                    return expr;
                }
            }
            return match;
        });
    }

    try {
        // Evaluate the expression and return the result
        let result = eval(evaluate(value))
        result = result%1==0?result:result.toFixed(2);
        return result;
    } catch (error) {
        console.error("Invalid expression: ", error);
        return "Invalid expression";
    }
}

$scope.delete_system_var = function()
{
  if (confirm("Are you sure?")) {
    delete system_vars[$scope.new_var_name]
    $scope.show_create_system_var_popup = false
    $scope.show_delete_system_var_button = false
    $scope.saveData()
    showToast("System var removed")
  }
}

  $scope.create_system_var = function()
  {
    let error = ""
    if($scope.new_var_name.length>0 && $scope.new_var_value.length>0)
    {
      //clean vars
      $scope.new_var_name = $scope.new_var_name.trim().toLocaleLowerCase()
      $scope.new_var_value = $scope.new_var_value.trim().toLocaleLowerCase()

    }else
    {
      error = "Empty variables cannot be created"
    }
    
    if(error=="")
    {
      system_vars[$scope.new_var_name] = $scope.new_var_value
      $scope.saveData();
      $scope.new_var_name = ""
      $scope.new_var_value = ""
      $scope.show_create_system_var_popup = false;
      showToast("Variable created");
    }else{
      showToast(error)
    }
    
  }

  $scope.open_create_new_note_popup = function()
  {
    $scope.show_task_more_options = false
    $scope.show_list_more_options = false
    $scope.show_update_task_button = false

    $scope.show_create_task_popup = true
    // document.querySelector("#newTaskContent").value = ""
    $scope.newTaskContent = ""
    //check slide index and show drop down
    if($scope.selectedListIndex==-1)
      $scope.show_select_notebooks_dropdown = true
    else
      $scope.show_select_notebooks_dropdown = false

  }


  $scope.handle_rename_notebook = function()
  {
    $scope.show_task_more_options = false
    $scope.show_list_more_options = false
    $scope.show_rename_notebook_popup = true
  }

  $scope.rename_notebook = function() {
    try {
        if (!$scope.new_list_name) {
            return showToast("Error: Input required");
        }

        if ($scope.new_list_name.toLocaleLowerCase() === "system") {
            return showToast("Error: System title is reserved");
        }

        if ($scope.selectedListIndex < 0) {
            return showToast("Error: No list is selected");
        }

        // Update title and icon
        let selectedList = $scope.listArray[$scope.selectedListIndex];
        selectedList.title = $scope.new_list_name;
        selectedList.icon = $scope.new_notebook_icon;
        $scope.listArray[$scope.selectedListIndex] = selectedList

        // Save data and close popup
        $scope.saveData();
        $scope.show_rename_notebook_popup = false;

        // Update selected list and page title
        $scope.selectedListName = $scope.new_list_name;
        $scope.pageTitle = $scope.new_list_name;

        // Clean up
        $scope.new_list_name = "";
        showToast("Notebook has been renamed");
    } catch (err) {
        showToast("Exception occurred while renaming notebook");
        console.error("Error while renaming notebook", err);
    }
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


    //read saved data
    $scope.listArray = $scope.readData();
    console.log($scope.listArray)

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
    $scope.show_create_system_var_popup = false
    $scope.show_delete_system_var_button = false
    $scope.show_sidebar = false
    $scope.max_notebook_title_len = 20

    $scope.edit_options = [
      {icon:"title",insert_text:"#H1"},
      {icon:"list",insert_text:"* Item"},
      {icon:"sliders",insert_text:"#50%"},
      {icon:"check_box",insert_text:"$ Task"},
  ]

    //default theme
    $scope.init_theme()

    //try to load first or last notebook
    $scope.load_last_notebook()

  };
  $scope.init();
});