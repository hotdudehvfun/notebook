function notebook_controller($scope,db_service, notebook_service, note_service, graph_service, shared_service,wiki_service) {

    $scope.notebooks = []
    $scope.show_dialog = false
    $scope.sort_notebook_selected_item = 'date'

    // open notebook
    $scope.open_notebook = function (notebook) {
        try {
            if (!notebook)
                return;
            console.log("opening notebook")
            shared_service.set("current_notebook", notebook)
            shared_service.set("system_vars", db_service.read_vars())
            $scope.set_view($scope.CONST.VIEW_NOTE)
        } catch (err) {
            console.log("Error while opening notebook", err);
            alert("Cannot open notebook");
        }
    };

    
    $scope.handle_sort_notebook_change = () => {
        try {
            $scope.handle_group_notebooks()
            localStorage.notebook_sort_by = $scope.sort_notebook_selected_item
        } catch (err) {
            console.log(err)
        }
    }


    // handle group notebooks
    $scope.handle_group_notebooks = () => {
        // console.trace("Grouping Function called from:");
        if ($scope.sort_notebook_selected_item == "date") {
            $scope.grouped_notebooks = notebook_service.get_grouped_notebooks_date($scope.notebooks);
        }

        if ($scope.sort_notebook_selected_item == "title") {
            $scope.grouped_notebooks = notebook_service.get_grouped_notebooks_title($scope.notebooks);
        }

        if ($scope.sort_notebook_selected_item == "tag") {
            $scope.grouped_notebooks = notebook_service.get_grouped_notebooks_tag($scope.notebooks);
        }
    }


    //used in sidebar
    $scope.handle_click_on_more_vert = (_notebook) => {
        // notebook is passed to handle click on more vert icon
        // console.log(_notebook)
        if (_notebook) {
            shared_service.set("current_notebook", _notebook)
        }else{
            console.log("notebook not available")
        }
        $scope.$broadcast("open_notebook_more_options_menu")
    }

    $scope.is_notebook_locked = () => {
        let notebook = shared_service.get("current_notebook")
        return notebook?.is_locked || false;
    };



    // NOTEBOOK CREATED
    // call from only create
    $scope.$on('notebooks_updated', function (event, new_notebook) {
        try {
            $scope.notebooks = db_service.read_notebooks()
            $scope.current_notebook = null
            $scope.handle_group_notebooks()
        } catch (err) {
            console.log(err)
        }
    });

    // NOTEBOOK RENAMED
    $scope.$on('notebook_renamed', function (event, new_notebook) {
        try {
            $scope.current_notebook = new_notebook;
            $scope.pageTitle = $scope.current_notebook.title
            $scope.pageIcon = $scope.current_notebook.icon
        } catch (err) {
            console.log(err)
        }
    });

    //NOTEBOOK DELETED
    $scope.$on('notebook_deleted', function (e, d) {
        try {
            $scope.set_view($scope.CONST.VIEW_NOTEBOOK)
        } catch (err) {
            console.log(err)
        }
    });

    // EVENT: SHOW HIDE NOTEBOOK VIEW
    $scope.$on('show_notebook_list_changed', function (event,state) {
        try {
            $scope.show_dialog = state;
            if(state)
            {
                $scope.notebooks = db_service.read_notebooks();
                $scope.sort_notebook_selected_item = localStorage.notebook_sort_by || "date"
                $scope.handle_group_notebooks()
            }
        } catch (err) {
            console.log(err)
        }
    });
}