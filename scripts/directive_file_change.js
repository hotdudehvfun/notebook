function db_file_change(){
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          element.bind('change', function() {
            scope.$apply(function() {
              scope[attrs.fileInput] = element[0].files[0];
            });
          });
        }
      }
}