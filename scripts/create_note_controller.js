function create_note_controller($scope, $rootScope, notebook_service, shared_service, db_service) {

    // chart component 
    $scope.new_chart = {
        title: "Untitled",// title of chart
        type: "line",// type of chart
        theme: "red",//theme color
        x_labels: "",//labels
        y_values: "",// values
        chart_id: 0,//create id dynamically while saving
        show: false,
    }

    //icons
    $scope.icons = {
        checked: "radio_button_checked",
        unchecked: "radio_button_unchecked"
    }

    $scope.show_dialog = false;
    $scope.current_notebook = null; // to hold current notebook for more options
    $scope.current_note = null; // to hold current note for edit
    $scope.is_list_mode_on = false; // to check if list mode is on
    $scope.current_list_symbol = "-"; // to hold current list symbol
    $scope.menu = [];
    $scope.note_content_placeholder = "Enter note content here...";
    $scope.show_create_button = true;

    //dialog flag
    $scope.show_dialog = false;
    //listen to close all dialogs event from shared service
    $scope.$on("create_note_popup_changed", function (e, state) {
        if($scope.show_dialog==state)
            return
        console.log("create_note_popup_changed", state)
        $scope.show_dialog = state
        //set current note when edit button is clicked
        $scope.current_note = shared_service.get("current_note")
        $scope.current_notebook = $scope.get_current_notebook();
        console.log("current notebook",$scope.current_notebook)
        //create or edit
        const create_note_source = shared_service.get("create_note_source")
        if (state) {
            if (create_note_source == "edit") {
                //open for edit
                $scope.open_edit_note_popup()
            } else {
                //open for new 
                $scope.note_content = ""
                document.getElementById("note_content").value = ""
                $scope.show_create_button = true;
            }
            $scope.init_menu();
        }
    })



    // open create notebook popup
    $scope.open_edit_note_popup = () => {
        try {
            console.log("edit note dialog is opned")
            $scope.current_notebook = shared_service.get("current_notebook");
            $scope.current_note = shared_service.get("current_note");
            $scope.show_dialog = true;
            if ($scope.current_note)
                document.getElementById("note_content").value = $scope.current_note.title || "";

            $scope.init_menu();
            $scope.show_create_button = false;
        } catch (err) {
            console.log(err)
            $scope.$emit("show_toast", `Failed to edit note`);
        }
    };

    //listen to close all dialogs event from shared service
    // $scope.$on("current_notebook_changed", function (e, data) {
    //     $scope.current_notebook = data
    //     console.log("current_notebook_updated event received", $scope.current_notebook)
    // })

    $scope.close_create_note_dialog = () => {
        $scope.show_dialog = false;
        shared_service.set("current_notebook", $scope.current_notebook);
        shared_service.set("show_view", "note")
        $scope.current_note = null
        shared_service.set("current_note", null)
    }





    //handle create note in which notebook
    $scope.$on("quick_notebook_changed", function (e, d) {
        if (shared_service.get("quick_notebooks_action") == shared_service.CONST.CREATE_NOTE) {
            $scope.current_notebook = shared_service.get("quick_notebook")
        }
    })

    $scope.open_quick_notebooks = function () {
        //if we are editing note, we cannot change notebook
        if ($scope.current_note) {
            $scope.$emit("show_toast", `Cannot change notebook while editing note`);
            return;
        }
        shared_service.set("quick_notebooks_action", shared_service.CONST.CREATE_NOTE)
        $rootScope.$broadcast("show_quick_notebooks")
    }

    $scope.close_dialog = () => {
        $scope.show_dialog = false;
        $scope.note_content.value = ""
        $scope.current_note = null
        shared_service.set("current_note", null)
    };


    //get current notebook or quick notes notebook
    $scope.get_current_notebook = function () {
        let notebook = shared_service.get("current_notebook");
        if (!notebook) {
            console.log("no current notebook, returning quick notes")
            notebook = notebook_service.get_quick_notes_notebook();
            shared_service.set("current_notebook", notebook);
        }
        return notebook;
    }




    $scope.create_note = () => {
        try {
            if (!$scope.current_notebook) {
                shared_service.set("show_toast", `Cannot find notebook`);
                return;
            }
            if ($scope.current_notebook.is_locked) {
                shared_service.set("show_toast", `Cannot create note in locked Notebook`);
                return;
            }
            const task_content = document.getElementById("note_content").value.trim();
            $scope.current_notebook = notebook_service.add_note($scope.current_notebook, task_content);
            console.log($scope.current_notebook)
            //clean up when note is saved
            $scope.note_content.value = ""
            document.getElementById("note_content").value = ""
            shared_service.set("current_notebook", $scope.current_notebook);
            shared_service.set("show_view", "note")
            shared_service.set("show_toast", `Note saved`);
            $scope.show_dialog = false;
        } catch (err) {
            console.error("Error while creating note:", err);
        }
    };


    $scope.edit_note = () => {
        try {
            // cannot create note in trash notebook
            if ($scope.current_notebook.title.toLowerCase() === "trash") {
                shared_service.set("show_toast", `Cannot create note Trash`);
                return;
            }
            if ($scope.current_notebook.title.toLowerCase() === "system") {
                shared_service.set("show_toast", `Cannot create note System`);
                return;
            }
            if (!$scope.current_notebook) {
                shared_service.set("show_toast", `Cannot find notebook`);
                return;
            }

            if (!$scope.current_note) {
                shared_service.set("show_toast", `Cannot find current note`);
                return;
            }

            if ($scope.current_notebook.is_locked) {
                shared_service.set("show_toast", `Cannot create note in locked Notebook`);
                return;
            }

            const task_content = document.getElementById("note_content").value.trim();
            $scope.current_notebook = notebook_service.edit_note($scope.current_notebook, $scope.current_note, task_content);
            //clean up when note is saved
            $scope.note_content.value = ""
            document.getElementById("note_content").value = ""
            shared_service.set("current_notebook", $scope.current_notebook);
            shared_service.set("show_view", "note")
            shared_service.set("show_toast", `Note saved`);
            $scope.show_dialog = false;
        } catch (err) {
            console.error("Error while editing note:", err);
        }
    };






    //bottom bar menu
    $scope.init_menu = () => {
        // call this function when you want to open create note popup
        $scope.menu = [{
            text: "Format",
            show: true,
            action: () => {
                console.log("edit menu clicked");
                $rootScope.$broadcast("show_sub_menu", "format");
            }
        },
        {
            text: "Insert",
            show: true,
            action: (item) => {
                console.log("insert menu clicked")
                $rootScope.$broadcast("show_sub_menu", "insert");
            }
        },
        {
            text: "Charts",
            show: true,
            action: (item) => {
                $scope.open_chart_ui_changed(true)
            }
        },
        ]
    }

    $scope.handle_keypress_note_input = function (e) {
        try {
            var textarea = document.querySelector("#note_content");
            var key = e.key;
            var value = $scope.note_content || "";
            var cursor_pos = textarea.selectionStart;
            var lines = value.substring(0, cursor_pos).split("\n");
            var current_line = lines[lines.length - 1].trimEnd();
            const regex = /^\d+\./;

            // ---- Replace special codes (#today, #now, #day) ----
            if (key === " " || key === "Enter") {
                const codes = {
                    "#today": formatDate(new Date()),
                    "#now": formatTime(new Date()),
                    "#day": formatDay(new Date())
                };
                for (let code in codes) {
                    if (value.includes(code)) {
                        $scope.note_content = value.replace(code, codes[code]);
                    }
                }
            }

            // ---- Auto numbered list logic ----
            // Activate list mode when line starts with "1. "
            // console.log("cl=", current_line, key)
            if (regex.test(current_line) && key === " ") {
                e.preventDefault();
                $scope.auto_num_list_mode_on = true;
                $scope.current_list_symbol = "1.";
                $scope.note_content = value; // keep content unchanged
                console.log($scope.auto_num_list_mode_on)
                return;
            }

            // When Enter pressed in list mode
            if (key === "Enter" && $scope.auto_num_list_mode_on) {
                e.preventDefault();
                const match = current_line.match(/^(\d+)\.\s/);
                const next_num = match ? parseInt(match[1]) + 1 : 1;
                const is_empty_line = !current_line.trim() || /^\d+\.\s*$/.test(current_line);

                if (is_empty_line) {
                    // Exit list mode on blank line
                    $scope.auto_num_list_mode_on = false;
                    insertTextAtCursor("note_content", "\n");
                } else {
                    // Continue list
                    const next_symbol = `${next_num}. `;
                    $scope.current_list_symbol = `${next_num}.`;
                    insertTextAtCursor("note_content", `${next_symbol}`);
                }
            }
            // console.log($scope.note_content)
        } catch (error) {
            console.log("Error in handle_keypress_note_input:", error);
        }
    };

    $scope.get_chart_colors = () => {
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

    $scope.$on("open_chart_edit_window_changed", (e, state) => {
        const code = document.getElementById("note_content").value;
        // console.log(code)
        if ($scope.is_valid_chart_code(code)) {
            $scope.new_chart.show = true;
        } else {
            alert("Chart code invalid.")
        }
    })

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

    $scope.open_chart_ui_changed = (state) => {
        $scope.new_chart.show = state;
    }











}