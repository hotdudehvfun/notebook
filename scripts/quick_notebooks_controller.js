function quick_notebooks_controller($scope,$rootScope,shared_service,db_service) {
    $scope.notebooks = []
    //listen to close all dialogs event from shared service
    $scope.show_dialog = false;
    //use this to open or close dialog
    $scope.$on("show_quick_notebooks_changed", function (e,data) {
        console.log("open q n")
        $scope.show_dialog = true;
        $scope.load_notebooks()
    })

    $scope.load_notebooks =()=>{
        $scope.notebooks = db_service.read_notebooks()
    };

    $scope.quick_notebooks_item_onclick = (notebook)=>
    {
        console.log("quick notebook item click",notebook)
        //this send message to all who want to use quick notebook
        shared_service.set("quick_notebook",notebook)
        $scope.show_dialog = false;
    }
    
    $scope.init = () => {
        try {
            
        } catch (err) {
            console.log(err)
        }
    }




}