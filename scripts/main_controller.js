function main_controller($scope, $timeout, db_service, notebook_service, note_service, graph_service, shared_service) {
    // custom code of note is parsed to output html content
    $scope.parse_markdown_to_html = function (text) {
        return parseWikiTextToHTML(text)
    }

    // get notebook age
    $scope.notebook_age = function () {
        return notebook_service.get_notebook_age($scope.current_notebook)
    }

    // open notebook
    $scope.open_notebook = function (notebook) {
        try {
            if (!notebook)
                return;
            console.log("opening notebook")
            shared_service.set("current_notebook", notebook)
            $scope.pageTitle = notebook.title;
            $scope.pageIcon = notebook_service.get_notebook_icon(notebook)
            $scope.current_notebook = notebook;
            reset_scroll(document.querySelector(".content"))

            $scope.selectedListIndex = $scope.notebooks.indexOf(notebook);
            $scope.notes = notebook.taskArray;
            $scope.selectedListName = notebook.title;

            $scope.is_note_selected = false;
            $scope.selected_note = undefined;

            $scope.set_view($scope.CONST.VIEW_NOTE)
            $scope.note_content_placeholder = `Create note in ${$scope.selectedListName}`;

            // save data when notebook is opened
            // $scope.save_data();
        } catch (err) {
            console.log("Error while opening notebook", err);
            alert("Cannot open notebook");
        }
    };

    // handle sidebar open close
    $scope.open_sidebar = function (e, state) {
        shared_service.set("open_sidebar", true)
    }

    // open notebook popup
    $scope.open_notebook_popup = function (action) {
        //action=create,rename
        $scope.$broadcast('open_notebook_popup', action);
    }


    //USE THIS FUNCTION SET VIEW FROM ANYWHERE IN APP
    //TELL MAIN CONTROLLER WHAT TO OPEN
    $scope.set_view = function (view_name) {
        $scope.show_view = view_name;
        console.log("set current view =", view_name);
        reset_scroll(document.querySelector(".content"));

        // Default UI reset for every view
        shared_service.set('create_note_popup', false);
        shared_service.set('show_tag_list', false);
        shared_service.set('show_var_list', false);
        shared_service.set('show_bin', false);


        switch (view_name) {
            case shared_service.CONST.VIEW_NOTEBOOK:
                $scope.pageTitle = $scope.defaultPageTitle;
                $scope.pageIcon = $scope.default_app_icon;

                shared_service.set("current_notebook", null);
                shared_service.set("current_note", null);

                $scope.notebooks = db_service.read_notebooks();
                $scope.handle_group_notebooks();
                break;

            case shared_service.CONST.VIEW_NOTE:
                $scope.pageTitle = $scope.current_notebook.title;
                $scope.pageIcon = $scope.current_notebook.icon;
                break;

            case shared_service.CONST.VIEW_TAG:
                console.log("open tag list");
                $scope.pageTitle = "Group Notebooks";
                $scope.pageIcon = "📚";
                shared_service.set('show_tag_list', true);
                break;

            case shared_service.CONST.VIEW_CREATE_NOTE:
                console.log("opening create note")
                shared_service.set('create_note_popup', true);
                break;

            case shared_service.CONST.VIEW_SYSTEM:
                console.log("view system vars");
                $scope.pageTitle = "System Vars";
                $scope.pageIcon = "⚙️";
                shared_service.set('show_var_list', true);
                break;

            case shared_service.CONST.VIEW_BIN:
                console.log("view bin");
                $scope.pageTitle = "Recyle Bin"
                $scope.pageIcon = "🗑️";
                shared_service.set('show_bin', true);
                break;
        }
    };

    // get notes length
    $scope.get_notes_length = (notebook) => {
        try {
            if (notebook) {
                return notebook?.taskArray.length
            }
        } catch (error) {
            console.log(error, "error while gettig length of notes")
        }
        return -1;
    }

    //open menu for note
    //if multi select is on , just select notes
    $scope.handle_tap_on_note = function (note,type) {
        try {
            //broadcast event to open note more options dialog
            if ($scope.is_note_multi_select_on) {
                note.isSelected = !note.isSelected;
            } else {
                $scope.selected_note = note;
                shared_service.set("current_note", note)
                $scope.$broadcast('open_note_more_options_menu',type);
            }
        } catch (err) {
            console.log("Error", err)
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


    //used by notes list
    $scope.notebook_has_completed_tasks = () => {
        let _notebook = shared_service.get("current_notebook")
        return notebook_service.notebook_has_completed_tasks(_notebook);
    };

    $scope.is_notebook_locked = () => {
        let notebook = shared_service.get("current_notebook")
        return notebook?.is_locked || false;
    };

    // receive broadcast to show toast
    // call directly
    $scope.$on('show_toast', function (event, msg) {
        $scope.show_toast(msg);
    });

    // show toast using shared service
    $scope.$on('show_toast_changed', function (event, msg) {
        $scope.show_toast(msg);
    });

    // show toast: Optimized
    $scope.show_toast = (msg) => {
        if (msg) {
            msg = msg.trim();
            $scope.is_toast_visible = true
            $scope.toast_msg = msg
            if (toast_timer_id)
                clearTimeout(toast_timer_id)
            toast_timer_id = $timeout(() => {
                $scope.is_toast_visible = false
                // console.log("clear toast")
            }, 4000)
        }
    }

    $scope.get_component_details = () => {
        if ($scope.selected_note) {
            /* 
            component types:
            @table
            @chart
            @returns
            @circular_bars
            @label_and_bars
            */
            if ($scope.selected_note.title.trim().startsWith("@")) {
                let component_name = $scope.selected_note.title.trim().split("\n")[0]
                component_name = component_name.split("@")[1]
                return `Component Detected:${component_name}`
            } else {
                return "Component Detected:Text"
            }
        } else {
            return "Note not selected"
        }
    }




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

    $scope.get_svg_src = (name) => {
        const svg_path = `./img/icons/${name}.svg`;
        return name ? svg_path : "./img/icons/leaf.fill.svg";
    };

    $scope.return_bar_graph = () => {
        return graph_service.create_bar_graph();
    }

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

    // EVENT: CURRENT NOTEBOOK IS CHANGED
    $scope.$on('current_notebook_changed', function (event, notebook) {
        try {
            if (notebook) {
                //notebook is updated from two services
                //notebook service and note service
                console.log("current notebook changed", notebook)
                $scope.current_notebook = notebook;
                $scope.notes = $scope.current_notebook.taskArray
                // $scope.set_view($scope.CONST.VIEW_NOTE)
            }
        } catch (err) {
            console.log(err)
        }
    });

    // EVENT: CHANGE VIEW
    $scope.$on('show_view_changed', function (event, view) {
        try {
            if (view) {
                $scope.set_view(view)
            }
        } catch (err) {
            console.log(err)
        }
    });


    //from bottom bar
    $scope.open_create_note_popup = function () {
        try {
            $scope.set_view($scope.CONST.VIEW_CREATE_NOTE)
        } catch (err) {
            console.log("Error", err)
        }
    }

    //from bottom bar
    $scope.open_create_var_popup = function () {
        try {
            //broadcast event to open note more options dialog
            //when create note is opened from bottom bar
            shared_service.set("show_var_popup", true);
        } catch (err) {
            console.log("Error", err)
        }
    }





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
            $scope.$broadcast("show_quick_notebooks")
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

    $scope.handle_click_on_notebook_title = () => {
        try {
            shared_service.set("quick_notebooks_action", shared_service.CONST.OPEN)
            $scope.$broadcast("show_quick_notebooks")
        } catch (error) {
            console.log(error)
        }
    }

    $scope.$on("quick_notebook_changed", function (e, notebook) {
        $scope.handle_quick_notebook_change_event()
    });

    //show list of notebooks for quick actions
    $scope.handle_quick_notebook_change_event = () => {
        console.log("handle_quick_notebook_change_event")
        const notebook = shared_service.get("quick_notebook")
        const action = shared_service.get("quick_notebooks_action")
        console.log("get action", action)
        try {
            switch (action) {
                case shared_service.CONST.MOVE:
                    let updated_notebook = notebook_service.move_notes_to_notebook($scope.current_notebook, notebook)
                    shared_service.set("current_notebook", updated_notebook)
                    $scope.is_note_multi_select_on = false
                    break;
                case shared_service.CONST.OPEN:
                    $scope.open_notebook(notebook)
                    break;
            }
        } catch (error) {
            console.log("handle quick notebook tap event", error);
        }
    };

    $scope.is_clipboard_empty = () => {
        return shared_service.get("copied_task") == null
    }

    //hide when creating note
    $scope.show_topbar = () => {
        return !($scope.show_view == "create_note")
    }



    //clicked from notes list
    $scope.toggle_note_completed_state = (note) => {
        note.isTaskCompleted = !note.isTaskCompleted
        shared_service.set("current_notebook", $scope.current_notebook)
        db_service.write_notebook($scope.current_notebook)
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


    // init everything
    $scope.init = () => {
        console.log("init called")
        //CONST values
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

        //dialog flags
        $scope.dialog_flags = {
            is_sidebar_menu_open: false,
            show_list_more_options: false, // show options for notebooks
            show_db_popup: false, // show import export popup
            show_create_system_var_popup: false, // 
            show_password_popup: false, // show password popup
            show_quick_notebooks: false, // show quick notebook list
            show_note_more_options: false, // show options for notes
            show_notebook_popup: false, //to show create notebook popup
            show_edit_note_more_options: false, // show edit options for notes
            show_create_tag_popup: false, // show create tag popup
        }

        // do not include it in dialog flags
        $scope.show_note_popup = false; //to show create note popup

        $scope.toast_msg = "" // toast message
        $scope.show_view = $scope.CONST.VIEW_NOTEBOOK // default to show NOTEBOOK VIEW

        //button flags
        $scope.show_delete_system_var_button = false // delete button in system var popup
        $scope.show_update_task_button = false // update button for existing note
        $scope.is_sortable = false // checkbox to sort notes 
        $scope.is_toast_visible = false // show hide toast
        $scope.is_data_locked = false // check data is locked or not
        $scope.is_trash_open = false // is trash open
        $scope.is_note_selected = false //flag to check if any note is selected
        $scope.show_note_complete_button = false // show hide complete button in note
        $scope.current_list_symbol = "-" // symbol to insert when list mode is ON
        $scope.is_list_mode_on = false // if on, enter press a symbol is inserted at start of line
        $scope.auto_num_list_mode_on = false // if on, enter press a symbol is inserted at start of line with auto number



        $scope.list_symbols_array = ["✅", "⚠", "-", "*"] // available sysbols to insert when list mode is ON
        $scope.system_create_btn_title = "Create" // create or update title is changed
        $scope.is_note_multi_select_on = false // select multiple notes
        $scope.note_multi_select_array = [] // hold selected notes

        $scope.group_notebook_left_panel_array = [] //holds selected notebooks in left panel to move out of group
        $scope.group_notebook_right_panel_array = [] //holds selected notebooks in left panel to move inside a group

        $scope.action_on_quick_notebook_item = $scope.CONST.OPEN // what to do when quick notebook item is clicked
        $scope.sort_notebook_selected_item = 'date' // sort notebooks default is DATE



        // transaction component
        $scope.new_transaction = {
            desc: "",
            category: "Bill",
            categories: ["Bill", "Food", "Shopping", "Entertainment", "Travel", "Health", "Education", "Investments", "Savings", "Books", "Luxury item", "Misc"],
            method: "cash",
            //cash or credit
            account: "none",
            date: "none",
            amount: 0,
            show: false,
        }

        // circular progress component 
        $scope.circular_progress = {
            heading_pos: "left",
            // position of heading
            x_labels: "",
            //labels
            y_values: "",
            // values
            show: false,
        }

        // by default create notebook is shown
        $scope.show_searchbar = false
        $scope.textarea_default_height = 64
        $scope.textarea_max_height = 200
        //show this icon on create notebook and update it automatically



        //default values
        $scope.defaultPageTitle = "Notebooks";
        $scope.default_app_icon = "☘️"
        $scope.system_icon = "⚙️"
        $scope.trash_icon = "🗑️"
        $scope.pageTitle = $scope.defaultPageTitle;
        $scope.pageIcon = $scope.default_app_icon
        //svg source
        $scope.copied_task = null
        $scope.db_operation = null


        //enable select notebooks
        $scope.select_notebooks = false
        $scope.selected_notebooks = []
        $scope.select_notebooks_menu_text = "Select Notebooks"

        // input values
        $scope.note_content = ""

        $scope.selected_note = null;
        $scope.note_content_placeholder = "Create quick note"

        $scope.max_notebook_title_len = 20
        $scope.note_textarea_container_default_height = 35
        $scope.note_textarea_container_height = 35
        $scope.note_textarea_container_max_height = 250
        $scope.password = ""
        $scope.selected_split_delimiter = "\n"
        // default delimiter is new line
        $scope.presets_delimiters = ["new line", "#", "$", "!"]

        // 
        $scope.proverbs = ["An empty vessel can hold anything.", "An empty mind makes progress.", "Emptiness is the beginning of all things.", "An empty mind is a clear mind.", "The empty pot makes the loudest noise.", "The less you carry, the farther you go.", "Only when the cup is empty can it be filled.", "In the void, possibilities are endless.", "Silence is a source of great strength.", "Emptiness is the path to wisdom.", "A full cup cannot accept more water.", "True understanding comes from nothingness.",]

        $scope.empty_notebook_msg = getRandomItem($scope.proverbs)

        //read saved data
        $scope.notebooks = db_service.read_notebooks();
        $scope.notes = []
        //group notebooks
        //date, title, tags
        $scope.sort_notebook_selected_item = localStorage.notebook_sort_by || "title"
        $scope.handle_group_notebooks()
        // console.log($scope.notebooks)
        // $scope.show_view = $scope.CONST.VIEW_TAG

    };

    $scope.$on('$viewContentLoaded', function () {
        $scope.init();
    });

}