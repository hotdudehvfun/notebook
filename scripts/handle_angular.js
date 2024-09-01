let app = angular.module("myapp", []);
//use this to create new properties on previous version
let patchApplied = false;

console.log("App version:3.3.0")
console.log(`
Features
> Added progress bar code:#20%
> Copy and Paste Tasks
> Delete Tasks
> Delete and Rename Notebooks
> {2+2} = 4 Expression evaluation
> System vars
> Trash notebook
> #Today #now #weekday now works
`)
var system_vars = {}



app.filter("sanitize", ['$sce', function ($sce) {
  return function (htmlCode) {
    return $sce.trustAsHtml(htmlCode);
  }
}]);

app.controller('myctrl',my_controller);