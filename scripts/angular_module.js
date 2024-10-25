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
`)

/*
{
  "global":
  {
    "a":1,
    "b":2
  },
  "custom":
  {
  
  }
}

*/


var system_vars = {}

app.filter("sanitize", ['$sce', function ($sce) {
  return function (htmlCode) {
    return $sce.trustAsHtml(htmlCode);
  }
}]);

app.service('db_service',db_service)
app.controller('main_controller',main_controller);

// directives
app.directive("mainContent",directive_main_content);
app.directive("sideBar",directive_sidebar);
app.directive("bottomBar",directive_bottom_bar);
app.directive("topBar",directive_top_bar);
app.directive("popupRenameNotebook",directive_rename_notebook_popup);
app.directive("popupCreateNotebook",directive_new_notebook_popup);
app.directive("popupPassword",directive_password_popup);
// app.directive("dbFileChange",db_file_change);

