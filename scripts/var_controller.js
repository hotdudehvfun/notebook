function var_controller($scope,shared_service,db_service)
{
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
    $scope.$on("show_var_list_changed", function (e,state) {
        //current notebook is available in shared service
        console.log('var list changed',state)
        $scope.show_var_list = state
        //return object
        $scope.system_vars = db_service.read_vars()
    });

    //create var pop up
    $scope.$on("show_var_popup_changed", function (e,state) {
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
        if (name!="" &&value!="") {
            console.log("Name and value required")
        }
        $scope.system_vars[name] = value
        console.log($scope.system_vars)
        $scope.clean_up()
        db_service.write_vars($scope.system_vars)
        shared_service.set("show_toast","Var saved")
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
        // Recursive function to evaluate expressions
        function evaluate(value) {
            return value.replace(/\b[a-zA-Z_]\w*\b/g, function (match) {
                if ($scope.system_vars.hasOwnProperty(match)) {
                    // If the match is an expression, evaluate it recursively
                    let expr = $scope.system_vars[match];
                    if (typeof expr === 'string') {
                        return evaluate(expr);
                    } else {
                        return expr;
                    }
                }
                return match;
            });
        }

        try {
            // Evaluate the expression and return the result
            let result = eval(evaluate(value))
            result = result % 1 == 0 ? result : result.toFixed(2);
            return result;
        } catch (error) {
            console.error("Invalid expression: ", error);
            return "Invalid expression";
        }
    }

    $scope.handle_click_on_var = (key)=>{
        $scope.show_more_options = key
        console.log(key)
    }


}