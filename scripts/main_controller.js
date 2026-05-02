let init_done = false;
function main_controller($scope, $timeout, db_service, notebook_service, note_service, graph_service, shared_service, wiki_service) {
    const set_shared = (k, v) => shared_service.set(k, v);

    // handle sidebar open close
    $scope.open_sidebar = function (e, state) {
        try {
            shared_service.set("open_sidebar", true)
        } catch (err) {
            console.log(err)
            $scope.show_toast("Cannot open sidebar")
        }
    }

    // open notebook popup
    $scope.open_notebook_popup = function (action) {
        //action=create,rename
        try {
            $scope.$broadcast('open_notebook_popup', action);
        } catch (err) {
            console.log(err)
            $scope.show_toast("Unable to open popup")
        }
    }


    //USE THIS FUNCTION SET VIEW FROM ANYWHERE IN APP
    //TELL MAIN CONTROLLER WHAT TO OPEN
    $scope.set_view = function (view_name) {
        try {
            $scope.show_view = view_name;
            // console.log("CURRENT VIEW = ", view_name);
            reset_scroll(document.querySelector(".content"));
            // Default UI reset for every view
            // Hide all other view
            shared_service.set('create_note_popup', false);
            shared_service.set('show_tag_list', false);
            shared_service.set('show_var_list', false);
            shared_service.set('show_bin', false);
            shared_service.set('show_notebook_list', false);
            shared_service.set('show_note_list', false);

            switch (view_name) {
                case shared_service.CONST.VIEW_NOTEBOOK:
                    $scope.pageTitle = $scope.defaultPageTitle;
                    $scope.pageIcon = $scope.default_app_icon;
                    shared_service.set("current_notebook", null);
                    shared_service.set("current_note", null);
                    shared_service.set("show_notebook_list", true)
                    break;

                case shared_service.CONST.VIEW_NOTE:
                    $scope.current_notebook = shared_service.get("current_notebook")
                    $scope.pageTitle = $scope.current_notebook.title;
                    $scope.pageIcon = $scope.current_notebook.icon;
                    shared_service.set("show_note_list", true)
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
        } catch (err) {
            console.log(err)
            $scope.show_toast("Failed to open view")
        }
        // console.log("set view end")
    };

    //from top bar
    $scope.handle_click_on_more_vert = (_notebook) => {
        // notebook is passed to handle click on more vert icon
        // console.log(_notebook)
        if (_notebook) {
            shared_service.set("current_notebook", _notebook)
        } else {
            console.log("notebook not available")
        }
        $scope.$broadcast("open_notebook_more_options_menu")
    }

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
            }, 2000)
        }
    }

    $scope.get_svg_src = (name) => {
        const svg_path = `./img/icons/${name}.svg`;
        return name ? svg_path : "./img/icons/leaf.fill.svg";
    };

    // NOTEBOOK CREATED
    // call from only create
    $scope.$on('notebooks_updated', function (event, new_notebook) {
        try {
            $scope.set_view($scope.CONST.VIEW_NOTEBOOK);
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
            shared_service.set("create_note_source", "create")
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



    $scope.handle_click_on_notebook_title = () => {
        try {
            shared_service.set("quick_notebooks_action", shared_service.CONST.OPEN)
            shared_service.set("show_quick_notebooks", true)
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
                    const current_notebook = shared_service.get("current_notebook")
                    let updated_notebook = notebook_service.move_notes_to_notebook(current_notebook, notebook)
                    shared_service.set("current_notebook", updated_notebook)
                    $scope.set_view($scope.CONST.VIEW_NOTE)
                    break;
                case shared_service.CONST.OPEN:
                    shared_service.set("current_notebook", notebook)
                    $scope.set_view($scope.CONST.VIEW_NOTE)
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


    $scope.show_empty_notebook_state = () => {
        if ($scope.get_total_notes_len($scope.notes) == 0)
            return true
        return false
    }

    $scope.$on("note_multi_select_on_changed", (e, state) => {
        $scope.is_note_multi_select_on = state;
    })

    //FROM: bottom bar
    //TO: note controller
    $scope.bulk_action = (action) => {
        $scope.is_note_multi_select_on = false;
        $scope.$broadcast("handle_multi_select_action", action)
    }

    $scope.start_unlock = () => {
        set_shared("show_password_popup", true)
    }

    $scope.is_create_note_view_open = () => {
        return shared_service.get('create_note_popup') || false;
    }


    // init everything
    $scope.init = () => {
        console.log("MAIN CONTROLLER INIT")
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

        $scope.dialog_flags = {
            show_edit_note_more_options: false,
        }

        // do not include it in dialog flags
        $scope.show_note_popup = false; //to show create note popup

        $scope.toast_msg = "" // toast message

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

        //read saved data
        $scope.notes = []
        //group notebooks
        //date, title, tags
        //view notebooks by default
        $scope.show_view = $scope.CONST.VIEW_NOTEBOOK // default to show NOTEBOOK VIEW
        $scope.set_view($scope.CONST.VIEW_NOTEBOOK)
    };
    $scope.init();
}