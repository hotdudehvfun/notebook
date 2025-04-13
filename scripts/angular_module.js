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


// create-note popup
app.directive("createNotePopup",function(){
  return {
    scope: false,
    templateUrl:'./scripts/directives/create-note-popup.html'
}});
