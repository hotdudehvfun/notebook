function tag_controller($scope, notebook_service, shared_service, db_service, tag_service) {
    const set_shared = (k, v) => shared_service.set(k, v);
    const emit_toast = msg => $scope.$emit("show_toast", msg);


    $scope.show_dialog = false;
    $scope.show_tag_list = false;
    $scope.selected_tag = null;
    $scope.tags = {}
    $scope.tag_arr = []
    $scope.new_tag_name = ""
    $scope.all_notebooks = []
    $scope.notebooks_inside_selected_tag = []


    $scope.create_tag = () => {
        try {
            $scope.tags = tag_service.create_tag($scope.tags, $scope.new_tag_name.toLocaleLowerCase())
            $scope.new_tag_name = ""
            db_service.write_tags($scope.tags)
            emit_toast("Tag created")
            $scope.show_dialog = false;
            $scope.load_tags();
        } catch (err) {
            console.log("Error while creating tag", err)
            emit_toast("Error while creating tag")
        }
    }

    $scope.load_notebooks_with_tag = (tag) => {
        try {
            $scope.selected_tag = tag
            console.log("Load notebooks with tag", tag, $scope.selected_tag)
            $scope.notebooks_inside_selected_tag = tag_service.get_notebooks_in_tag($scope.tags, $scope.selected_tag)
        } catch (err) {
            console.log(err)
        }
    }

    $scope.load_tags = () => {
        $scope.tags = db_service.read_tags()
        $scope.tag_arr = tag_service.get_tags_arr($scope.tags)
        console.log($scope.tag_arr)
    }

    $scope.remove_notebook_from_tag = (notebook) => {
        try {
            //remove it from notebooks inside current tag array
            $scope.notebooks_inside_selected_tag = $scope.notebooks_inside_selected_tag.filter(n => n.id != notebook.id)
            //update tags
            $scope.tags = tag_service.remove_notebook_from_tag($scope.tags, $scope.selected_tag, notebook.id)

            //write database
            db_service.write_tags($scope.tags)

            emit_toast(`${notebook.title} remove from ${$scope.selected_tag}`)
        } catch (error) {
            console.log(error)
        }
    }

    // add or remove selected notebook from current tag
    $scope.add_notebook_to_tag = (notebook) => {
        try {
            if (!$scope.selected_tag) {
                emit_toast("No tag selected")
                return;
            }
            if (!notebook) {
                emit_toast("No notebook selected")
                return;
            }
            console.log("Toggle notebook from tag", notebook, $scope.selected_tag)
            console.log(notebook)
            $scope.tags = tag_service.add_notebook_to_tag($scope.tags, $scope.selected_tag, notebook.id)
            emit_toast(`Notebook added to ${$scope.selected_tag}`)

            db_service.write_tags($scope.tags)
            //update notebooks_inside_selected_tag
            $scope.load_notebooks_with_tag($scope.selected_tag)

        } catch (err) {
            console.log(err)
            $scope.show_toast(err)
        }
    }

    // delete tag
    $scope.remove_notebook_tag = () => {
        // show prompt to confirm
        if (!$scope.selected_tag) {
            emit_toast("No tag selected")
            return;
        }
        if (confirm(`Remove tag: ${$scope.selected_tag}?`)) {
            $scope.tags = tag_service.remove_tag($scope.tags, $scope.selected_tag)
            $scope.selected_tag = null
            $scope.notebooks_inside_selected_tag = []
            db_service.write_tags($scope.tags)
            emit_toast(`${$scope.selected_tag} Tag removed`)
        }
    }

    $scope.notInSelectedTag = function (notebook) {
        return !$scope.notebooks_inside_selected_tag.some(n => n.id === notebook.id);
    };

    //tag list view is opened
    $scope.$on("show_tag_list", function (e, d) {
        console.log("show tag view")
        $scope.show_tag_list = true;
        $scope.load_tags()
        $scope.all_notebooks = db_service.read_notebooks()
    })

    //close
    $scope.$on("close_tag_list", function (e, d) {
        $scope.show_tag_list = false;
        $scope.show_dialog = false;
    })




}