let app = angular.module("myapp", []);
//use this to create new properties on previous version
let patchApplied=false;
console.log("version:3.1.0")

app.filter("sanitize", ['$sce', function($sce)
{
  return function(htmlCode){
      return $sce.trustAsHtml(htmlCode);
  }
}]);

app.controller('myctrl', function ($scope, $sce) {

  //for searching made easy
  $scope.getTasksOnly = function()
  {
    var allTasks = [];
    $scope.listArray.forEach(list =>
    {
      allTasks=allTasks.concat(list.taskArray)      
    });
    //console.log(allTasks);
    return allTasks;
  };
  


  $scope.loadList = function (index)
  {
    // a valid list is selected
    if(index>=0)
    {
     
      $scope.taskArray = $scope.listArray[index].taskArray;
      $scope.selectedListName = $scope.listArray[index].title;
      $scope.selectedListIndex = index;
      $scope.pageTitle = $scope.selectedListName;
      $scope.show_nav_more_vert_button = true
      $scope.show_delete_list_option = true
      $scope.show_purge_list_option = true
      console.log($scope.taskArray);
      
      //hide list view
      document.querySelector("#view-lists").style.display = "none";
      
      //show its content
      document.querySelector("#view-list-items").style.display = "block";
      
      if($scope.moveInProgress)
      {
        //save task to move
        $scope.taskArray.push($scope.noteToMove);
        showToast("Note moved!")
        $scope.moveInProgress=false
        $scope.noteToMove=null;
        $scope.saveData();
      }
      
    }


  }


  $scope.handleBackButton = function () {
    //on back button show notebooks
    //hide notes
    document.querySelector("#view-lists").style.display = "block";
    document.querySelector("#view-list-items").style.display = "none";
    $scope.search="";
    $scope.pageTitle = $scope.defaultPageTitle;
    $scope.show_delete_list_option = false
    $scope.show_purge_list_option = false
  }

  $scope.init_hammer_touch_events=function()
  {
    var hammertime = new Hammer(document.querySelector("body"));
    //console.log(hammertime)
    hammertime.on('swiperight', function(ev)
    {
      //handle back button here
      $scope.handleBackButton()
    });
  }


  $scope.checkIfEnterPressed=function(e)
  {
    if(e.keyCode==13)
    {
      $scope.handleCreateList()
      e.target.value="";
    }
  }

  $scope.handleCreateList = function ()
  {
    if ($scope.newListName.length > 1)
    {
      let newList = new List($scope.newListName);
      $scope.selectedListIndex = $scope.listArray.push(newList) - 1;
      showToast(`Notebook create:  ${newList.title}`);
      document.querySelector(".add-new-list-title").value=""
      $scope.saveData();
    }
  }


  $scope.handleSaveTask = function () {
    var newTaskContent=document.querySelector("#newTaskContent").innerHTML.trim();
    if (newTaskContent.length > 1 && $scope.selectedListIndex != undefined)
    {
      let newTask = new Task(newTaskContent);
      $scope.listArray[$scope.selectedListIndex].taskArray.push(newTask)
      $scope.taskArray = $scope.listArray[$scope.selectedListIndex].taskArray

      showToast(`Note added`);
      //close panel and clean up
      $("#newTaskContent").html("");
      //at last save to local storage
      $scope.saveData();
      console.log($scope.listArray[$scope.selectedListIndex])
    }
  }


  $scope.saveData = function () {
    //save data about app in local
    let json = angular.toJson($scope.listArray);
    localStorage.appData = json;
    //save selectedListIndex
    localStorage.selectedListIndex = $scope.selectedListIndex;
  }

  $scope.emptyList = handleNoTasksState();


  $scope.handleDeleteList = function () {
    if ($scope.selectedListIndex >= 0) {
      //show message removed
      console.log("List at index removed:",$scope.selectedListIndex)
      showToast("List Deleted!");
      let removedList = $scope.listArray.splice($scope.selectedListIndex, 1);
      $scope.saveData();
      $scope.toggle_list_more_options_visibility()
      //go back to main screen after delete
      $scope.handleBackButton();
    }
  }

  $scope.handleClickOnTask=function($event,key)
  {
   
    if($scope.mergeInProgress)
    {
      //merge in progress no need to show options
      //merger with selected task
      $scope.taskI=key;
      if($scope.taskI==$scope.oldTaskI)
      {
        showToast("Cannot merge with same Note");
      }else{
        
        //concat selected content at the end
        $scope.taskArray[$scope.taskI].title+="\n"+$scope.taskArray[$scope.oldTaskI].title;
  
        //remove old note now
        $scope.deleteTask($scope.oldTaskI);
        $scope.oldTaskI=-1;
        
        $scope.mergeInProgress=false;
        
        showToast("Merge complete");
        $scope.saveData();
      }
      
    }else
    {
      //key is the index number of note in list
      // console.log(key);
      //key = taskI will be used perform actions on selected task
      $scope.taskI=key;
      $scope.show_task_more_options = true
      //also get completed status of task to change value of strike out or not
      $scope.task_completed_state=$scope.taskArray[$scope.taskI].isTaskCompleted    
    }
  }

  $scope.close_task_more_options=function()
  {
    $scope.show_task_more_options = false
  }

  $scope.deleteTask=function(index)
  {
    let indexToRemove=-1;
    if(index!==undefined)
    {
      //use supplied argument
      indexToRemove=index;
    }else
    {
      //no args try getting selected note
      if($scope.taskI>=0)
      {
        indexToRemove=$scope.taskI;
        $scope.taskI=-1;  
      }
    }
      
    if(indexToRemove!=-1)
    {
      let removed=$scope.taskArray.splice(indexToRemove,1);
      $scope.saveData();
      $scope.show_task_more_options = false

      showToast("Note deleted!");
    }else
    {
      showToast("Error while removing note");      
    }    
  }


  $scope.moveTask=function()
  {
    //move to another list
    $scope.noteToMove=$scope.taskArray[$scope.taskI];
    $scope.moveInProgress=true;
    showToast("Tap on List to move note in List");
    $scope.show_task_more_options = false

    $scope.handleBackButton();

  }
  
  
  $scope.mergeTask=function()
  {
    //save selected note position
    $scope.oldTaskI=$scope.taskI;
    
    //close panel
    $scope.show_task_more_options = false

    
    //show message
    showToast("Tap on note to merge selected note");

    //active merge task in progress
    $scope.mergeInProgress=true;
  }

  $scope.cancelAction=function()
  {
    //cancel move or merge
    $scope.mergeInProgress=false;
    $scope.oldTaskI=-1
    
    $scope.moveInProgress=false;
    $scope.noteToMove=null;
    console.log("action cancelled")
    showToast("Action Cancelled")
  }
  
  $scope.editTask=function()
  {
    //open add box done from event open close nav bar js
    //close more options
    $scope.show_task_more_options = false

    
    //set content
    $("#newTaskContent").html($scope.taskArray[$scope.taskI].title)
    
    //change add to edit
    document.querySelector("#confirm-change-button").style.display="block";
    document.querySelector("#add-new-task-ok").style.display="none";
    
  }

  $scope.updateTask=function()
  {
    $scope.taskArray[$scope.taskI].title=document.querySelector("#newTaskContent").innerHTML.trim();
    
    //revert back
    document.querySelector("#confirm-change-button").style.display="none";
    document.querySelector("#add-new-task-ok").style.display="block";
    $("#newTaskContent").html("")
    showToast("Note updated");
    $scope.saveData()
  }

  $scope.cancelNewTask=function()
  {
    document.querySelector("#confirm-change-button").style.display="none";
    document.querySelector("#add-new-task-ok").style.display="block";
    $("#newTaskContent").html("")
  }
  
  $scope.purgeList=function()
  {
    if($scope.selectedListIndex>=0)
    {
      $scope.taskArray=[]
      $scope.listArray[$scope.selectedListIndex].taskArray=[];
      $scope.saveData();
      $scope.toggle_list_more_options_visibility()
      showToast("List is empty now")
    }
  }

  $scope.toggle_task_complete=function($event,key)
  { 
    // move completed tasks at end
    if(key!=undefined)
    {
      let task = $scope.taskArray[key]
      task.isTaskCompleted=!task.isTaskCompleted;
      task.taskIcon = task.isTaskCompleted?"radio_button_checked":"radio_button_unchecked";
      $scope.taskArray[key] = task
      if(task.isTaskCompleted)
      {
        $scope.taskArray.splice(key, 1);
        $scope.taskArray.push(task)
      }
      $scope.saveData();
      $scope.show_task_more_options = false
      //showToast("Note Strike out!");
    }   
  }


  $scope.strike_out_task=function()
  {

    if($scope.taskI>=0)
    {
      let task = $scope.taskArray[$scope.taskI]
      task.isTaskCompleted=!task.isTaskCompleted;
      //also update icon
      task.taskIcon = task.isTaskCompleted?"radio_button_checked":"radio_button_unchecked";
      //also add strike out class
      $scope.taskArray[$scope.taskI] = task
      $scope.saveData();
      $scope.show_task_more_options = false

      //showToast("Note Strike out!");
    }   
  }


  $scope.toggle_list_more_options_visibility = function(){
    $scope.show_list_more_options = !$scope.show_list_more_options
    $scope.nav_more_vert_icon = $scope.show_list_more_options?"close":"more_vert";
    $scope.app_size()
  }

  $scope.app_size=function()
  {
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


  $scope.toggle_theme=function()
  {
    if($scope.theme=="light")
    {
      //change to dark dark_mode
      $scope.theme = "dark"
      $scope.theme_menu_text = "Turn On Light Theme"
      $scope.theme_menu_icon = "light_mode"
    }else{
      //change to light_mode
      $scope.theme = "light"
      $scope.theme_menu_text = "Turn On Dark Theme"
      $scope.theme_menu_icon = "dark_mode"
    }
    $scope.toggle_list_more_options_visibility()
  }


  //define all funcions above init
  $scope.init = function ()
  {
    console.log("initializing app...");
    $scope.moveInProgress=false
    $scope.mergeInProgress=false
    $scope.show_list_more_options = false
    $scope.show_task_more_options = false    
    $scope.nav_more_vert_icon="more_vert"
    $scope.show_nav_more_vert_button = false
    $scope.theme = "light"
    $scope.theme_menu_text = "Turn On Dark Theme"
    $scope.theme_menu_icon = "dark_mode"
    $scope.show_delete_list_option = false
    $scope.show_purge_list_option = false
    $scope.listArray = readData();
    if(patchApplied)
    {
      //if new property added to previous version
      //save these properties now
      $scope.saveData();
    }

    $scope.taskArray = [];
    console.log($scope.listArray);
    $scope.defaultPageTitle = "Notebooks";
    $scope.pageTitle = $scope.defaultPageTitle;
    $scope.taskI=-1;
    $scope.allTasks=$scope.getTasksOnly();
    $scope.init_hammer_touch_events()
  };
  
  $scope.init();

});



function readData() 
{
  try {
    let appData = localStorage.appData;
    if (appData == undefined || appData=="[]")
    {
      return setupDemoList();
    } else
    {
      //load
      let json = JSON.parse(appData);
      // document.querySelector("#back").value=appData;
      //apply border color theme patch
      json=borderColorThemePatch(json);
      return json;
    }
  } catch (error)
  {
    return setupDemoList();
  }
}

// if no data is found create demo files
function setupDemoList()
{
  let list = new List("Your First Notebook");
  let task = new Task("We have added first note!");
  list.taskArray.push(task);
  return [list];
}

function borderColorThemePatch(json)
{
  json.forEach(item=>
  {
    item.borderColor=item.borderColor || {};
    console.log(item.borderColor)
    if(item.borderColor.length==undefined)
    {
      //newly created property
      //assign random color
      item.borderColor=getRandomColor();
      patchApplied=true;
    }
  })

  return json;
}
