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
        $scope.show_dialog = true;
        $scope.init_menu();
        shared_service.set("show_view", "create_note")
    });

    
    // open create notebook popup
    $scope.$on('open_edit_note_popup', function (event, data) {
        console.log("edit note dialog is opned")
        $scope.current_notebook = shared_service.get("current_notebook");
        $scope.current_note = shared_service.get("current_note");
        $scope.show_dialog = true;
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
            if ($scope.current_notebook.is_locked) {
                shared_service.set("show_toast", `Cannot create note in locked Notebook`);
                return;
            }

            const task_content = document.getElementById("note_content").value.trim();
            $scope.current_notebook = notebook_service.add_note($scope.current_notebook, task_content);
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