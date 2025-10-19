let app = angular.module("notebook_app", []);
//use this to create new properties on previous version
let patchApplied = false;
let toast_timer_id = null;

console.log(`
> App version: 3.9.0
> Added progress bar code:#20%
> Copy and Paste Tasks
> Delete Tasks
> Delete and Rename Notebooks
> {2+2} = 4 Expression evaluation
> Define custom variables
> Trash notebook
> #Today #now #weekday
> System and Trash Notebooks
> Bulk move completed notes to other notebook
`)

var system_vars = {}





app.filter("sanitize", ['$sce', function ($sce) {
  return function (htmlCode) {
    return $sce.trustAsHtml(htmlCode);
  }
}]);


//services for separate logics
app.service('db_service',db_service)
app.service('notebook_service',notebook_service)
app.service('note_service',note_service)
app.service('graph_service',graph_service)
app.service('tag_service',tag_service)
app.service('shared_service',shared_service);



app.controller('main_controller',main_controller);
app.controller('dialog_controller',dialog_controller);
app.controller('create_notebook_dialog_controller',create_notebook_dialog_controller);
app.controller('notebook_more_options_controller',notebook_more_options_controller);
app.controller('note_more_options_controller',note_more_options_controller);
app.controller('passwrord_popup_controller',passwrord_popup_controller);
app.controller("create_note_controller",create_note_controller);
app.controller('create_note_menu_controller',create_note_menu_controller);
app.controller('quick_notebooks_controller',quick_notebooks_controller);
app.controller('db_controller',db_controller);
app.controller('tag_controller',tag_controller);
app.controller('sidebar_controller',sidebar_controller);
app.controller('var_controller',var_controller);








// main content
app.directive("mainContent",function(){
  return{
    scope:false,
    templateUrl:"./scripts/directives/main-content.html",
    link:function(scope,element,attrs){
      //make notebook and notes sortable
      // scope.init_sortable_list(".notebooks", "notebooks");
      //scope.init_sortable_list(".notes", "notes");
    }
  }
});

//create notebook popup and rename with same popup
app.directive("createNotebookPopup",function(){
  return{
    scope:false,
    templateUrl:"./scripts/directives/create-notebook-popup.html",
  }
});

//quick notebooks popup
app.directive("quickNotebooks",function(){
  return{
    scope:false,
    templateUrl:"./scripts/directives/quick-notebooks.html",
  }
});


//db popup
app.directive("popupDb",function(){
  return{
    scope:false,
    templateUrl:"./scripts/directives/popup-db.html"
  }
});



//sidebar
app.directive("sideBar",function(){
  return{
    scope:false,
    templateUrl:"./scripts/directives/sidebar.html",
  }
});

//bottom bar
app.directive("bottomBar",function(){
  return {
    scope: false,
    templateUrl:'./scripts/directives/bottom-bar.html'
}});

//top bar
app.directive("topBar",function(){
  return {
    scope: false,
    templateUrl:'./scripts/directives/topbar.html'
}});

// password popup
app.directive("popupPassword",function(){
  return {
    scope: false,
    templateUrl:'./scripts/directives/popup-password.html'
}});


// system var popup
app.directive("popupCreateVar",function(){
  return {
    scope: false,
    templateUrl:'./scripts/directives/create-var-popup.html'
}});

// create and manage tags popup
app.directive("tagsList",function(){
  return {
    scope: false,
    templateUrl:'./scripts/directives/tags-list.html'
}});

// notebooks list
app.directive("notebooksList",function(){
  return {
    scope: false,
    templateUrl:'./scripts/directives/notebooks-list.html'
}});

// notes list
app.directive("notesList",function(){
  return {
    scope: false,
    templateUrl:'./scripts/directives/notes-list.html'
}});

// create and manage tags popup
app.directive("systemVarList",function(){
  return {
    scope: false,
    templateUrl:'./scripts/directives/system-var-list.html'
}});


//create notebook popup and rename with same popup
app.directive("popupCreateTag",function(){
  return{
    scope:false,
    templateUrl:"./scripts/directives/create-tag-popup.html",
  }
});

//create note view
app.directive("createNoteView",function(){
  return{
    scope:false,
    templateUrl:"./scripts/directives/create-note-view.html",
  }
});

