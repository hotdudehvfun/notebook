function main_controller($scope, $timeout, db_service) {

    // custom code of note is parsed to output html content
    $scope.parse_markdown_to_html = function (text) {
        return parseWikiTextToHTML(text)
    }

    $scope.handle_chart_inside_note = function (text) {
        new Chart("myChart", {
            type: "pie",
            data: {
                labels: ["Stocks", "Mutual Funds"],
                datasets: [{
                    backgroundColor: ["red", "blue"],
                    data: [25, 75]
                }]
            },
            options: {
                title: {
                    display: true,
                    text: "Funds"
                }
            }
        });
    }

    //for searching made easy
    // $scope.getTasksOnly = ()=> {
    //     var allTasks = [];
    //     $scope.notebooks.forEach(list => {
    //         allTasks = allTasks.concat(list.notes)
    //     });
    //     //console.log(allTasks);
    //     return allTasks;
    // };


    $scope.notebook_age = () => {
        try {
            if ($scope.current_notebook) {
                let ms = $scope.current_notebook.dateCreated
                return `${timeSince(ms)}`
            }
            return "Notebook is very old"
        } catch (err) {
            console.log("Error while getting notebook age", err)
        }
    }

    $scope.open_notebook = function (notebook) {
        try {
            if (notebook) {
                $scope.pageTitle = notebook.title;
                $scope.pageIcon = $scope.get_notebook_icon(notebook)
                $scope.current_notebook = notebook; // so that we can get age of system notebook
                //show system vars
                if (notebook.title.toLowerCase() == "system") {
                    $scope.show_view = $scope.CONST.VIEW_SYSTEM
                    console.log("opening notebook", notebook)
                    return
                }
                $scope.selectedListIndex = $scope.notebooks.indexOf(notebook);
                $scope.notes = notebook.taskArray;
                $scope.selectedListName = notebook.title;
                $scope.show_delete_list_option = true
                $scope.show_purge_list_option = true
                $scope.show_rename_list_option = true
                $scope.is_note_selected = false;
                $scope.show_edit_options = false;
                $scope.selected_note = undefined
                $scope.show_view = $scope.CONST.VIEW_NOTE

                // to show icon on topbar
                $scope.note_content_placeholder = `Create note in ${$scope.selectedListName}`
                $scope.init_bottom_bar_menu()
                $scope.save_data()
            }
        } catch (err) {
            console.log("Error while opening notebook", err)
        }
    }

    $scope.open_sidebar = function (state) {
        try {
            let left_val = state ? "0px" : "-90vw";
            $scope.sidebar_left = { left: left_val }
            $scope.dialog_flags.is_sidebar_menu_open = state

        } catch (err) {
            console.log("Cannot open side bar", err)
        }
    }
    $scope.set_view = function (view_name) {
        //available views
        /*
            notebooks = list of notebooks
            notes = notes inside notebook
            vars = show list of user defined variables
        */
        $scope.show_view = view_name
        if ($scope.show_view == $scope.CONST.VIEW_NOTEBOOK) {
            //reset icon and title
            $scope.pageTitle = $scope.defaultPageTitle
            $scope.pageIcon = $scope.default_app_icon
            //reset selected note
            $scope.selected_note = undefined;
            $scope.is_note_selected = false;
            //recalculate bottom bar
            $scope.init_bottom_bar_menu()
            //hide any open menu
            $scope.current_bottom_bar_active_menu = null
            //reset selected notebook
            $scope.current_notebook = null
            $scope.selectedListIndex = -1
            //by default quick notes will be used
            $scope.note_content_placeholder = "Create quick note"

        }
    }

    $scope.handle_input_on_rename_notebook = function (e) {
        try {
            if (e.keyCode == 13) {
                $scope.rename_notebook()
            } else {
                $scope.new_notebook_icon = getIconForTitle($scope.new_list_name)
            }
        } catch (err) {
            console.log(err)
        }
    }


    $scope.handle_input_on_notebook = function (e) {
        try {
            if (e.keyCode == 13) {

                $scope.handle_click_on_create_notebook_button()


                e.target.value = "";
            } else {
                $scope.new_notebook_icon = getIconForTitle($scope.new_list_name)
            }
        } catch (err) {
            console.log(err)
        }
    }



    //get notebook icon
    $scope.get_notebook_icon = function (notebook) {
        try {
            if (notebook.hasOwnProperty("is_locked")) {
                if (notebook.is_locked) {
                    return "lock"
                }
            }
            if (notebook.hasOwnProperty("icon")) {
                return notebook.icon
            }
            else {
                return "folder"
            }
        } catch (err) {
            console.log(err)
        }
        return "folder"
    }

    $scope.insertTextAtCursor = function (id, value) {
        insertTextAtCursor(id, value)
    }
    $scope.get_system_var_length = () => {
        try {
            return Object.keys(system_vars).length
        } catch (err) {
            console.log(err)
        }
        return -1;
    }

    $scope.get_notebook_info = function (notebook) {
        try {
            let title = notebook.title
            if (title.toLowerCase() == "system") {
                return $scope.get_system_var_length()
            }
            var completed = notebook.taskArray.filter(function (note) { return note.isTaskCompleted == true }).length;
            if (completed == 0)
                return notebook.taskArray.length;
            return `${completed}/${notebook.taskArray.length}`
        } catch (err) {
            console.log("Failed to get notebook info", err)
        }
    }

    $scope.count_completed_notes = () => {
        var completed = $scope.notes.filter(function (note) { return note.isTaskCompleted == true }).length;
        return completed
    }

    $scope.handle_click_on_create_notebook_button = () => {
        try {
            const title = $scope.new_list_name.trim();
            // Validate notebook name
            if (is_valid_notebook_name(title)) {
                if ($scope.has_notebook(title)) {
                    $scope.show_toast(`${title} notebook already exists`);
                    return;
                }
                // Create the notebook and reset the form
                const created_notebook = $scope.create_notebook(title);
                if (created_notebook) {
                    reset_notebook_form();
                    $scope.show_toast(`Notebook "${title}" created`);
                } else {
                    $scope.show_toast("Failed to create notebook");
                }
            } else {
                $scope.show_toast("Notebook name must be between 2 and 30 characters");
            }
        } catch (err) {
            console.log(err)
        }
    };

    // Helper function to validate the notebook name
    const is_valid_notebook_name = (title) => title.length > 1 && title.length <= 30;

    // Create notebook function
    $scope.create_notebook = (title) => {
        try {
            const new_notebook = new List(title, $scope.new_notebook_icon || "folder");
            $scope.notebooks.push(new_notebook);
            $scope.save_data(); // Save immediately after creation
            return new_notebook;
        } catch (err) {
            console.log("Error while creating notebook:", err);
            return null;
        }
    };

    // Helper function to reset the form after creating a notebook
    const reset_notebook_form = () => {
        $scope.new_list_name = "";
        $scope.new_notebook_icon = "folder";
        $scope.close_all_dialogs();
        //
    };

    $scope.create_note = () => {
        try {
            const task_content = $scope.note_content.trim();

            if (is_valid_note_content(task_content)) {
                // Create a new task
                const new_task = new Task(task_content);
                new_task.task_icon = $scope.icons.unchecked;
                new_task.set_is_component();
                new_task.set_component_type();
                let msg = ""
                if ($scope.current_notebook) {
                    // Add the note to the current notebook
                    $scope.current_notebook.taskArray.push(new_task);
                    $scope.notes = $scope.current_notebook.taskArray;
                    msg = `Note created in ${$scope.current_notebook.title}`
                } else {
                    // Check if "quick notes" notebook exists
                    let quick_notes_notebook = get_or_create_quick_notes();
                    quick_notes_notebook.taskArray.push(new_task);
                    $scope.notes = quick_notes_notebook.taskArray;
                    msg = `Note created in ${quick_notes_notebook.title}`
                }

                reset_note_form();
                $scope.save_data();
                $scope.show_toast(msg);
                $scope.bottom_bar_active_div = 'null'
            } else {
                $scope.show_toast("Invalid note content");
            }
        } catch (err) {
            console.error("Error while creating note:", err);
            $scope.show_toast("Failed to create note");
        }
    };

    // Helper function to get or create the "quick notes" notebook
    const get_or_create_quick_notes = () => {
        let quick_notes_notebook = $scope.notebooks.find(
            (notebook) => notebook.title.toLowerCase() === "quick notes"
        );

        if (!quick_notes_notebook) {
            // Create the "quick notes" notebook if it doesn't exist
            quick_notes_notebook = $scope.create_notebook("quick notes");
        }

        return quick_notes_notebook;
    };

    const is_valid_note_content = (content) => content.length > 0;

    const reset_note_form = () => {
        // Reset input and dialog states
        $scope.note_content = "";
        // $scope.note_textarea_container_height = $scope.note_textarea_container_default_height;
        // $scope.pageTitle = $scope.selectedListName;
    }

    // split selected task in to multiple tasks based on delimiter
    $scope.split_note = (delimiter) => {
        try {
            // show delimiters and on press split task
            // split task based on that delimiter
            console.log(delimiter, $scope.selected_note)
            const taskContent = $scope.selected_note.title.trim();
            delimiter = delimiter == "new line" ? "\n" : delimiter;
            if (taskContent.length > 0) {
                let tasks = split_text_into_tasks(taskContent, delimiter);
                // Determine if adding single or multiple tasks
                tasks = tasks.length > 0 ? tasks : [taskContent];
                // Add tasks to the selected notebook
                tasks.forEach(item => {
                    let newTask = new Task(item);
                    newTask.taskIcon = $scope.icons.unchecked;
                    //set type of note
                    newTask.set_is_component();
                    newTask.set_component_type();
                    $scope.notebooks[$scope.selectedListIndex].taskArray.push(newTask);
                });
                $scope.notes = $scope.notebooks[$scope.selectedListIndex].taskArray;

                // Reset input and dialog states
                $scope.note_content = "";
                // $scope.note_textarea_container_height = $scope.note_textarea_container_default_height;
                $scope.pageTitle = $scope.selectedListName;
                // Save data and show toast notification
                $scope.save_data();
                const toastText = tasks.length > 1 ? `${tasks.length} Notes added` : "Note added";
                $scope.show_toast(toastText);
            }
        } catch (err) {
            console.error(err);
            $scope.show_toast("Failed to split note");
        }
    }

    $scope.get_system_vars = () => {
        let sortedByKey = Object.keys(system_vars)
            .sort() // Sort keys
            .reduce((result, key) => {
                result[key] = system_vars[key];
                return result;
            }, {});
        return sortedByKey
    }




    $scope.init_system_var_menu_items = () => {
        $scope.system_var_menu_items = []
        for (const key in system_vars) {
            if (system_vars.hasOwnProperty(key)) {
                $scope.system_var_menu_items.push(
                    {
                        icon: "calculate",
                        show: true,
                        text: key,
                        action: () => { $scope.insertTextAtCursor('note_content', key) }
                    }
                )
            }
        }
    }

    $scope.edit_var = function (key, value) {
        try {
            $scope.show_delete_system_var_button = true
            $scope.new_var_name = key
            $scope.new_var_value = system_vars[key]
            $scope.system_create_btn_title = "Update"
            //show input area
            $scope.bottom_bar_active_div = "system"

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

    $scope.lock_data = () => {
        try {
            if ($scope.is_notebook_locked()) {
                $scope.show_toast("Notebook is already locked")
                return "";
            }

            if ($scope.password.length == 0) {
                $scope.show_toast("Password is required to lock notebook")
                return "";
            }

            $scope.notes.forEach((data, index) => {
                data.title = encrypt_data(data.title, $scope.password)
            })
            $scope.password = ""
            $scope.notebooks[$scope.selectedListIndex].is_locked = true;
            $scope.pageIcon = "lock"
            $scope.save_data()
            $scope.close_all_dialogs()
            $scope.show_toast("Notebook is locked")
        } catch (err) {
            $scope.show_toast("Cannot lock Notebook")
            console.log("Lock data", err)
        }
    }

    $scope.unlock_data = () => {
        try {
            if ($scope.password.length == 0) {
                $scope.show_toast("Password is required to lock notebook")
                return "";
            }

            if ($scope.is_notebook_locked()) {
                // Test password by decrypting one field without modifying it
                const testDecryption = decrypt_data($scope.notes[0].title, $scope.password);

                if (testDecryption !== null && testDecryption !== "") {
                    // Password is valid, proceed to unlock all notes
                    $scope.notes.forEach((data) => {
                        data.title = decrypt_data(data.title, $scope.password);
                    });
                    $scope.password = "";
                    $scope.notebooks[$scope.selectedListIndex].is_locked = false;
                    $scope.pageIcon = $scope.notebooks[$scope.selectedListIndex].icon
                    $scope.save_data();
                    $scope.close_all_dialogs();
                    $scope.show_toast("Notebook unlocked");
                } else {
                    // Invalid password
                    alert("Invalid password, Try again");
                }
            } else {
                alert("Notebook is already unlocked");
            }
        } catch (err) {
            console.log("Unlock data error:", err);
            alert("An error occurred while unlocking the notebook.");
        }
    };

    $scope.save_theme = () => {
        try {
            $scope.init_theme()
            $scope.save_data()
        } catch (err) {
            console.log("Save theme error:", err);
        }
    }


    $scope.save_data = () => {
        try {
            const _theme = $scope.is_dark ? "dark" : "light";

            db_service.write(
                {
                    notebooks: $scope.notebooks,
                    selectedListIndex: $scope.selectedListIndex,
                    theme: _theme,
                    system_vars: system_vars,
                    notebook_sort_by: $scope.sort_notebook_selected_item,
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
            // console.log("read index",$scope.selectedListIndex)
            system_vars = data.system_vars;
            $scope.theme = data.theme;
            $scope.is_dark = $scope.theme == "dark";
            $scope.init_theme()
            $scope.sort_notebook_selected_item = data.notebook_sort_by
            //set up system notebooks
            $scope.init_system_notebooks()
        } catch (err) {
            console.log("Read data error", err)
        }
    }

    $scope.delete_notebook = () => {
        try {
            if ($scope.current_notebook) {
                if (confirm("Are you sure?")) {
                    $scope.show_toast("Notebook Deleted");
                    let removedList = $scope.notebooks.splice($scope.selectedListIndex, 1);
                    $scope.selectedListIndex = 0
                    if ($scope.notebooks.length != 0) {
                        $scope.open_notebook($scope.notebooks[$scope.selectedListIndex])
                    } else {
                        //all notebooks removed
                        $scope.notes = []
                        $scope.pageTitle = $scope.defaultPageTitle
                    }
                    $scope.close_all_dialogs()
                }
            }
        } catch (err) {
            $scope.show_toast("Failed to delete notebook")
            console.log("Error while deleting notebook", err)
        }
    }

    $scope.handle_tap_on_note = function (note) {
        try {
            $scope.selected_note = note
            // console.log($scope.selected_note)
            $scope.is_note_selected = true
            //show file options when note is selected
            // $scope.show_edit_options = true
            $scope.task_completed_state = note.isTaskCompleted
            //check if we are inside trash
            // console.log($scope.current_notebook)
            $scope.init_note_more_options()
            $scope.init_bottom_bar_menu()

            $scope.dialog_flags.show_note_more_options = true
            // console.log()

        } catch (err) {
            console.log("Error", err)
        }
    }

    $scope.handle_dbl_tap_on_note = function (note) {
        try {
            console.log("dbl click on", note)
            //update note on dbl click
            $scope.open_update_task_popup()

        } catch (err) {
            console.log("Error", err)
        }
    }

    $scope.handle_remove_completed_tasks = () => {
        try {
            if (confirm("Are you sure?")) {
                $scope.notes = $scope.notes.filter(note => !note.isTaskCompleted)
                $scope.notebooks[$scope.selectedListIndex].taskArray = $scope.notes
                $scope.save_data()
                $scope.close_all_dialogs()
                $scope.show_toast("Notes deleted");
            }
        } catch (error) {
            console.log("Cannot remove completed notes", error)
        }
    }

    $scope.start_bulk_move_completed_tasks = () => {
        try {
            //show notebooks quick list
            $scope.dialog_flags.show_quick_notebooks = true
        } catch (error) {
            console.log("Cannot remove completed notes", error)
        }
    }

    //show list of notebooks for quick actions
    $scope.handle_tap_on_quick_notebooks_item = (_notebook) => {
        try {
            //move notebook
            if ($scope.action_on_quick_notebook_item == $scope.CONST.MOVE) {
                $scope.move_selected_notes_to_notebook(_notebook)
                return
            }
            //open notebook
            if ($scope.action_on_quick_notebook_item == $scope.CONST.OPEN) {
                $scope.open_notebook(_notebook)
                $scope.close_all_dialogs()
                return
            }

        } catch (error) {
            console.log("Cannot bulk move completed notes", error);
        }
    };





    // remove selected task
    $scope.delete_task = () => {
        try {
            if (confirm("Are you sure you want to delete the note?")) {
                // Remove the selected task
                $scope.notes = $scope.notes.filter(task => task !== $scope.selected_note);
                $scope.notebooks[$scope.selectedListIndex].taskArray = $scope.notes;

                if ($scope.current_notebook.title.toLowerCase() != 'trash') {
                    const has_trash_notebook = $scope.notebooks.find(notebook => notebook.title.toLowerCase() === "trash");
                    if (has_trash_notebook) {
                        // deleted note gets timestamp of parent notebook timestamp
                        $scope.selected_note.dateCreated = $scope.current_notebook.dateCreated;
                        has_trash_notebook.taskArray.push($scope.selected_note);
                    }
                    $scope.show_toast("Note moved to Trash");
                } else {
                    $scope.show_toast("Note deleted forever");
                }
                $scope.is_note_selected = false;
                $scope.selected_note = null;
                $scope.show_edit_options = false;
                $scope.save_data();
                $scope.close_all_dialogs();
            }
        } catch (err) {
            console.log("Delete error", err)
        }
    };

    $scope.restore_note = () => {
        try {
            if ($scope.current_notebook.title.toLowerCase() == "trash") {
                // console.log($scope.selected_note)
                //first find the parent notebook of selected note
                const parent_notebook = $scope.notebooks.find(notebook => notebook.dateCreated === $scope.selected_note.dateCreated);
                console.log("parent", parent_notebook)

                if (parent_notebook) {
                    // move task from trash to notebook
                    $scope.notes = $scope.notes.filter(task => task !== $scope.selected_note);
                    $scope.notebooks[$scope.selectedListIndex].taskArray = $scope.notes;

                    parent_notebook.taskArray.push($scope.selected_note)
                    $scope.show_toast(`Note moved to ${parent_notebook.title}`);

                    $scope.save_data();
                    // $scope.close_all_dialogs();
                } else {
                    $scope.show_toast("Parent notebook not found");
                }
            }
        } catch (err) {
            console.log("Restore error", err)
        }
    };



    $scope.copy_task = () => {
        try {
            if ($scope.selected_note) {
                //create new task to make a copy
                $scope.copied_task = new Task($scope.selected_note.title)
                //also copy to clipboard
                let dummy = document.createElement("input")
                dummy.setAttribute("type", "text")
                dummy.value = $scope.selected_note.title
                dummy.select()
                dummy.setSelectionRange(0, 99999)
                navigator.clipboard.writeText(dummy.value);
                $scope.show_toast("Note and content copied to clipboard");
                $scope.close_all_dialogs()
            }
        } catch (err) {
            $scope.show_toast("Failed to copy");
            console.log("Error while copying note", err)
        }
    }

    $scope.merge_completed_notes = () => {
        try {
            // Step 1: Filter out completed notes
            const completedNotes = $scope.notes.filter(note => note.isTaskCompleted);
            if (completedNotes.length === 0) {
                $scope.show_toast("No completed notes to merge");
                return;
            }
            // Step 2: Combine their content into a single note
            const mergedContent = completedNotes.map(note => note.title).join("\n\n");

            // Step 3: Create a new merged note
            const mergedNote = new Task(mergedContent)

            // Step 4: Remove completed notes from the notebook
            $scope.notes = $scope.notes.filter(note => !note.isTaskCompleted);
            $scope.notes.push(mergedNote)

            // Step 5: Add the new merged note
            $scope.notebooks[$scope.selectedListIndex].taskArray = $scope.notes;

            // Save and provide feedback
            $scope.save_data();
            $scope.close_all_dialogs();
            $scope.show_toast("Completed notes merged successfully");
        } catch (error) {
            console.error("Cannot merge completed notes", error);
        }
    };




    $scope.paste_task = () => {
        try {
            //append copied task to selected task
            //save selected note position
            $scope.selected_note.title = $scope.selected_note.title.concat(
                "\n", $scope.copied_task.title
            )
            $scope.save_data()
            $scope.close_all_dialogs()
            $scope.copied_task = null;
            $scope.is_note_selected = false;
            $scope.selected_note = null;
            $scope.show_edit_options = false;
            $scope.show_toast("Task pasted")
        } catch (err) {
            $scope.show_toast("Failed to paste")
            console.log("Cannot paste task", err)
        }
    }

    $scope.paste_task_inside_notebook = () => {
        try {
            if ($scope.selectedListIndex >= 0) {
                $scope.notes.push($scope.copied_task);
                $scope.copied_task = null;
                $scope.close_all_dialogs()
                $scope.save_data();
                $scope.show_toast("Task pasted inside notebook")
            }
        } catch (err) {
            $scope.show_toast("Error while pasting inside notebook")
            console.log("Error while pasting inside notebook", err)
        }
    }

    $scope.open_update_task_popup = () => {
        $scope.note_content = $scope.selected_note.title.trim()
        $scope.show_update_task_button = true
        $scope.close_all_dialogs()
        $scope.toggle_bottom_bar_div('note')
    }

    // update task in popup
    $scope.update_note = () => {
        try {
            if ($scope.note_content.trim().length == 0) {
                if (confirm("Note is empty.\nDo you want to delete this note?")) {
                    //delete selected note
                    $scope.delete_task()
                    $scope.bottom_bar_active_div = 'null';
                    $scope.cancel_update_note();
                }
            } else {
                $scope.selected_note.title = $scope.note_content.trim()
                $scope.show_update_task_button = false
                $scope.note_content = ""
                $scope.is_note_selected = false;
                $scope.selected_note = null;
                $scope.show_edit_options = false;
                $scope.save_data()
                $scope.show_toast("Note updated")
                $scope.init_bottom_bar_menu()
                $scope.bottom_bar_active_div = 'null'
            }

        } catch (err) {
            $scope.show_toast("Error while updating note")
            console.log("Error while updating note", err)
        }
    }

    //cancel update note
    $scope.cancel_update_note = () => {
        try {
            console.log("cancel")
            $scope.selected_note = null
            $scope.show_update_task_button = false
            $scope.note_content = ""
            // $scope.note_textarea_container_height = $scope.note_textarea_container_default_height
        } catch (err) {
            console.log("Error while updating note", err)
        }
    }


    //delete all tasks inside notebook:Optimized
    $scope.purge_notebook = () => {
        try {
            if ($scope.selectedListIndex >= 0 && confirm("Are you sure?")) {
                $scope.notebooks[$scope.selectedListIndex].taskArray.length = 0;
                $scope.notes.length = 0;
                $scope.empty_notebook_msg = getRandomItem($scope.proverbs);

                $scope.close_all_dialogs();
                $scope.save_data();
                $scope.show_toast("All tasks removed");
            }
        } catch (err) {
            console.error("Error purging notebook:", err);
        }
    };

    $scope.handle_multi_select_action = (action_code) => {
        //complete action
        if ($scope.CONST.COMPLETE == action_code) {
            $scope.note_multi_select_array.forEach((note, index) => {
                note.isTaskCompleted = true
                note.isSelected = false
            })
            $scope.note_multi_select_array = []
            $scope.is_note_multi_select_on = false
            $scope.save_data()
            return;
        }
        //move action
        if ($scope.CONST.MOVE == action_code) {
            //show quick notebooks
            $scope.dialog_flags.show_quick_notebooks = true;
            $scope.action_on_quick_notebook_item = $scope.CONST.MOVE;
            return;
        }
        // merge
        if ($scope.CONST.MERGE == action_code) {
            try {
                const mergedContent = $scope.note_multi_select_array.map(note => note.title).join("\n\n");
                const mergedNote = new Task(mergedContent)
                //remove notes
                $scope.notes = $scope.notes.filter(note => !$scope.note_multi_select_array.includes(note));
                $scope.notes.push(mergedNote)
                $scope.notebooks[$scope.selectedListIndex].taskArray = $scope.notes;
                $scope.save_data();
                $scope.show_toast("Notes merged");
                $scope.note_multi_select_array = []
                $scope.is_note_multi_select_on = false
            } catch (error) {
                console.error("Cannot merge completed notes", error);
            }
            return;
        }
        //remove action
        if ($scope.CONST.REMOVE == action_code) {
            try {
                //remove notes
                $scope.notes = $scope.notes.filter(note => !$scope.note_multi_select_array.includes(note));
                $scope.notebooks[$scope.selectedListIndex].taskArray = $scope.notes;
                $scope.save_data()
                $scope.show_toast("Notes removed");
                $scope.note_multi_select_array = []
                $scope.is_note_multi_select_on = false
            } catch (error) {
                console.error(error);
            }
            return;
        }
        //cancel 
        if ($scope.CONST.CANCEL == action_code) {
            try {
                $scope.note_multi_select_array.forEach(item => item.isSelected = false)
                $scope.note_multi_select_array = []
                $scope.is_note_multi_select_on = false
            } catch (error) {
                console.error(error);
            }
        }
    }

    $scope.move_selected_notes_to_notebook = (_notebook) => {
        try {
            //remove selected props
            $scope.note_multi_select_array.forEach(note => note.isSelected = false);
            //push notes to selected notebook
            _notebook.taskArray.push(...$scope.note_multi_select_array);
            var destination_notebook_index = $scope.notebooks.indexOf(_notebook)
            if (destination_notebook_index != -1)
                $scope.notebooks[destination_notebook_index] = _notebook

            console.log(
                $scope.notebooks[destination_notebook_index] = _notebook
            )

            //remove selected notes from current notebook
            $scope.notes = $scope.notes.filter(note => !$scope.note_multi_select_array.includes(note));
            $scope.notebooks[$scope.selectedListIndex].taskArray = $scope.notes

            $scope.save_data();
            $scope.close_all_dialogs();
            $scope.show_toast(`${$scope.note_multi_select_array.length} notes moved to ${_notebook.title}`);
            $scope.note_multi_select_array = []
            $scope.is_note_multi_select_on = false
        } catch (err) {
            console.log(err)
        }
    }

    $scope.handle_tap_on_note_checkbox = (note) => {
        if ($scope.is_note_multi_select_on) {
            if (note.isSelected) {
                $scope.note_multi_select_array.push(note)
            }
            else {
                //remove note
                const index = $scope.note_multi_select_array.indexOf(note);
                if (index > -1) {
                    $scope.note_multi_select_array.splice(index, 1);
                }
            }
            console.log($scope.note_multi_select_array)
        } else {
            //when multi select is off 
            // just complete notes
            $scope.toggle_note_completed_state(note);
        }
    }

    $scope.toggle_note_completed_state = function (note) {
        if (note) {
            note.isTaskCompleted = !note.isTaskCompleted;
            note.taskIcon = note.isTaskCompleted ? $scope.icons.checked : $scope.icons.unchecked;
            $scope.save_data();
            // $scope.close_all_dialogs()
        }
    }

    $scope.nav_more_vert_icon = () => {
        return $scope.dialog_flags.show_list_more_options ? "close" : "more_horiz";
    }

    $scope.app_size = () => {
        try {
            let totalSize = 0;
            for (let i = 0; i < localStorage.length; i++) {
                let key = localStorage.key(i);
                let value = localStorage.getItem(key);
                totalSize += key.length + value.length;
            }
            return `${(totalSize / 1024).toFixed(2)} kb`
        } catch (err) {
            console.log("App size error", err)
        }
    }


    $scope.init_theme = () => {
        if ($scope.is_dark) {
            document.querySelector("#theme-color").setAttribute("content", "#272727")
        } else {
            document.querySelector("#theme-color").setAttribute("content", "#ffffff")
        }
    }



    $scope.load_last_notebook = () => {
        //check number of notebooks
        // let old_list_index = localStorage.selectedListIndex || 0;
        // if (old_list_index < 0)
        //     old_list_index = 0
        // console.log($scope.selectedListIndex)
        // $scope.open_notebook($scope.selectedListIndex)
    };


    $scope.handle_click_on_notebook_title = () => {
        try {
            //close all dialogs
            $scope.close_all_dialogs()
            //open quick notebooks
            $scope.dialog_flags.show_quick_notebooks = true
            $scope.action_on_quick_notebook_item = $scope.CONST.OPEN
        } catch (error) {
            console.log(error)
        }
    }

    $scope.handle_click_on_more_vert = () => {
        if ($scope.current_notebook) {
            $scope.close_all_dialogs();
            $scope.init_notebook_more_options()
            $scope.dialog_flags.show_list_more_options = true
        }
    }

    $scope.auto_insert = (e) => {
        try {
            let textarea = document.querySelector("#note_content")
            const cursorPos = textarea.selectionStart;
            const textBefore = textarea.value.substring(0, cursorPos);
            const textAfter = textarea.value.substring(cursorPos);

            // Get the current line
            const lines = textBefore.split("\n");
            const currentLine = lines[lines.length - 1];

            // Check if the current line starts with $
            if (currentLine.trimStart().startsWith("$")) {
                e.preventDefault(); // Prevent default Enter behavior

                // Insert a newline and $ on the next line
                const newText = textBefore + "\n$" + textAfter;
                textarea.value = newText;

                // Move the cursor to the new line after the $
                textarea.selectionStart = textarea.selectionEnd = cursorPos + 2;

                console.log(textarea.value)


            }
        } catch (error) {
            console.log(error)
        }
    }

    $scope.handle_keypress_note_input = function (e) {
        try {
            let textarea = document.querySelector("#note_content")
            if (e.keyCode == 32 || e.keyCode == 13) {
                //#today #now #day
                var codes = {
                    "#today": formatDate(new Date()),
                    "#now": formatTime(new Date()),
                    "#day": formatDay(new Date())
                };

                for (var code in codes) {
                    if ($scope.note_content.includes(code)) {
                        $scope.note_content = $scope.note_content.replace(code, codes[code]);
                    }
                }
                if (e.keyCode == 13) {
                    // $scope.note_textarea_container_height = Math.min(textarea.scrollHeight + 30, $scope.note_textarea_container_max_height)
                    if ($scope.is_list_mode_on)
                        $scope.insertTextAtCursor('note_content', $scope.current_list_symbol + " ") //insert space
                }

            }
        } catch (error) {
            console.log(error)
        }
    }

    $scope.handle_select_notebooks = () => {
        $scope.select_notebooks = !$scope.select_notebooks
        $scope.select_notebooks_menu_text = $scope.select_notebooks ? "Cancel Selection" : "Select Notebooks";
        $scope.dialog_flags.show_list_more_options = false
    }

    $scope.notebook_selected_state = function (index) {
        //return checked and unchecked icon based on selection state
        if ($scope.is_notebook_selected(index)) {
            return $scope.icons.checked
        }
        return $scope.icons.unchecked
    }

    $scope.is_notebook_selected = function (notebook_index) {
        return $scope.selected_notebooks.indexOf(notebook_index) != -1
    }

    $scope.delete_selected_notebooks = () => {
        // Sort the selected notebooks in descending order to avoid index issues while removing
        $scope.selected_notebooks.sort((a, b) => b - a);

        // Remove each selected notebook from notebooks
        $scope.selected_notebooks.forEach((index) => {
            $scope.notebooks.splice(index, 1);
        });

        // Optionally, clear the selected notebooks array
        $scope.selected_notebooks = [];
        $scope.select_notebooks = false
        $scope.select_notebooks_menu_text = "Select Notebooks"
        $scope.dialog_flags.show_list_more_options = false
        $scope.save_data();
    };

    $scope.get_total = () => {
        try {
            let total_tasks = 0, total_notebooks = $scope.notebooks.length
            // console.log($scope.notebooks)
            $scope.notebooks.forEach((item, index) => {
                total_tasks += item["taskArray"].length;
            })
            return {
                "total_tasks": total_tasks,
                "total_notebooks": total_notebooks
            }
        } catch (err) {
            console.log("Error while getting total", err)
        }
    }

    $scope.get_notebooks_list = () => {
        let notebooks = $scope.notebooks.map(function (listItem) {
            return listItem.title;
        });
        notebooks = notebooks.filter((list) => list.toLocaleLowerCase() != "system")
        // console.log(notebooks)
        return notebooks
    };

    $scope.update_selected_list_index = function (key) {
        $scope.selectedListIndex = key
        $scope.selectedListName = $scope.notebooks[$scope.selectedListIndex].title;
        console.log("Selected notebook", $scope.selectedListIndex)
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
        $scope.bottom_bar_active_div = 'null';
        $scope.save_data();
    }

    $scope.open_create_new_note_popup = () => {
        if ($scope.selectedListName.toLowerCase() == "trash") {
            return $scope.show_toast("Cannot create note inside Trash");
        }
        if ($scope.selectedListName.toLowerCase() == "system") {
            return $scope.show_toast("Cannot create note inside System");
        }

        $scope.close_all_dialogs()
        $scope.dialog_flags.show_create_task_popup = true
        $scope.note_content = ""
        // document.querySelector("#note_content").style.height = `${$scope.textarea_default_height}px`
        document.querySelector("#note_content").focus();
        //we are in a notebook
        if ($scope.selectedListIndex >= 0)
            $scope.show_select_notebooks_dropdown = false
        else
            $scope.show_select_notebooks_dropdown = true
    }


    $scope.handle_rename_notebook = () => {
        try {
            $scope.close_all_dialogs()
            $scope.dialog_flags.show_rename_notebook_popup = true
            $scope.focus_input("#rename-notebook")
        } catch (err) {
            console.log(err)
        }
    }

    $scope.rename_notebook = () => {
        try {
            if (!$scope.new_list_name) {
                return $scope.show_toast("Error: Input required");
            }

            if ($scope.new_list_name.toLocaleLowerCase() === "system") {
                return $scope.show_toast("Error: System title is reserved");
            }

            if ($scope.selectedListIndex < 0) {
                return $scope.show_toast("Error: No list is selected");
            }

            // Update title and icon
            let selectedList = $scope.notebooks[$scope.selectedListIndex];
            selectedList.title = $scope.new_list_name;
            selectedList.icon = $scope.new_notebook_icon;
            $scope.notebooks[$scope.selectedListIndex] = selectedList

            // Save data and close popup
            $scope.new_notebook_icon = "folder" //reset new notebook icon
            $scope.save_data();
            $scope.close_all_dialogs()


            // Update selected list and page title
            $scope.selectedListName = $scope.new_list_name;
            $scope.pageTitle = $scope.new_list_name;

            // Clean up
            $scope.new_list_name = "";
            $scope.show_toast("Notebook renamed");
        } catch (err) {
            $scope.show_toast("Exception occurred while renaming notebook");
            console.error("Error while renaming notebook", err);
        }
    }

    $scope.notebook_has_completed_tasks = () => {
        try {
            if ($scope.selectedListIndex >= 0 && $scope.notes.length > 0) {
                const hasCompletedTasks = $scope.notes.some(note => note.isTaskCompleted === true);
                return hasCompletedTasks;
            }
            return false;

        } catch (err) {
            console.log(err)
        }
    }


    $scope.is_notebook_locked = () => {
        try {
            if ($scope.current_notebook) {
                $scope.current_notebook = $scope.notebooks[$scope.selectedListIndex]
                if ($scope.current_notebook.hasOwnProperty("is_locked")) {
                    return $scope.current_notebook.is_locked
                }
            }
            return false
        } catch (err) {
            console.log(err)
        }
    }
    //notebook menu
    $scope.init_notebook_more_options = () => {
        if ($scope.current_notebook) {
            $scope.notebook_more_options = [
                {
                    text: $scope.is_notebook_locked() ? "Unlock notebook" : "Lock notebook",
                    icon: "password",
                    class: "task-more-options-item",
                    show: true,
                    action: () => {
                        $scope.close_all_dialogs();
                        $scope.dialog_flags.show_password_popup = true;
                        $scope.focus_input("#password")
                    }
                }, {
                    text: "Paste Task",
                    icon: "content_paste",
                    class: "task-more-options-item",
                    show: $scope.copied_task != null,
                    action: () => { $scope.paste_task_inside_notebook() }
                }, {
                    text: "Rename notebook",
                    icon: "format_color_text",
                    class: "task-more-options-item",
                    show: true,
                    action: () => { $scope.handle_rename_notebook() }
                }, {
                    text: "Move completed tasks",
                    icon: "flight_takeoff",
                    class: "task-more-options-item",
                    show: $scope.notebook_has_completed_tasks(),
                    action: () => { $scope.start_bulk_move_completed_tasks() }
                }, {
                    text: "Merge completed tasks",
                    icon: "merge",
                    class: "task-more-options-item",
                    show: $scope.notebook_has_completed_tasks(),
                    action: () => { $scope.merge_completed_notes() }
                }, {
                    text: "Remove completed tasks",
                    icon: "delete_sweep",
                    class: "task-more-options-item",
                    show: $scope.notebook_has_completed_tasks(),
                    action: () => { $scope.handle_remove_completed_tasks() }
                },
                {
                    text: "Refresh",
                    icon: "autorenew",
                    class: "task-more-options-item",
                    show: true,
                    action: () => { location.reload(); }
                }, {
                    text: "Delete all tasks",
                    icon: "warning",
                    class: "task-more-options-item text-red-500",
                    show: true,
                    action: () => { $scope.purge_notebook() }
                },
                {
                    text: "Delete notebook",
                    icon: "delete",
                    class: "task-more-options-item text-red-500",
                    show: true,
                    action: () => { $scope.delete_notebook() }
                },
                {
                    text: "Close",
                    icon: "cancel",
                    class: "task-more-options-item text-red-500",
                    show: true,
                    action: () => { $scope.close_all_dialogs() }
                }
            ]
        }
    }


    //file menu items
    $scope.init_note_more_options = () => {
        try {
            $scope.is_trash_open = ($scope.current_notebook.title.toLowerCase() == "trash")
            $scope.note_more_options = [
                {
                    text: "Update note",
                    icon: "edit",
                    class: "task-more-options-item",
                    show: true,
                    action: () => { $scope.open_update_task_popup() }
                },
                {
                    text: "Toggle complete",
                    icon: "radio_button_checked",
                    class: "task-more-options-item",
                    show: true,
                    action: () => {
                        $scope.selected_note.isTaskCompleted = !$scope.selected_note.isTaskCompleted
                        $scope.selected_note.taskIcon = $scope.selected_note.isTaskCompleted ? "radio_button_checked" : "radio_button_unchecked";
                        $scope.save_data();
                        $scope.close_all_dialogs();
                    }
                }, {
                    text: "Select notes",
                    icon: "check_box",
                    class: "task-more-options-item",
                    show: true,
                    action: () => {
                        $scope.is_note_multi_select_on = true
                        $scope.show_note_complete_button = false
                        $scope.close_all_dialogs();
                    }
                }, {
                    text: "Restore note",
                    icon: "restore_from_trash",
                    class: "task-more-options-item",
                    show: $scope.is_trash_open,
                    action: () => { $scope.restore_note() }
                }, {
                    text: "Copy note",
                    icon: "file_copy",
                    class: "task-more-options-item",
                    show: true,
                    action: () => {
                        $scope.copy_task();

                    }
                }, {
                    text: "Paste inside note",
                    icon: "content_paste",
                    class: "task-more-options-item",
                    show: $scope.copied_task != null,
                    action: () => {
                        $scope.paste_task()

                    }
                }, {
                    text: "Split note",
                    icon: "splitscreen",
                    class: "task-more-options-item",
                    show: true,
                    action: () => {
                        $scope.split_note("new line")
                        $scope.save_data()
                        $scope.close_all_dialogs()
                    }
                }, {
                    //hide delete button when split submenu is open
                    //submenu is better than popup
                    text: "Delete note",
                    icon: "delete",
                    class: "task-more-options-item",
                    show: !$scope.show_split_note_btns,
                    action: () => {
                        $scope.delete_task()

                    }
                }
            ]
        } catch (err) {
            console.log("Error while init more options", err)
        }
    }

    //insert menu items
    $scope.prepare_insert_menu_items = () => {
        try {
            $scope.insert_menu_items =
                [
                    {
                        text: "📆 Today",
                        action: () => {
                            $scope.insertTextAtCursor('note_content', formatDate(new Date()))
                        }
                    },
                    {
                        text: "📆 Day",
                        action: () => {
                            $scope.insertTextAtCursor('note_content', formatDay(new Date()))
                        }
                    },
                    {
                        text: "📆 Now",
                        action: () => {
                            $scope.insertTextAtCursor('note_content', formatTime(new Date()))
                        }
                    },
                    {
                        text: "📝 Heading",
                        action: () => {
                            $scope.insertTextAtCursor('note_content', "#H1")
                        }
                    },
                    {
                        text: "✏️ Highlight",
                        action: () => {
                            $scope.insertTextAtCursor('note_content', "!important!")
                        }
                    },
    
                    {
                        text: "✅ List",
                        action: () => {
                            $scope.insertTextAtCursor('note_content', "* Item")
                        }
                    },
                    {
                        text: "📈 Progress bar",
                        action: () => {
                            $scope.insertTextAtCursor('note_content', "#50%")
                        }
                    },
                    {
                        text: "🧩 Split notes",
                        action: () => {
                            $scope.insertTextAtCursor('note_content', "$ ")
                        }
                    },
                    {
                        text: "🗄️ Table",
                        action: () => {
                            $scope.insertTextAtCursor('note_content', "@table\n||a,b\n|c,d")
                        }
                    },
                    {
                        text: "🍕 Chart",
                        action: () => {
                            //open chart dialog
                            $scope.new_chart.show = true;
                        }
                    },
                    {
                        text: "📖 Circular Progress",
                        action: () => {
                            $scope.insertTextAtCursor('note_content', `@circular_bars\nA, B, C\n50, 50, 50`)
                        }
                    },
                ]
            return $scope.insert_menu_items;
        } catch (error) {
            console.log(error)
        }
    }


    //component menu
    $scope.prepare_component_menu_items = () => {
        try {
            $scope.component_menu_items = [
                {
                    text: "🤖 Robot",
                    action: () => {
                    }
                }, 
                {
                    text: "📊 Edit chart",
                    action: () => {
                        if ($scope.is_valid_chart_code($scope.note_content)) {
                            $scope.new_chart.show = true;
                        } else {
                            alert("Invalid chart code!");
                        }
                    }
                }, 
                {
                    text: "✅ Selection to bullets",
                    action: () => {
                        $scope.add_symbol_to_selected_text("-");
                    }
                }, 
                {
                    text: "✅ All to bullets",
                    action: () => {
                        $scope.convert_to_bullets("-");
                    }
                },
                {
                    text: "🔠 Heading with bullets",
                    action: () => {
                        $scope.convert_heading_with_bullets();
                    }
                }, 
                {
                    text: "🔢 Selection to numbered list",
                    action: () => {
                        $scope.add_numbers_to_selected_text();
                    }
                }
            ];
        } catch (error) {
            console.log(error);
        }
    }
    

    //bottom bar menu
    $scope.init_bottom_bar_menu = () => {
        $scope.bottom_bar_menu = [
            {
                text: "List mode",
                icon: "list_alt",
                class: "chip2",
                show: true,
                action: (item) => {
                    $scope.toggle_bottom_bar_active_menu(item.text)
                    $scope.current_bottom_bar_active_menu = null;
                    $scope.is_list_mode_on = ($scope.bottom_bar_active_menu == item.text)
                    $scope.show_toast(`List mode ${bool_to_on_off($scope.is_list_mode_on)} | ${$scope.current_list_symbol}`)
                }
            }
        ]
    }
    // handle bottom bar menu click
    $scope.toggle_bottom_bar_active_menu = (menu_id) => {
        $scope.bottom_bar_active_menu = $scope.bottom_bar_active_menu === menu_id ? "null" : menu_id;
    }

    $scope.handle_db_operation_change = () => {
        try {
            if ($scope.db_operation == $scope.CONST.EXPORT) {
                let data = JSON.stringify(localStorage)
                $scope.db_textarea = data
                $scope.password = ""
            } else {
                $scope.db_textarea = ""
            }

        } catch (err) {
            // $scope.show_toast("Cannot export file")
            console.error(err);
        }
    }

    $scope.export_db_as_file = function (textContent) {
        try {
            if ($scope.password.length == 0) {
                alert("Protect this file with a password to continue")
                return "";
            }
            if (textContent.length == 0) {
                alert("Text is missing")
                return "";
            }
            textContent = encrypt_data(textContent, $scope.password)
            $scope.password = ""
            const blob = new Blob([textContent], { type: "text/plain" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "myTextFile.txt";
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (err) {
            console.log("Error export db", err)
            $scope.show_toast("Cannot export file")
        }
    }

    // sending message to angular from outside world
    $scope.$on('update_db_textarea', function (event, newValue) {
        $scope.db_textarea = newValue;
    });

    // sending message to angular from outside world
    $scope.$on('update_note_content_from_outside', function (event, newValue) {
        $scope.note_content = newValue;
        console.log($scope.note_content)
    });


    // sending message to angular from outside world
    $scope.$on('broadcast_right_swipe', function (event, touch) {
        //open notebook when start x is near left end of screen
        let left_screen_limit = window.screen.width * 0.30
        if (touch.x.start < left_screen_limit) {
            $scope.open_sidebar(true)
            $scope.$apply();
        }
    });

    $scope.copy_to_clipboard = function (textToCopy) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                $scope.show_toast("Copied to clipboard!");
            }).catch(function (err) {
                $scope.show_toast("Failed to copy text to clipboard.");
                console.error("Could not copy text: ", err);
            });
        }
    }



    $scope.import_data = () => {
        try {
            if ($scope.db_operation != $scope.CONST.IMPORT) {
                $scope.show_toast("Operation not selected")
                return ""
            }

            if ($scope.db_textarea.length == 0) {
                $scope.show_toast("Missing text")
                return ""
            }

            $scope.db_textarea = $scope.unlock_file()
            if (!is_valid_json($scope.db_textarea)) {
                $scope.show_toast("Invalid JSON code")
                return ""
            }

            if (confirm("Overwrite everything with new data?")) {
                let data = JSON.parse($scope.db_textarea)
                Object.keys(data).forEach(key => {
                    localStorage.setItem(key, data[key]);
                });
                $scope.show_toast("Import Successful");
                $scope.db_textarea = "";
                $scope.db_operation = null;
                $scope.close_all_dialogs()
                $scope.notebooks = $scope.read_data()
            }
        }
        catch (err) {
            $scope.show_toast("Failed to import data.");
            console.error("Failed to import data.", err);
        }
    }

    $scope.unlock_file = () => {
        try {
            if ($scope.password.length > 0) {
                const testDecryption = decrypt_data($scope.db_textarea, $scope.password);
                if (testDecryption !== null && testDecryption !== "") {
                    $scope.password = "";
                    return testDecryption
                }
            }
            return -1
        } catch (err) {

        }
    };

    $scope.handle_note_edit_option_change = () => {
        if ($scope.note_edit_selected_option) {
            $scope.insertTextAtCursor("note_content", $scope.note_edit_selected_option)
        }
    }

    $scope.is_any_dialog_open = () => {
        // console.log($scope.dialog_flags)
        return Object.values($scope.dialog_flags).some(flag => flag);
    };

    $scope.close_all_dialogs = () => {
        try {
            $scope.open_sidebar(false)
            for (let key in $scope.dialog_flags) {
                if ($scope.dialog_flags.hasOwnProperty(key)) {
                    $scope.dialog_flags[key] = false;
                }
            }
        } catch (err) {
            console.log(err)
        }
    };

    $scope.init_system_notebooks = () => {
        //notebooks must contain System and Trash notebooks
        //System 2nd last, Trash at last
        let sys_i = -1, trash_i = -1
        $scope.notebooks.forEach((notebook, index) => {
            if (notebook.title.toLowerCase() == "system")
                sys_i = index;
            if (notebook.title.toLowerCase() == "trash")
                trash_i = index;
        })
        if (sys_i == -1) {
            $scope.notebooks.push(new List("System", "keyboard_command_key"))
        }
        if (trash_i == -1) {
            $scope.notebooks.push(new List("Trash", "recycling"))
        }
    }

    // sort notes and notebooks: Optimized
    $scope.init_sortable_list = function (selector, array_name) {
        //notes and notebooks
        $scope[`sortable-${array_name}`] = Sortable.create(document.querySelector(selector), {
            animation: 250,
            dragClass: "sortable-drag",
            handle: ".handle",
            onEnd: function (evt) {
                if (evt.newIndex != evt.oldIndex) {
                    //swap items
                    const [movedItem] = $scope[array_name].splice(evt.oldIndex, 1);
                    $scope[array_name].splice(evt.newIndex, 0, movedItem);
                    $scope.save_data()
                }
            }
        })
    }

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
                console.log("clear toast")
            }, 2000)
        }
    }




    $scope.toggle_data_lock = () => {
        if (!$scope.is_data_locked) {
            $scope.lock_data()
        } else {
            $scope.unlock_data()
        }
        $scope.is_data_locked = !$scope.is_data_locked;
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
        if (notebook.hasOwnProperty('is_locked')) {
            //toggle lock
        } else {
            //create property lock
        }
    }

    $scope.choose_create_btn = (pos) => {
        let toast_txts = ["Creat notes", "Create notebook", "System vars"]
        if (!$scope.show_all_create_btns) {
            //open all so user can choose
            // $scope.create_btns_arr = [true,true,true]
            $scope.show_all_create_btns = true
        } else {
            //all are open now user can choose one
            $scope.create_btns_arr = [false, false, false]
            $scope.create_btns_arr[pos] = true
            $scope.show_toast(toast_txts[pos])
            $scope.show_all_create_btns = false
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



    $scope.toggle_bottom_bar_div = (divId) => {
        $scope.bottom_bar_active_div = $scope.bottom_bar_active_div === divId ? "null" : divId;
        if (divId == 'note') {
            $scope.init_bottom_bar_menu()
            $scope.prepare_insert_menu_items()
            $scope.prepare_component_menu_items()
            $scope.focus_input("#note_content")
        }
    }

    $scope.get_note_content_placeholder = () => {
        if ($scope.current_notebook) {
            return `Create note in <div class='inline orange bold'>${$scope.current_notebook.title}</div>`
        }
        return "Create quick note"
    }

    $scope.has_notebook = (notebook_name) => {
        return $scope.notebooks.find(notebook => notebook.title.toLowerCase() === notebook_name.toLowerCase())
    }

    $scope.focus_input = (selector) => {
        $timeout(function () {
            document.querySelector(selector)?.focus();
        }, 0);
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
                } else if (
                    created_date.getFullYear() === today.getFullYear() &&
                    created_date.getMonth() === today.getMonth()
                ) {
                    groups['This Month'].push(notebook);
                } else {
                    let month_year = created_date.toLocaleString('default', { month: 'long', year: 'numeric' });
                    if (!groups['Older'][month_year]) {
                        groups['Older'][month_year] = [];
                    }
                    groups['Older'][month_year].push(notebook);
                }
            });
            console.log(groups)
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
                firstChar = "#"; // Group non-alphabetic titles under "#"
            }

            if (!grouped[firstChar]) {
                grouped[firstChar] = [];
            }

            grouped[firstChar].push(notebook);
        });

        // Sort groups alphabetically
        let sortedGroups = Object.keys(grouped).sort((a, b) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)));

        let sortedGroupedNotebooks = {};
        sortedGroups.forEach(key => {
            sortedGroupedNotebooks[key] = grouped[key];
        });

        console.log(sortedGroupedNotebooks)

        return sortedGroupedNotebooks;
    };






    // Watch for changes in notebooks array
    $scope.$watch('notebooks', function (new_val, old_val) {
        if (new_val !== old_val) {
            //group notebook
            $scope.handle_group_notebooks()
        }
    }, true);


    $scope.convert_heading_with_bullets = function () {
        try {
            let textarea = document.getElementById("note_content");
            if (!textarea) return;

            let lines = textarea.value.trim().split("\n");
            if (lines.length === 0) return;

            // Convert first line to H2
            lines[0] = "### " + lines[0];

            // Convert remaining lines to bullet points
            for (let i = 1; i < lines.length; i++) {
                lines[i] = "- " + lines[i];
            }

            $scope.note_content = lines.join("\n");
        } catch (err) {
            console.log(er)
        }
    };

    $scope.convert_to_bullets = function (symbol) {
        try {
            let textarea = document.getElementById("note_content");
            if (!textarea) return;
            let lines = textarea.value.trim().split("\n");
            if (lines.length === 0) return;
            for (let i = 0; i < lines.length; i++) {
                lines[i] = `${symbol} ${lines[i]}`
            }
            $scope.note_content = lines.join("\n");
        } catch (err) {
            console.log(er)
        }
    };





    $scope.add_symbol_to_selected_text = function (symbol) {
        let textarea = document.getElementById("note_content");
        if (!textarea) return;

        let start = textarea.selectionStart;
        let end = textarea.selectionEnd;
        let text = textarea.value;

        if (start === end) return; // No selection

        let selected_text = text.substring(start, end);
        let modified_text = selected_text
            .split("\n")
            .map(line => symbol + " " + line)
            .join("\n");

        // Replace selected text with modified text
        let new_text = text.substring(0, start) + modified_text + text.substring(end);

        // Update textarea
        textarea.value = new_text;
        textarea.setSelectionRange(start, start + modified_text.length);

        $scope.note_content = new_text;
    };


    // add 1. 2. 3. ...
    $scope.add_numbers_to_selected_text = function () {
        let textarea = document.getElementById("note_content");
        if (!textarea) return;

        let start = textarea.selectionStart;
        let end = textarea.selectionEnd;
        let text = textarea.value;

        if (start === end) return; // No selection

        let selected_text = text.substring(start, end);
        let modified_text = selected_text
            .split("\n")
            .map((line, index) => (index + 1) + ". " + line)
            .join("\n");

        // Replace selected text with modified text
        let new_text = text.substring(0, start) + modified_text + text.substring(end);

        // Update textarea
        textarea.value = new_text;
        textarea.setSelectionRange(start, start + modified_text.length);

        $scope.note_content = new_text;
    };


    $scope.get_chart_colors = () => {
        // let colors = Object.keys(CHART_COLORS)
        // colors.forEach((item,index)=>{
        //     item[0] = item[1] //bg
        //     item[1] = get_transparent_color(item[0])//transparent
        // })
        return CHART_COLORS
    }
    $scope.get_transparent_color = (rgb, alpha) => {
        return util_get_transparent_color(rgb, alpha)
    }

    $scope.reset_new_chart_and_close = () => {
        //reset values
        $scope.new_chart = {
            title: "Untitled", // title of chart
            type: "line", // type of chart
            theme: "red", //theme color
            x_labels: "", //labels
            y_values: "", // values
            chart_id: 0, //create id dynamically while saving
            show: false,
        }
    }
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
            let theme = chart_id_parts[1] ? chart_id_parts[1].trim() : "blue"; // Default theme is blue
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


    $scope.handle_select_menu_change = () => {
        try {
            $scope.bottom_bar_sub_menu_selected_item.action()
        } catch (err) {
            console.log(err)
        }
    }

    $scope.handle_select_system_menu_change = () => {
        try {
            $scope.insertTextAtCursor('note_content', $scope.bottom_bar_sub_menu_selected_item)
        } catch (err) {
            console.log(err)
        }
    }

    $scope.handle_sort_notebook_change = () => {
        try {
            $scope.handle_group_notebooks()
            $scope.save_data()
        } catch (err) {
            console.log(err)
        }
    }

    $scope.handle_group_notebooks = () => {
        if ($scope.sort_notebook_selected_item == "date") {
            $scope.grouped_notebooks = $scope.get_grouped_notebooks()
        }

        if ($scope.sort_notebook_selected_item == "title") {
            $scope.grouped_notebooks = $scope.get_grouped_notebooks_title()
        }
    }





    $scope.init = () => {
        //CONST values
        $scope.CONST = {
            IMPORT: "import",
            EXPORT: "export",
            VIEW_NOTEBOOK: "notebook",
            VIEW_NOTE: "note",
            VIEW_SYSTEM: "system_var",
            COMPLETE: 1,
            MOVE: 2,
            MERGE: 3,
            REMOVE: 4,
            OPEN: 5,
            CANCEL: 6
        }

        //dialog flags
        $scope.dialog_flags = {
            is_sidebar_menu_open: false,
            show_list_more_options: false,
            show_create_task_popup: false,
            show_db_popup: false,
            show_create_system_var_popup: false,
            show_password_popup: false,
            show_quick_notebooks: false, // show quick notebook list
            show_note_more_options: false, // show options for notes
            show_notebook_popup: false,//to show create notebook popup

        }

        //button flags
        $scope.show_delete_system_var_button = false
        $scope.show_nav_more_vert_button = false
        $scope.show_delete_list_option = false
        $scope.show_purge_list_option = false
        $scope.show_select_notebooks_dropdown = true
        $scope.show_update_task_button = false
        $scope.is_sortable = false
        $scope.is_toast_visible = false
        $scope.is_data_locked = false
        $scope.is_trash_open = false
        $scope.toast_msg = ""
        $scope.is_note_selected = false //flag to check if any note is selected
        $scope.show_edit_options = false //bottom bar note edit options
        $scope.show_insert_options = false //bottom bar note insert options
        $scope.show_component_options = false //bottom bar component options for various components
        $scope.show_edit_options_system_vars = false //bottom bar note insert system vars
        $scope.show_note_complete_button = false // show hide complete button
        $scope.show_split_note_btns = false // split note sub menu btns
        $scope.show_view = $scope.CONST.VIEW_NOTEBOOK //options can be notebooks, notes
        $scope.bottom_bar_active_div = "null" //hide or show bottom bar create divs
        $scope.bottom_bar_active_menu = "null" //hide or show bottom bar menu options
        $scope.is_list_mode_on = false // if on on enter press a symbol is inserted at start of line
        $scope.current_list_symbol = "-"
        $scope.list_symbols_array = ["✅", "⚠", "-", "*"]
        $scope.system_create_btn_title = "Create"
        $scope.is_note_multi_select_on = false // to turn on off multi select
        $scope.note_multi_select_array = [] // hold selected notes
        $scope.action_on_quick_notebook_item = $scope.CONST.OPEN
        $scope.sort_notebook_selected_item = 'date' //sort notebooks model

        // chart component 
        $scope.new_chart = {
            title: "Untitled", // title of chart
            type: "line", // type of chart
            theme: "red", //theme color
            x_labels: "", //labels
            y_values: "", // values
            chart_id: 0, //create id dynamically while saving
            show: false,
        }

        // circular progress component 
        $scope.circular_progress = {
            heading_pos: "left", // position of heading
            x_labels: "", //labels
            y_values: "", // values
            show: false,
        }




        // by default create notebook is shown
        $scope.create_btns_arr = [false, true, false]
        $scope.show_all_create_btns = false
        $scope.show_searchbar = false
        $scope.textarea_default_height = 64
        $scope.textarea_max_height = 200
        $scope.new_notebook_icon = "folder" //show this icon on create notebook and update it automatically

        //icons
        $scope.icons = {
            checked: "radio_button_checked",
            unchecked: "radio_button_unchecked"
        }

        //default values
        $scope.defaultPageTitle = "Notebooks";
        $scope.default_app_icon = "eco"
        $scope.pageTitle = $scope.defaultPageTitle;
        $scope.pageIcon = "eco"
        $scope.copied_task = null
        $scope.db_operation = null


        //enable select notebooks
        $scope.select_notebooks = false
        $scope.selected_notebooks = []
        $scope.select_notebooks_menu_text = "Select Notebooks"

        // input values
        $scope.note_content = ""
        $scope.new_list_name = ""
        $scope.selected_note = null;
        $scope.note_content_placeholder = "Create quick note"
        $scope.new_var_name = ""
        $scope.new_var_value = ""
        $scope.max_notebook_title_len = 20
        $scope.note_textarea_container_default_height = 35
        $scope.note_textarea_container_height = 35
        $scope.note_textarea_container_max_height = 250
        $scope.password = ""
        $scope.selected_split_delimiter = "\n" // default delimiter is new line
        $scope.presets_delimiters = ["new line", "#", "$", "!"]


        $scope.proverbs = [
            "An empty vessel can hold anything.",
            "An empty mind makes progress.",
            "Emptiness is the beginning of all things.",
            "An empty mind is a clear mind.",
            "The empty pot makes the loudest noise.",
            "The less you carry, the farther you go.",
            "Only when the cup is empty can it be filled.",
            "In the void, possibilities are endless.",
            "Silence is a source of great strength.",
            "Emptiness is the path to wisdom.",
            "A full cup cannot accept more water.",
            "True understanding comes from nothingness.",
        ]

        $scope.empty_notebook_msg = getRandomItem($scope.proverbs)

        //read saved data
        $scope.notebooks = [];
        $scope.notes = [];

        $scope.read_data();
        //more options when notebook or note is clicked
        $scope.init_notebook_more_options()


        //group notebooks
        $scope.handle_group_notebooks()
    };
}