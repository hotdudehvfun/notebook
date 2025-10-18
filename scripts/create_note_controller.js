function create_note_controller($scope, $rootScope, notebook_service, shared_service, db_service) {

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

    //dialog flag
    $scope.show_dialog = false;
    //listen to close all dialogs event from shared service
    $scope.$on("close_create_note_popup", function (e, data) {
        $scope.show_dialog = false;
    })

    //listen to close all dialogs event from shared service
    $scope.$on("current_notebook_changed", function (e, data) {
        $scope.current_notebook = shared_service.get("current_notebook");
        console.log("current_notebook_updated event received", $scope.current_notebook)
    })

    $scope.close_create_note_dialog = () => {
        $scope.show_dialog = false;
        shared_service.set("current_notebook", $scope.current_notebook);
        shared_service.set("show_view", "note")
    }

    // open create notebook popup
    $scope.$on('open_create_note_popup', function (event, data) {
        console.log("create note dialog is opned")
        //get either quick notes or currently opened notebook
        $scope.current_notebook = $scope.get_current_notebook();
        $scope.current_note = shared_service.get("current_note");
        $scope.show_dialog = true;
        // console.log("current note",$scope.current_note)
        if ($scope.current_note)
            document.getElementById("note_content").value = $scope.current_note.title || "";

        $scope.init_menu();
        shared_service.set("show_view", "create_note")
    });

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
            notebook = notebook_service.get_quick_notes_notebook();
            shared_service.set("current_notebook", notebook);
        }
        return notebook;
    }




    $scope.create_note = () => {
        try {
            // cannot create note in trash notebook
            if ($scope.current_notebook &&
                ($scope.current_notebook.title.toLowerCase() === "trash" || $scope.current_notebook.title.toLowerCase() === "system")) {
                //emit show toast event
                shared_service.set("show_toast", `Cannot create note in this notebook`);
                return;
            }

            // cannot create note in locked notebook
            if ($scope.is_notebook_locked()) {
                shared_service.set("show_toast", `Notebook is locked`);
                return;
            }

            const task_content = document.getElementById("note_content").value.trim();
            if (is_valid_note_content(task_content)) {
                // Create a new task
                const new_task = new Task(task_content);
                new_task.parent_id = $scope.current_notebook.id
                new_task.task_icon = $scope.icons.unchecked;
                new_task.set_is_component();
                new_task.set_component_type();
                let msg = ""
                if ($scope.current_notebook) {
                    // if selected note is not null, we are updating existing note
                    // find and update the note
                    if ($scope.current_note) {
                        let index = $scope.current_notebook.taskArray.findIndex(t => t.id === $scope.current_note.id);
                        if (index !== -1) {
                            $scope.current_notebook.taskArray[index] = new_task;
                        }
                    } else {
                        $scope.current_notebook.taskArray.push(new_task);
                        $scope.notes = $scope.current_notebook.taskArray;
                    }
                }
                //clean up when note is saved
                $scope.show_dialog = false;
                $scope.note_content.value = ""
                document.getElementById("note_content").value = ""
                $scope.current_note = null
                shared_service.set("current_note", null)
                db_service.write_notebook($scope.current_notebook);
                shared_service.set("current_notebook", $scope.current_notebook);
                shared_service.set("show_view", "note")
                shared_service.set("show_toast", `Note saved`);

            } else {
                shared_service.set("show_toast", `Invalid note content`);
            }

        } catch (err) {
            console.error("Error while creating note:", err);
        }
    };
    const is_valid_note_content = (content) =>{
        if(content==null || content==undefined)
            return false
        if(content.length==0)
            return false
        if(content.length>=999)
            return false
    }
    
    $scope.is_notebook_locked = function () {
        return $scope.current_notebook?.is_locked;
    }

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
            icon: "plus.circle",
            class: "chip2",
            show: true,
            action: (item) => {
                console.log("insert menu clicked")
                $rootScope.$broadcast("show_sub_menu", "insert");
            }
        },
        {
            text: "List mode",
            icon: "list.bullet.rectangle",
            class: "chip2",
            show: true,
            action: (item) => {
                $scope.toggle_bottom_bar_active_menu(item.text)
                $scope.current_bottom_bar_active_menu = null;
                $scope.is_list_mode_on = ($scope.bottom_bar_active_menu == item.text)
                $scope.show_toast(`List mode ${bool_to_on_off($scope.is_list_mode_on)} | ${$scope.current_list_symbol}`)
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



    $scope.init = () => {

    }




}