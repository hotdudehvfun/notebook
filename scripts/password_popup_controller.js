function passwrord_popup_controller($scope,shared_service,notebook_service)
{
    $scope.password = "";
    //listen to close all dialogs event from shared service
    $scope.show_dialog = false;

    //listen to show password popup event from shared service
    $scope.$on("show_password_popup_changed", function (e,data) {
        //current notebook is available in shared service
        $scope.show_dialog = shared_service.get("show_password_popup");
    })

    $scope.lock_data = () => {
        let notebook = shared_service.get("current_notebook");
        let updated_notebook = notebook_service.lock_data(password.value,notebook);
        // broadcast event to update notebook in main controller
        shared_service.set("current_notebook",notebook)
        $scope.$emit("notebook_updated", {
            notebook: updated_notebook
        });
        $scope.show_dialog = false;
        password.value = "";
    }

    $scope.unlock_data = () => {
        let notebook = shared_service.get("current_notebook");
        let updated_notebook = notebook_service.unlock_data(password.value,notebook);
        shared_service.set("current_notebook",notebook)
        $scope.$emit("notebook_updated", {
            notebook: updated_notebook
        });
        $scope.show_dialog = false;
        password.value = "";
    }

    $scope.init = () => {
        try {
            
        } catch (err) {
            console.log(err)
        }
    }


}