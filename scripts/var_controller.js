function var_controller($scope, shared_service, db_service,wiki_service) {
    $scope.show_more_options = ""
    $scope.new_var_name = ""
    $scope.new_var_value = ""
    $scope.show_create_button = true;
    $scope.create_button_text = "Create"

    //listen to close all dialogs event from shared service
    $scope.show_dialog = false;
    $scope.show_var_list = false;
    $scope.system_vars = {}

    //show var list
    $scope.$on("show_var_list_changed", function (e, state) {
        //current notebook is available in shared service
        console.log('var list changed', state)
        $scope.show_var_list = state
        //return object
        $scope.system_vars = db_service.read_vars()
    });

    //create var pop up
    $scope.$on("show_var_popup_changed", function (e, state) {
        //current notebook is available in shared service
        $scope.show_dialog = shared_service.get("show_var_popup");

    });

    $scope.get_system_var_length = () => {
        try {
            return Object.keys($scope.system_vars).length
        } catch (err) {
            console.log(err)
            return 0;
        }
    }

    $scope.clean_up = () => {
        $scope.new_var_name = ""
        $scope.new_var_value = ""
        $scope.create_button_text = "Create"
        $scope.show_dialog = false;
    }

    $scope.delete_var = (key) => {
        if (confirm("Are you sure?")) {
            delete $scope.system_vars[key]
            db_service.write_vars($scope.system_vars)
        }
    }

    //same for edit and create
    $scope.create_system_var = () => {
        let name = $scope.new_var_name.trim().toLocaleLowerCase()
        let value = $scope.new_var_value.trim().toLocaleLowerCase()
        if (name != "" && value != "") {
            console.log("Name and value required")
        }
        $scope.system_vars[name] = value
        console.log($scope.system_vars)
        $scope.clean_up()
        db_service.write_vars($scope.system_vars)
        shared_service.set("show_toast", "Var saved")
    }

    //open pop up to edit
    $scope.open_edit_var_popup = function (key) {
        try {
            $scope.new_var_name = key
            $scope.new_var_value = $scope.system_vars[key]
            $scope.show_dialog = true
            $scope.create_button_text = "Edit"
        } catch (err) {
            console.log("Edit var error", err)
        }
    }

    $scope.evaluate_exp = function (value) {
        return wiki_service.evaluate_exp(value)
    };


    $scope.handle_click_on_var = (key) => {
        $scope.show_more_options = key
        console.log(key)
    }


}