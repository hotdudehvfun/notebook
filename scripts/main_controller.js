function main_controller($scope, $timeout, db_service, notebook_service, note_service, graph_service, tag_service, shared_service) {
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

            if (notebook.title.toLowerCase() === "system") {
                $scope.show_view = $scope.CONST.VIEW_SYSTEM;
                return;
            }

            $scope.selectedListIndex = $scope.notebooks.indexOf(notebook);
            $scope.notes = notebook.taskArray;
            $scope.selectedListName = notebook.title;

            $scope.is_note_selected = false;
            $scope.selected_note = undefined;

            $scope.show_view = $scope.CONST.VIEW_NOTE;
            $scope.note_content_placeholder = `Create note in ${$scope.selectedListName}`;

            // save data when notebook is opened
            $scope.save_data();
        } catch (err) {
            console.log("Error while opening notebook", err);
            alert("Cannot open notebook");
        }
    };

    // handle sidebar open close
    $scope.open_sidebar = function (e,state) {
        console.log("open side bar")
        shared_service.set("open_sidebar",true)
        // $scope.$broadcast("open_side_bar")
    }

    // open notebook popup
    $scope.open_notebook_popup = function (action) {
        //action=create,rename
        $scope.$broadcast(
            'open_notebook_popup',
            {
                action: action
            }
        );
    }


    $scope.set_view = function (view_name) {
        //available views
        /*
            notebook = list of notebooks
            note = notes inside notebook
            var = show list of user defined variables
            tag = tag manager
        */
        $scope.show_view = view_name
        reset_scroll(document.querySelector(".content"))
        // view all NOTEBOOKS
        if ($scope.show_view == $scope.CONST.VIEW_NOTEBOOK) {
            //reset icon and title
            $scope.pageTitle = $scope.defaultPageTitle
            $scope.pageIcon = $scope.default_app_icon

            //reset selected notebook
            shared_service.set("current_notebook", null)
            shared_service.set("current_note", null)
            $scope.$broadcast('close_create_note_popup');
            $scope.$broadcast('close_tag_list');
            $scope.notebooks = db_service.read_notebooks();
            // call group notebook again
            $scope.handle_group_notebooks()
        }

        // view all NOTES inside notebook
        if ($scope.show_view == $scope.CONST.VIEW_NOTE) {
            $scope.pageTitle = $scope.current_notebook.title
            $scope.pageIcon = $scope.current_notebook.icon
            $scope.$broadcast('close_tag_list');
        }

        // tag manager
        if ($scope.show_view == $scope.CONST.VIEW_TAG) {
            shared_service.set("open_sidebar",false)
            $scope.pageTitle = "Group Notebooks"
            $scope.pageIcon = "📚"
            $scope.$broadcast("show_tag_list", true)
        }

        //create note
        if ($scope.show_view == $scope.CONST.VIEW_CREATE_NOTE) {
            $scope.$broadcast('close_tag_list');
        }

    }


    $scope.get_system_var_length = () => {
        try {
            return Object.keys(system_vars).length
        } catch (err) {
            console.log(err)
        }
        return -1;
    }

    // get completed notes length
    $scope.get_completed_notes_length = (notes) => {
        try {
            return note_service.get_completed_notes_length(notes);
        } catch (error) {
            console.log("error ", error)
        }
    }

    // get notes length
    $scope.get_notes_length = (notebook) => {
        try {
            if (notebook) {
                if (notebook?.title.toLocaleLowerCase() == 'system') {
                    return $scope.get_system_var_length()
                }
                return notebook?.taskArray.length
            }
        } catch (error) {
            // console.log(error, "error while gettig length of notes")
        }
        return -1;
    }

    $scope.get_system_vars = () => {
        let sortedByKey = Object.keys(system_vars).sort()// Sort keys
            .reduce((result, key) => {
                result[key] = system_vars[key];
                return result;
            }
                , {});
        return sortedByKey
    }

    $scope.init_system_var_menu_items = () => {
        $scope.system_var_menu_items = []
        for (const key in system_vars) {
            if (system_vars.hasOwnProperty(key)) {
                $scope.system_var_menu_items.push({
                    icon: "calculate",
                    show: true,
                    text: key,
                    action: () => {
                        $scope.insertTextAtCursor('note_content', key)
                    }
                })
            }
        }
    }

    $scope.edit_var = function (key, value) {
        try {
            $scope.show_delete_system_var_button = true
            $scope.new_var_name = key
            $scope.new_var_value = system_vars[key]
            $scope.system_create_btn_title = "Update"
            $scope.dialog_flags.show_create_system_var_popup = true

        } catch (err) {
            console.log("Edit var error", err)
        }
    }

    $scope.clear_system_input_vars = () => {
        $scope.new_var_name = ""
        $scope.new_var_value = ""
        $scope.system_create_btn_title = "Create"
        $scope.show_delete_system_var_button = false
    }

    $scope.insert_system_var_at_cursor = () => {
        //console.log($scope.selected_system_var)
        insertTextAtCursor('note_content', $scope.selected_system_var)
    }




    $scope.save_data = () => {
        try {
            db_service.write({
                notebooks: $scope.notebooks,
                selectedListIndex: $scope.selectedListIndex,
                system_vars: system_vars,
                notebook_sort_by: $scope.sort_notebook_selected_item
            }, angular)
        } catch (err) {
            console.log("Save data error", err)
        }
    }

    $scope.read_data = () => {
        try {
            let data = db_service.read()
            $scope.notebooks = data.notebooks;
            $scope.selectedListIndex = parseInt(data.selectedListIndex);
            system_vars = data.system_vars;
            $scope.sort_notebook_selected_item = data.notebook_sort_by
            //set up system notebooks
            $scope.init_system_notebooks()
        } catch (err) {
            console.log("Read data error", err)
        }
    }

    //open menu for note
    //if multi select is on , just select notes
    $scope.handle_tap_on_note = function (note) {
        try {
            //broadcast event to open note more options dialog
            if ($scope.is_note_multi_select_on) {
                note.isSelected = !note.isSelected;
            } else {
                $scope.selected_note = note;
                shared_service.set("current_note", note)
                $scope.$broadcast('open_note_more_options_menu');
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
        }
        $scope.$broadcast("open_notebook_more_options_menu")
    }


    $scope.open_create_system_var_popup = () => {
        $scope.dialog_flags.show_create_system_var_popup = true
        $scope.new_var_name = ""
        $scope.new_var_value = ""
        $scope.system_var_popup_title = "Create Variable"
        $scope.system_var_popup_create_button_text = "Create"
        $scope.dialog_flags.show_delete_system_var_button = false
    }

    $scope.evaluate_exp = function (value) {
        // Recursive function to evaluate expressions
        function evaluate(value) {
            return value.replace(/\b[a-zA-Z_]\w*\b/g, function (match) {
                if (system_vars.hasOwnProperty(match)) {
                    // If the match is an expression, evaluate it recursively
                    let expr = system_vars[match];
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

    $scope.delete_system_var = () => {
        if (confirm("Are you sure?")) {
            delete system_vars[$scope.new_var_name]
            $scope.dialog_flags.show_delete_system_var_button = false
            $scope.save_data()
            $scope.show_toast("System var removed")
            $scope.new_var_name = ""
            $scope.new_var_value = ""
        }
    }

    $scope.create_system_var = () => {
        if ($scope.new_var_name.trim() != "" && $scope.new_var_value.trim() != "") {
            //clean vars
            $scope.new_var_name = $scope.new_var_name.trim().toLocaleLowerCase()
            $scope.new_var_value = $scope.new_var_value.trim().toLocaleLowerCase()
        } else {
            $scope.show_toast("Varibale name and value are required");
            return;
        }
        system_vars[$scope.new_var_name] = $scope.new_var_value
        $scope.show_toast(`Variable ${$scope.system_create_btn_title}d`);
        $scope.clear_system_input_vars();
        $scope.save_data();

    }

    $scope.notebook_has_completed_tasks = () => {
        let _notebook = shared_service.get("current_notebook")
        return notebook_service.notebook_has_completed_tasks(_notebook);
    };

    $scope.is_notebook_locked = () => {
        let notebook = shared_service.get("current_notebook")
        return notebook?.is_locked || false;
    };




    //TODO: MOVE TO NOTEBOOK SERVICE
    $scope.init_system_notebooks = () => {
        //notebooks must contain System and Trash notebooks
        //System 2nd last, Trash at last
        let sys_i = -1, trash_i = -1
        $scope.notebooks.forEach((notebook, index) => {
            if (notebook.title.toLowerCase() == "system") {
                sys_i = index;
                notebook.icon = $scope.system_icon
            }
            if (notebook.title.toLowerCase() == "trash") {
                trash_i = index;
                notebook.icon = $scope.trash_icon
            }
        });

        if (sys_i == -1) {
            let system = new List("System", $scope.system_icon)
            $scope.notebooks.push(system)
        }
        if (trash_i == -1) {
            let trash = new List("Trash", $scope.trash_icon)
            $scope.notebooks.push(trash)
        }
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
            }
                , 2000)
        }
    }

    // filter to show all but system and trash notebook: Optimized
    $scope.exclude_sys_trash = function (notebook) {
        return notebook.title.toLowerCase() !== 'system' && notebook.title.toLowerCase() !== 'trash';
    }

    // filter to show only system and trash notebook: Optimized
    $scope.only_sys_trash = function (notebook) {
        return notebook.title.toLowerCase() == 'system' || notebook.title.toLowerCase() == 'trash';
    }

    $scope.toggle_lock_on_notebook = () => {
        console.log()
        let notebook = $scope.notebooks[$scope.selectedListIndex];
        if (notebook.hasOwnProperty('is_locked')) {//toggle lock
        } else {//create property lock
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

    $scope.greet_user = (username) => {
        return greet_user(username);
    }

    // group notebook by date
    $scope.get_grouped_notebooks = function () {
        try {
            let today = new Date();
            let notebooks = $scope.notebooks;
            let groups = {
                'Recently Created': [],
                'This Month': [],
                'Older': {}
            };

            notebooks.forEach(notebook => {
                let created_date = new Date(notebook.dateCreated);
                let diff_days = Math.floor((today - created_date) / (1000 * 60 * 60 * 24));

                if (diff_days <= 7) {
                    groups['Recently Created'].push(notebook);
                } else if (created_date.getFullYear() === today.getFullYear() && created_date.getMonth() === today.getMonth()) {
                    groups['This Month'].push(notebook);
                } else {
                    let month_year = created_date.toLocaleString('default', {
                        month: 'long',
                        year: 'numeric'
                    });
                    if (!groups['Older'][month_year]) {
                        groups['Older'][month_year] = [];
                    }
                    groups['Older'][month_year].push(notebook);
                }
            }
            );
            // console.log(groups)
            return groups;
        } catch (err) {
            console.log(err)
        }
        return [];
    };

    // group notebooks by title
    $scope.get_grouped_notebooks_title = function () {
        let notebooks = $scope.notebooks;
        let grouped = {};

        // Iterate over notebooks and group them by first letter
        notebooks.forEach(notebook => {
            let firstChar = notebook.title.charAt(0).toUpperCase();

            if (!firstChar.match(/[A-Z]/)) {
                firstChar = "#";
                // Group non-alphabetic titles under "#"
            }

            if (!grouped[firstChar]) {
                grouped[firstChar] = [];
            }

            grouped[firstChar].push(notebook);
        }
        );

        // Sort groups alphabetically
        let sortedGroups = Object.keys(grouped).sort((a, b) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)));

        let sortedGroupedNotebooks = {};
        sortedGroups.forEach(key => {
            sortedGroupedNotebooks[key] = grouped[key];
        });
        // console.log(sortedGroupedNotebooks)
        return sortedGroupedNotebooks;
    };


    $scope.get_grouped_notebooks_tag = function () {
        let notebooks = $scope.notebooks || [];
        let tags = db_service.read_tags() || {};
        let grouped = {};

        // Step 1: Create a map from dateCreated to notebook
        let notebook_map = {};
        notebooks.forEach(nb => {
            notebook_map[nb.id] = nb;
        });

        // Step 2: Group notebooks based on tags
        for (let tag in tags) {
            let arr = tags[tag];
            grouped[tag] = [];

            arr.forEach(id => {
                if (notebook_map[id]) {
                    grouped[tag].push(notebook_map[id]);
                }
            });
        }

        // Step 3: Handle notebooks not in any tag
        let all_tagged = new Set(Object.values(tags).flat());
        let ungrouped = notebooks.filter(nb => !all_tagged.has(nb.id));
        if (ungrouped.length > 0) {
            grouped["Ungrouped"] = ungrouped;
        }

        // Step 4: Sort tags alphabetically (Ungrouped always last)
        let sortedKeys = Object.keys(grouped).sort((a, b) =>
            a === "Ungrouped" ? 1 : b === "Ungrouped" ? -1 : a.localeCompare(b)
        );

        let sortedGrouped = {};
        sortedKeys.forEach(key => {
            sortedGrouped[key] = grouped[key];
        });

        console.log(sortedGrouped);
        return sortedGrouped;
    };


    // Watch for changes in notebooks array
    // for grouping purposes
    $scope.$watch('notebooks', function (new_val, old_val) {
        if (new_val !== old_val) {
            //group notebook
            $scope.handle_group_notebooks()
        }
    }, true);

    $scope.get_chart_colors = () => {
        // let colors = Object.keys(CHART_COLORS)
        // colors.forEach((item,index)=>{
        //     item[0] = item[1] //bg
        //     item[1] = get_transparent_color(item[0])//transparent
        // })
        return CHART_COLORS
    }

    // get chart transaprent color
    $scope.get_transparent_color = (rgb, alpha) => {
        return util_get_transparent_color(rgb, alpha)
    }

    // reset new chart
    $scope.reset_new_chart_and_close = () => {
        //reset values
        $scope.new_chart = {
            title: "Untitled",
            // title of chart
            type: "line",
            // type of chart
            theme: "red",
            //theme color
            x_labels: "",
            //labels
            y_values: "",
            // values
            chart_id: 0,
            //create id dynamically while saving
            show: false,
        }
    }

    // create new chart using chart code
    $scope.new_chart_convert_ui_to_code = () => {
        /*
            @chart
            pie
            Title
            chartid#theme
            a,b
            1,2
        */
        try {
            $scope.new_chart.chart_id = new Date().getTime()
            let new_chart_code = "";
            new_chart_code += `@chart`
            new_chart_code += `\n${$scope.new_chart.type}`
            new_chart_code += `\n${$scope.new_chart.title}`
            new_chart_code += `\n${$scope.new_chart.chart_id}#${$scope.new_chart.theme}`
            new_chart_code += `\n${$scope.new_chart.x_labels.split("\n").join(",")}`
            new_chart_code += `\n${$scope.new_chart.y_values.split("\n").join(",")}`
            $scope.note_content = new_chart_code.trim()
            //validate code
            if ($scope.is_valid_chart_code(new_chart_code))
                $scope.reset_new_chart_and_close()
            else
                alert("Invalid chart code!")
        } catch (err) {
            console.log(err)
        }
    }

    // validate chart code
    $scope.is_valid_chart_code = (chart_code) => {
        try {
            let lines = chart_code.trim().split("\n");

            if (lines.length < 6 || lines[0].trim() !== "@chart") {
                return false;
            }

            let type = lines[1].trim().toLowerCase();
            if (type !== "line" && type !== "bar") {
                return false;
            }

            let title = lines[2].trim();

            let chart_id_parts = lines[3].trim().split("#");
            let chart_id = chart_id_parts[0].trim();
            let theme = chart_id_parts[1] ? chart_id_parts[1].trim() : "blue";
            // Default theme is blue
            let x_labels = lines[4].trim().split(",")
            let y_values = lines[5].trim().split(",")
            if (x_labels.length != y_values.length)
                return false

            x_labels = x_labels.map(label => label.trim()).join("\n");
            y_values = y_values.map(value => value.trim()).join("\n");

            // Ensure x_labels and y_values are valid
            if (!x_labels || !y_values) {
                return false;
            }

            // Set values to new_chart object
            $scope.new_chart = {
                title: title,
                type: type,
                theme: theme,
                x_labels: x_labels,
                y_values: y_values,
                chart_id: chart_id,
                show: false,
            };
            return true;
        } catch (err) {
            console.log(err)
        }
        return false
    };

    $scope.handle_sort_notebook_change = () => {
        try {
            $scope.handle_group_notebooks()
            $scope.save_data()
        } catch (err) {
            console.log(err)
        }
    }

    // handle group notebooks
    $scope.handle_group_notebooks = () => {
        if ($scope.sort_notebook_selected_item == "date") {
            $scope.grouped_notebooks = $scope.get_grouped_notebooks()
        }

        if ($scope.sort_notebook_selected_item == "title") {
            $scope.grouped_notebooks = $scope.get_grouped_notebooks_title()
        }

        if ($scope.sort_notebook_selected_item == "tag") {
            $scope.grouped_notebooks = $scope.get_grouped_notebooks_tag()
        }


    }

    $scope.get_svg_src = (name) => {
        const svg_path = `./img/icons/${name}.svg`;
        return name ? svg_path : "./img/icons/leaf.fill.svg";
    };

    $scope.return_bar_graph = () => {
        return graph_service.create_bar_graph();
    }




 

    
    // recieve update notebook event from create notebook popup
    $scope.$on('notebooks_updated', function (event, data) {
        try {
            $scope.notebooks = data.notebooks;
            $scope.current_notebook = shared_service.get("current_notebook");
            $scope.pageIcon = $scope.current_notebook.icon
            $scope.pageTitle = $scope.current_notebook.title
        } catch (err) {
            console.log(err)
        }
    });

    //
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
            //broadcast event to open note more options dialog
            //when create note is opened from bottom bar
            shared_service.set("current_note", $scope.CONST.VIEW_CREATE_NOTE)
            $scope.set_view($scope.CONST.VIEW_CREATE_NOTE)
            $scope.$broadcast('open_create_note_popup');
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
                const selected_notes = $scope.notes.filter(n => n.isSelected)
                const unselected_notes = $scope.notes.filter(n => !n.isSelected)
                selected_notes.forEach(note => note.isSelected = false);
                $scope.notes = unselected_notes // current notebooks is also updated by reference
                $scope.current_notebook.taskArray = $scope.notes
                db_service.write_notebook($scope.current_notebook)
                shared_service.set("current_notebook", $scope.current_notebook)
                $scope.is_note_multi_select_on = false;
                $scope.show_toast("Notes removed")
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
        try {
            switch (action) {
                case shared_service.CONST.MOVE:
                    let updated_notebook = notebook_service.move_notes_to_notebook($scope.current_notebook, notebook)
                    shared_service.set("current_notebook", updated_notebook)
                    $scope.is_note_multi_select_on = false
                    break;
                case shared_service.CONST.OPEN:
                    //open notebook
                    $scope.open_notebook(notebook)
                    break;
            }
        } catch (error) {
            console.log("Cannot bulk move completed notes", error);
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

    // init everything
    $scope.init = () => {
        //CONST values
        $scope.CONST = {
            IMPORT: "import",
            EXPORT: "export",
            VIEW_NOTEBOOK: "notebook",
            VIEW_NOTE: "note",
            VIEW_SYSTEM: "system_var",
            VIEW_TAG: "tag",
            VIEW_CREATE_NOTE: "create_note",
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

        // chart component 
        $scope.new_chart = {
            title: "Untitled",
            // title of chart
            type: "line",
            // type of chart
            theme: "red",
            //theme color
            x_labels: "",
            //labels
            y_values: "",
            // values
            chart_id: 0,
            //create id dynamically while saving
            show: false,
        }

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
        $scope.new_var_name = ""
        $scope.new_var_value = ""
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
        $scope.notebooks = [];
        $scope.notes = [];

        $scope.read_data();
        //group notebooks
        $scope.handle_group_notebooks()
        // console.log($scope.notebooks)
        // $scope.show_view = $scope.CONST.VIEW_TAG

    };
}