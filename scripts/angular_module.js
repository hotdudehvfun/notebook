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

app.service('db_service',db_service)
app.controller('main_controller',main_controller);


// main content
app.directive("mainContent",function(){
  return{
    scope:false,
    templateUrl:"./scripts/directives/main-content.html",
    link:function(scope,element,attrs){
      //make notebook and notes sortable
      // scope.init_sortable_list(".notebooks", "notebooks");
      scope.init_sortable_list(".notes", "notes");
    }
  }
});

//create notebook popup
app.directive("createNotebookPopup",function(){
  return{
    scope:false,
    templateUrl:"./scripts/directives/create-notebook-popup.html",
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
}
});
//top bar
app.directive("topBar",function(){
  return {
    scope: false,
    templateUrl:'./scripts/directives/topbar.html'
}
});
app.directive("popupRenameNotebook",directive_rename_notebook_popup);
app.directive("popupCreateNotebook",directive_new_notebook_popup);
app.directive("popupPassword",directive_password_popup);
app.directive("createNotebookLayout",directive_create_notebook_layout);
app.directive("createNoteLayout",directive_create_note_layout);



// app.directive("dbFileChange",db_file_change);

