function create_notebook_dialog_controller($scope, notebook_service, shared_service) {

    //notebook data
    $scope.new_notebook_icon = "📖"
    $scope.new_notebook_name = ""

    //dialog flag
    $scope.show_dialog = false;
    //listen to close all dialogs event from shared service
    $scope.$on("close_all_dialogs", function (e, data) {
        $scope.show_dialog = false;
    })

    // open create notebook popup
    //action create or rename
    $scope.$on('open_notebook_popup', function (event,action) {
        $scope.current_notebook = shared_service.get("current_notebook");
        $scope.create_notebook_obj = $scope.init_create_notebook_obj()
        $scope.create_notebook_obj.action = action;
        $scope.show_dialog = true;
    });

    $scope.close_dialog = () => {
        $scope.show_dialog = false;
        $scope.new_notebook_icon = "📜"
        $scope.new_notebook_name = ""
    };


    //rename notebook
    $scope.rename_notebook = () => {
        try {
            const notebook = $scope.current_notebook;
            const newName = $scope.new_notebook_name;
            const newIcon = $scope.new_notebook_icon;
            const updated_notebook = notebook_service.rename_notebook(notebook, newName, newIcon);

            $scope.new_notebook_icon = "📜";
            $scope.new_notebook_name = "";

            $scope.show_dialog = false;


            // broadcast event to update notebook in main controller
            $scope.$emit("notebook_renamed",notebook);
            shared_service.set("show_toast","Notebook renamed successfully")

        } catch (err) {
            console.error("Error while renaming notebook", err);
        }
    };

    // create notebook using popup
    $scope.handle_click_on_create_notebook_button = () => {
        try {
            const new_notebook = notebook_service.create_notebook(
                $scope.new_notebook_name.trim(),
                $scope.new_notebook_icon
            );
            // tell main controller to refresh notebooks
            $scope.$emit('notebooks_updated',new_notebook);
            $scope.new_notebook_icon = "📜";
            $scope.new_notebook_name = "";
            $scope.show_dialog = false;
            $scope.$emit('show_toast', "Notebook created successfully");
        } catch (error) {
            console.log(error)
        }
    };


    $scope.handle_input_on_notebook = function (e) {
        try {
            if (e.keyCode == 13) {
                if ($scope.create_notebook_obj.action == "create")
                    $scope.handle_click_on_create_notebook_button()
                if ($scope.create_notebook_obj.action == 'rename')
                    $scope.rename_notebook()
            }
        } catch (err) {
            console.log(err)
        }
    }


    // this obj handles create and rename notebook
    $scope.init_create_notebook_obj = () => {
        return {
            create: {
                title: "Open new notebook",
                placeholder: "New notebook name",
                icon: "pencil.and.list.clipboard",
            },
            rename: {
                title: "Rename notebook",
                placeholder: `Rename "${$scope.current_notebook ? $scope.current_notebook.title : ''}" to`,
                icon: "pencil.and.list.clipboard",
            },
            action: "create"
        }
    }

    $scope.init = () => {
        // console.log("create notebook dialog controller initialized")
        $scope.create_notebook_obj = $scope.init_create_notebook_obj()
    }




}