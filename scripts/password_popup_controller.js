function passwrord_popup_controller($scope,shared_service,notebook_service)
{
    $scope.password = "";
    //listen to close all dialogs event from shared service
    $scope.show_dialog = false;
    $scope.notebook = null

    //listen to show password popup event from shared service
    $scope.$on("show_password_popup_changed", function (e,state) {
        //current notebook is available in shared service
        if($scope.show_dialog==state)
            return
        $scope.show_dialog = state
        if(state)
            $scope.notebook = shared_service.get("current_notebook")
    })

    $scope.lock_data = () => {
        try {
            //lock and write
            let updated_notebook = notebook_service.lock_data(password.value,$scope.notebook);
            // broadcast event to update notebook in main controller
            shared_service.set("current_notebook",updated_notebook)
            $scope.$emit("notebook_updated", {
                notebook: updated_notebook
            });
            $scope.show_dialog = false;
            password.value = "";
        } catch (err) {
            console.log(err)
        }
    }

    $scope.unlock_data = () => {
        try {
            let updated_notebook = notebook_service.unlock_data(password.value,$scope.notebook);
            shared_service.set("current_notebook",$scope.notebook)
            $scope.$emit("notebook_updated", {
                notebook: updated_notebook
            });
            $scope.show_dialog = false;
            password.value = "";
        } catch (err) {
            console.log(err)
        }
    }

}