function note_controller($scope,$rootScope, $timeout, db_service, notebook_service, note_service, graph_service, shared_service, wiki_service) {

    $scope.current_notebook = []
    $scope.notes = []
    $scope.is_note_selected = false;
    $scope.selected_note = null;
    $scope.is_note_multi_select_on = false
    $scope.CONST = {
            IMPORT: "import",
            EXPORT: "export",
            VIEW_NOTEBOOK: "notebook",
            VIEW_NOTE: "note",
            VIEW_SYSTEM: "system_var",
            VIEW_TAG: "tag",
            VIEW_CREATE_NOTE: "create_note",
            VIEW_BIN: "bin",
            COMPLETE: 1,
            MOVE: 2,
            MERGE: 3,
            REMOVE: 4,
            OPEN: 5,
            CANCEL: 6,
            CREATE_NOTEBOOK: 7,
        }

    // custom code of note is parsed to output html content
    $scope.parse_markdown_to_html = function (text) {
        return wiki_service.parseWikiTextToHTML(text)
    }

    // get notebook age
    $scope.notebook_age = function () {
        return notebook_service.get_notebook_age($scope.current_notebook)
    }

    //open menu for note
    //if multi select is on , just select notes
    $scope.handle_tap_on_note = function (note, type) {
        try {
            //broadcast event to open note more options dialog
            if ($scope.is_note_multi_select_on) {
                note.isSelected = !note.isSelected;
            } else {
                $scope.selected_note = note;
                shared_service.set("current_note", note)
                $rootScope.$broadcast('open_note_more_options_menu', type);
            }
        } catch (err) {
            console.log("Error", err)
        }
    }

    //used by notes list
    $scope.notebook_has_completed_tasks = () => {
        let _notebook = shared_service.get("current_notebook")
        return notebook_service.notebook_has_completed_tasks(_notebook);
    };

    $scope.is_notebook_locked = () => {
        let notebook = shared_service.get("current_notebook")
        return notebook?.is_locked || false;
    };

    $scope.get_svg_src = (name) => {
        const svg_path = `./img/icons/${name}.svg`;
        return name ? svg_path : "./img/icons/leaf.fill.svg";
    };

    $scope.return_bar_graph = () => {
        return graph_service.create_bar_graph();
    }

    
    $scope.$on("handle_multi_select_action",(e,action)=>{
        $scope.handle_multi_select_action(action)
    })

    //leave multi select options in main controller
    $scope.handle_multi_select_action = (action_code) => {
        //COMPLETE ACTION
        // isSelected is property available in note
        // js can also create dynamic props
        if ($scope.CONST.COMPLETE == action_code) {
            try {
                $scope.notes.forEach((note, index) => {
                    if (note.isSelected) {
                        note.isTaskCompleted = true;
                        note.isSelected = false;
                    }
                })
                db_service.write_notebook($scope.current_notebook)
                shared_service.set("current_notebook", $scope.current_notebook)
                $scope.is_note_multi_select_on = false;
                $scope.show_toast("Selected notes completed")
            } catch (err) {
                console.log(err)
                $scope.show_toast("Failed to complete")
            }
            return;
        }

        // MOVE ACTION
        // this opens quick notebook dialog
        // based on quick notebook action, isSelected notes are moved to selected notebook
        // using notebook service
        if ($scope.CONST.MOVE == action_code) {
            //show quick notebooks
            //listen for quick_notebook_change event to do something
            shared_service.set("quick_notebooks_action", shared_service.CONST.MOVE)
            shared_service.set("show_quick_notebooks",true)
            return;
        }
        // MERGE ACTION
        if ($scope.CONST.MERGE == action_code) {
            try {
                const selected_notes = $scope.notes.filter(n => n.isSelected)
                const unselected_notes = $scope.notes.filter(n => !n.isSelected)
                selected_notes.forEach(note => note.isSelected = false);
                $scope.notes = unselected_notes // current notebooks is also updated by reference
                $scope.notes.push(new Task(selected_notes.map(note => note.title).join("\n\n")))
                $scope.current_notebook.taskArray = $scope.notes
                db_service.write_notebook($scope.current_notebook)
                shared_service.set("current_notebook", $scope.current_notebook)
                $scope.is_note_multi_select_on = false;
                $scope.show_toast("Notes merged")
            } catch (error) {
                console.error("Cannot merge completed notes", error);
            }
            return;
        }
        //REMOVE ACTION
        if ($scope.CONST.REMOVE == action_code) {
            try {
                let count = 0
                $scope.notes.filter((note) => {
                    if (note.isSelected) {
                        note.isSelected = false;
                        note.isDeleted = true;
                        count += 1
                    }
                })
                $scope.current_notebook.taskArray = $scope.notes
                db_service.write_notebook($scope.current_notebook)
                shared_service.set("current_notebook", $scope.current_notebook)
                $scope.is_note_multi_select_on = false;
                $scope.show_toast(`${count} Notes moved to Bin`)
            } catch (error) {
                console.error(error);
            }
            return;
        }
        //cancel 
        if ($scope.CONST.CANCEL == action_code) {
            try {
                console.log(action_code)
                $scope.is_note_multi_select_on = false
            } catch (error) {
                console.error(error);
            }
        }
    }

    //changed from note menu
    $scope.$on("note_multi_select_on_changed", function (e, value) {
        $scope.is_note_multi_select_on = value
    });

    $scope.is_clipboard_empty = () => {
        return shared_service.get("copied_task") == null
    }

    $scope.get_total_notes_len = (notes) => {
        //return notes not deleted length
        return notes.filter(note => !note.isDeleted).length;
    }

    $scope.get_completed_notes_len = (notes) => {
        try {
            return notes.filter((note) => {
                if (!note.isDeleted && note.isTaskCompleted)
                    return note;
            }).length
        } catch (error) {
            console.log("error ", error)
        }
        return -1;
    }

    $scope.show_empty_notebook_state = () => {
        if ($scope.get_total_notes_len($scope.notes) == 0)
            return true
        return false
    }

    // EVENT: SHOW HIDE NOTE VIEW
    $scope.$on('show_note_list_changed', function (event, state) {
        try {
            $scope.show_dialog = state;
            if (state) {
                $scope.current_notebook = shared_service.get("current_notebook")
                $scope.notes = $scope.current_notebook.taskArray
                console.log($scope.current_notebook)
                $scope.is_note_multi_select_on = false
                reset_scroll(document.querySelector(".content"))
            }
        } catch (err) {
            console.log(err)
        }
    });

    $scope.open_create_note_popup = ()=>{
        try {
            shared_service.set("create_note_source","create")
            shared_service.set("show_view",shared_service.CONST.VIEW_CREATE_NOTE)
        } catch (err) {
            console.log(err)
        }
    }


}