function var_controller($scope, shared_service, db_service, wiki_service) {
    $scope.show_more_options = ""
    $scope.new_var_name = ""
    $scope.new_var_value = ""
    $scope.show_create_button = true;
    $scope.create_button_text = "Create"
    $scope.operators = ["(", "+", "-", "/", "*", ")"]

    $scope.selected_var = null
    $scope.formula = [] //contains tokens
    $scope.evaluated_formula = [] // contains nums and operators
    $scope.result = 0
    $scope.push_token_index = -1
    const op_set = new Set($scope.operators)
    $scope.is_operator = (token) => {
        return op_set.has(token)
    }


    //listen to close all dialogs event from shared service
    $scope.show_dialog = false;
    $scope.show_var_list = false;
    $scope.system_vars = {}

    //show var list
    //called from main controller -> shared_service
    //main entry point of system var view
    $scope.$on("show_var_list_changed", function (e, state) {
        //current notebook is available in shared service
        console.log('var list changed', state)
        $scope.show_var_list = state
        //init settings
        $scope.selected_var = null
        $scope.formula = [] //contains tokens
        $scope.evaluated_formula = [] // contains nums and operators
        $scope.result = 0
        $scope.push_token_index = -1

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
            $scope.selected_var = null
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

    //select var to edit the formula
    $scope.select_var = (key, value) => {
        $scope.formula = []
        $scope.evaluated_formula = []

        $scope.selected_var = key
        console.log(key, value)
        let tokens = split_formula(value, $scope.operators)
        $scope.formula = tokens
        $scope.formula.forEach(token => {
            if ($scope.is_operator(token)) {
                $scope.evaluated_formula.push(token)
            } else {
                $scope.evaluated_formula.push($scope.evaluate_exp(token))
            }
        });
        $scope.result = $scope.evaluate_exp($scope.evaluated_formula.join(""))
    }

    //push var to formula
    $scope.push_var = (key, value) => {
        if ($scope.push_token_index !== -1) {
            $scope.formula.splice($scope.push_token_index, 0, key);
            $scope.evaluated_formula.splice(
                $scope.push_token_index,
                0,
                $scope.evaluate_exp(value)
            );
            $scope.push_token_index = -1;
        } else {
            // push at end
            $scope.formula.push(key);
            $scope.evaluated_formula.push($scope.evaluate_exp(value));
        }
        $scope.result = $scope.evaluate_exp(
            $scope.evaluated_formula.join("")
        );
        $scope.save_var()
    };


    //push to operator
    $scope.push_operator = (operator) => {
        if ($scope.push_token_index !== -1) {
            $scope.formula.splice($scope.push_token_index, 0, operator);
            $scope.evaluated_formula.splice(
                $scope.push_token_index,
                0,
                operator
            );
            $scope.push_token_index = -1;
        } else {
            $scope.formula.push(operator)
            $scope.evaluated_formula.push(operator)
        }
        $scope.result = $scope.evaluate_exp($scope.evaluated_formula.join(""))
        $scope.save_var()
    }

    //add token button clicked 
    $scope.add_token = (index) => {
        $scope.push_token_index = index;
    }

    $scope.remove_token = (index) => {
        // console.log($scope.formula[index], index)
        $scope.formula.splice(index, 1)
        $scope.evaluated_formula = []
        $scope.formula.forEach(token => {
            if ($scope.is_operator(token)) {
                $scope.evaluated_formula.push(token)
            } else {
                $scope.evaluated_formula.push($scope.evaluate_exp(token + ""))
            }
        });
        $scope.result = $scope.evaluate_exp($scope.evaluated_formula.join(""))
        $scope.save_var()
    }

    // save var
    $scope.save_var = () => {
        let name = ($scope.selected_var || "").trim().toLowerCase();
        let value = ($scope.formula || []).join("").trim().toLowerCase();

        if (!name && !value) {
            shared_service.set("show_toast", "Name and value are required");
            return;
        }

        if (!name) {
            shared_service.set("show_toast", "Var name is required");
            return;
        }

        if (!value) {
            shared_service.set("show_toast", "Var value is required");
            return;
        }
        $scope.system_vars[name] = value;
        db_service.write_vars($scope.system_vars);
        $scope.clean_up();
        shared_service.set("show_toast", "Var saved");
    };

    $scope.open_input = () => {
        let num = prompt("Enter a number");
        if (num === null || num.trim() === "" || isNaN(num)) {
            console.log("Invalid number");
            return
        } else {
            num = Number(num);
        }
        console.log(num)
        $scope.push_operator(num)
    }


}