function my_controller($scope, $timeout, db_service) {

    // custom code of note is parsed to output html content
    $scope.parse_markdown_to_html = function (text) {
        return parseWikiTextToHTML(text)
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
        if ($scope.selectedListIndex >= 0) {
            let ms = $scope.notebooks[$scope.selectedListIndex].dateCreated
            return `Created: ${timeSince(ms)}`
        }
        return "Notebook is very old"
    }

    $scope.load_list_info = function (index) {
        $scope.selectedListIndex = index;
        $scope.list_index_for_hold_event = index
        $scope.show_delete_list_option = true
        $scope.show_purge_list_option = true
        $scope.show_rename_list_option = true
        $scope.default_app_icon = $scope.notebooks[$scope.selectedListIndex].icon
        // console.log($scope.default_app_icon)
    }

    $scope.open_notebook = function (index) {
        if ($scope.select_notebooks) {
            //instead of opening notebooks
            //toggle selection
            if ($scope.is_notebook_selected(index)) {
                //unselect
                let pos = $scope.selected_notebooks.indexOf(index)
                $scope.select_notebooks.splice(pos, 1)
            } else {
                //select
                $scope.selected_notebooks.push(index);
            }
        } else {
            if (index >= 0) {
                $scope.notes = $scope.notebooks[index].taskArray;
                console.log($scope.notebooks[index].taskArray)
                // when name is changed list view is hided and task view is shown
                $scope.selectedListName = $scope.notebooks[index].title;
                $scope.pageTitle = $scope.selectedListName;
                console.log("Opening notebook = ", $scope.pageTitle)
                //load list info, this function also used by tap and hold event to load list info
                $scope.load_list_info(index)
                $scope.new_task_placeholder = `Create task in ${$scope.selectedListName}`
                // $scope.dialog_flags.show_select_notebooks_dropdown = false
                $scope.open_sidebar(false)
            }
        }
        $scope.save_data()
    }

    $scope.open_sidebar = function (state) {
        let left_val = state ? "0px" : "-90vw";
        $scope.sidebar_left = { left: left_val }
        $scope.dialog_flags.is_sidebar_menu_open = state
    }

    $scope.reset_view = () => {
        try {
            console.log("reset called")
            $scope.search = "";
            $scope.pageTitle = $scope.defaultPageTitle;
            $scope.dialog_flags.show_delete_list_option = false
            $scope.dialog_flags.show_purge_list_option = false
            $scope.dialog_flags.show_rename_list_option = false
            $scope.selectedListIndex = -1
            $scope.selectedListName = null
        } catch (err) {
            console.log("Error while reseting button", err)
        }
    }

    $scope.handle_input_on_rename_notebook = function (e) {
        if (e.keyCode == 13) {
            $scope.rename_notebook()
        } else {
            $scope.new_notebook_icon = getIconForTitle($scope.new_list_name)
        }
    }


    $scope.handle_input_on_notebook = function (e) {
        if (e.keyCode == 13) {
            $scope.create_notebook()
            e.target.value = "";
        } else {
            $scope.new_notebook_icon = getIconForTitle($scope.new_list_name)
        }
    }



    $scope.get_list_icon = function (list) {
        if (list.hasOwnProperty("icon"))
            return list.icon
        else
            return "folder"
    }

    $scope.insertTextAtCursor = function (id, value) {
        insertTextAtCursor(id, value)
    }

    $scope.get_list_info = function (key, notes) {
        let title = $scope.notebooks[key].title
        if (title.toLowerCase() == "system") {
            return Object.keys(system_vars).length
        }
        var completed = notes.filter(function (note) { return note.isTaskCompleted == true }).length;
        if (completed == 0)
            return notes.length;
        return `${completed}/${notes.length}`
    }

    $scope.count_completed_notes = () => {
        var completed = $scope.notes.filter(function (note) { return note.isTaskCompleted == true }).length;
        return completed
    }

    $scope.create_notebook = () => {
        try {
            if ($scope.new_list_name.length > 1) {
                let duplicate = $scope.notebooks.some(list => list.title.toLowerCase() === $scope.new_list_name.toLowerCase())
                if (duplicate) {
                    alert(`Notebook "${$scope.new_list_name}" already exists.`);
                    return;
                }
                let new_list = new List($scope.new_list_name, $scope.new_notebook_icon);
                $scope.notebooks.push(new_list)
                $scope.show_toast(`Notebook created: ${new_list.title}`);
                $scope.new_list_name = ""
                $scope.dialog_flags.show_create_notebook_popup = false
                $scope.save_data();
            }
        } catch (err) {
            console.log("Error while creating notebook", err)
            $scope.show_toast("Failed to created notebook");
        }
    }




    $scope.create_task = () => {
        try {
            if (
                $scope.newTaskContent.trim().length > 0 &&
                ($scope.selectedListIndex != undefined || $scope.selectedListIndex >= 0)) {
                let multiple_tasks = split_text_into_tasks($scope.newTaskContent, "$")
                if (multiple_tasks.length > 0) {
                    //add multiple tasks
                    multiple_tasks.forEach((item, index) => {
                        let new_note = new Task(item)
                        new_note.taskIcon = $scope.icons.unchecked;
                        $scope.notebooks[$scope.selectedListIndex].taskArray.push(new_note)
                    })
                } else {
                    //add single task
                    let new_note = new Task($scope.newTaskContent.trim())
                    newTask.taskIcon = $scope.icons.unchecked;
                    $scope.notebooks[$scope.selectedListIndex].taskArray.push(newTask)
                }
                $scope.notes = $scope.notebooks[$scope.selectedListIndex].taskArray

                //reset options
                $scope.newTaskContent = ""
                $scope.textarea_default_height = 64
                document.querySelector("#newTaskContent").style.height = 64
                $scope.dialog_flags.show_add_task_edit_options = false
                $scope.dialog_flags.show_create_task_popup = false
                //if we are creating without opening the notebook
                $scope.pageTitle = $scope.selectedListName

                $scope.save_data();
                let toast_text = "Note added"
                if (multiple_tasks.length > 1)
                    toast_text = `${multiple_tasks.length} notes added`;
                $scope.show_toast(toast_text);
            }
        } catch (err) {
            console.log(err)
            $scope.show_toast(`Unable to add note`)
        }
    }

    $scope.get_system_vars = () => {
        return system_vars
    }

    $scope.edit_var = function (key, value) {
        $scope.system_var_popup_title = "Edit Variable"
        $scope.system_var_popup_create_button_text = "Update Variable"
        $scope.dialog_flags.show_create_system_var_popup = true
        $scope.show_delete_system_var_button = true
        $scope.new_var_name = key
        $scope.new_var_value = system_vars[key]
    }

    $scope.insert_system_var_at_cursor = () => {
        //console.log($scope.selected_system_var)
        insertTextAtCursor('newTaskContent', $scope.selected_system_var)
    }



    $scope.save_data = () => {
        const _theme = $scope.is_dark ? "dark" : "light";
        db_service.write(
            {
                notebooks: $scope.notebooks,
                selectedListIndex: $scope.selectedListIndex,
                theme: _theme,
                system_vars: system_vars
            }, angular
        )
    }

    $scope.read_data = () => {
        let data = db_service.read()
        $scope.notebooks = data.notebooks;
        $scope.selectedListIndex = data.selectedListIndex;
        system_vars = data.system_vars;
        $scope.theme = data.theme
    }


    $scope.emptyList = handleNoTasksState();


    $scope.handleDeleteList = () => {
        if ($scope.selectedListIndex >= 0) {
            if (confirm("Are you sure?")) {
                console.log("List at index removed:", $scope.selectedListIndex)
                $scope.show_toast("Notebook Deleted");
                let removedList = $scope.notebooks.splice($scope.selectedListIndex, 1);
                $scope.selectedListIndex = 0
                if ($scope.notebooks.length != 0) {
                    $scope.open_notebook($scope.selectedListIndex)
                } else {
                    //all notebooks removed
                    $scope.notes = []
                    $scope.pageTitle = $scope.defaultPageTitle
                }
                $scope.close_all_dialogs()
            }
        }
    }

    $scope.handle_tap_on_note = function (note) {
        if ($scope.mergeInProgress) {
            // $scope.selected_task = task;
            // if ($scope.selected_task == $scope.oldselected_task) {
            //   $scope.show_toast("Cannot merge with same Note");
            // } else {

            //   //concat selected content at the end
            //   $scope.notes[$scope.selected_task].title += "\n" + $scope.notes[$scope.oldselected_task].title;

            //   //remove old note now
            //   $scope.deleteTask($scope.oldselected_task);
            //   $scope.oldselected_task = -1;

            //   $scope.mergeInProgress = false;

            //   $scope.show_toast("Merge complete");
            //   $scope.save_data();
            // }

        } else {
            $scope.selected_task = note;
            $scope.dialog_flags.show_task_more_options = true
            $scope.task_completed_state = note.isTaskCompleted
        }
    }



    $scope.handle_remove_completed_tasks = () => {
        try {
            $scope.notes = $scope.notes.filter(task => !task.isTaskCompleted)
            $scope.notebooks[$scope.selectedListIndex].taskArray = $scope.notes
            $scope.save_data()
            $scope.close_all_dialogs()
        } catch (error) {
            console.log(error)
        }
    }


    $scope.delete_task = () => {

        if ($scope.selected_task == undefined || $scope.selected_task == null) {
            $scope.show_toast("No task selected")
            return ""
        }
        if (confirm("Are you sure?")) {
            // let removed = $scope.notes.splice(indexToRemove, 1);
            $scope.notes = $scope.notes.filter(function (task) {
                return task !== $scope.selected_task;
            });
            $scope.notebooks[$scope.selectedListIndex].taskArray = $scope.notes

            //add task to trash notebook
            $scope.notebooks.forEach((item, index) => {
                if (item.title.toLowerCase() == "trash") {
                    item.notes.push($scope.selected_task)
                }
            })
            $scope.save_data();
            $scope.close_all_dialogs()
            $scope.show_toast("Note deleted!")
        }
    }


    $scope.copy_task = () => {
        //move to another list
        if ($scope.selected_task != undefined) {
            $scope.copied_task = $scope.selected_task
            $scope.show_toast("Task Copied");
            $scope.close_all_dialogs()
        } else
            $scope.show_toast("Failed to copy");
    }


    $scope.paste_task = () => {
        try {
            //append copied task to selected task
            //save selected note position
            $scope.selected_task.title = $scope.selected_task.title.concat(
                "\n", $scope.copied_task.title
            )
            $scope.show_toast("Task Pasted")
            $scope.save_data()
            $scope.close_all_dialogs()

            $scope.copied_task = null;
        } catch (err) {
            $scope.show_toast("Fail to paste")
            console.log("Cannot paste task", err)
        }
    }
    $scope.paste_task_inside_notebook = () => {
        if ($scope.selectedListIndex >= 0) {
            $scope.notes.push($scope.copied_task);
            $scope.show_toast("Task Pasted")
            $scope.copied_task = null;
            $scope.close_all_dialogs()

            $scope.save_data();
        }
    }

    //show dialog to update
    $scope.open_update_task_popup = () => {
        $scope.open_create_new_note_popup()
        $scope.newTaskContent = $scope.selected_task.title
        $scope.show_update_task_button = true
        var textarea = document.querySelector('#newTaskContent');
        const h = calculate_height_based_on_lines($scope.newTaskContent, $scope.textarea_max_height)
        textarea.style.height = `${h + 40}px`;
    }

    // update task in popup
    $scope.updateTask = () => {
        $scope.selected_task.title = $scope.newTaskContent
        $scope.show_update_task_button = false
        $scope.close_all_dialogs()

        $scope.newTaskContent = ""
        $scope.show_toast("Note updated");
        $scope.save_data()
    }

    $scope.cancelNewTask = () => {
        document.querySelector("#confirm-change-button").style.display = "none";
        document.querySelector("#add-new-task-ok").style.display = "block";
        $("#newTaskContent").html("")
    }

    $scope.purgeList = () => {
        //delete all tasks inside notebook
        if (confirm("Are you sure?") == true) {
            if ($scope.selectedListIndex >= 0) {
                $scope.notes = []
                $scope.notebooks[$scope.selectedListIndex].taskArray = [];
                $scope.save_data();
                $scope.close_all_dialogs()

                $scope.show_toast("All tasks removed")
            }
        }
    }

    $scope.toggle_note_completed_state = function (note) {
        if (note) {
            note.isTaskCompleted = !note.isTaskCompleted;
            note.taskIcon = note.isTaskCompleted ? $scope.icons.checked : $scope.icons.unchecked;
            $scope.save_data();
            $scope.close_all_dialogs()
        }
    }

    $scope.move_task = function (distance) {
        // move completed tasks at end
        if ($scope.selected_task != undefined) {
            let key = $scope.notes.indexOf($scope.selected_task)
            console.log($scope.selected_task, key)

            // if (key + distance < 0) {
            //   $scope.show_toast("Task already at top")
            // } else if (key + distance >= $scope.notes.length) {
            //   $scope.show_toast("Task already at bottom")
            // } else {
            //   let temp = $scope.notes[key + distance]
            //   $scope.notes[key + distance] = $scope.notes[key]
            //   $scope.notes[key] = temp
            //   let str = distance < 0 ? "Task moved up" : "Task moved down";
            //   $scope.show_toast(str)
            // }
            // $scope.save_data();
            // $scope.dialog_flags.show_task_more_options = false
        }
    }




    $scope.nav_more_vert_icon = () => {
        return $scope.dialog_flags.show_list_more_options ? "close" : "more_horiz";
    }


    $scope.app_size = () => {
        let totalSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            let value = localStorage.getItem(key);
            totalSize += key.length + value.length;
        }
        return `App storage is ${(totalSize / 1024).toFixed(2)} kb`
    }


    $scope.save_theme = () => {
        if ($scope.is_dark) {
            document.querySelector("#theme-color").setAttribute("content", "#272727")
        } else {
            document.querySelector("#theme-color").setAttribute("content", "#ffffff")
        }
        $scope.save_data()
    }

    $scope.init_theme = () => {
        const old_theme = localStorage.theme || "light";
        $scope.is_dark = old_theme == "dark";
        $scope.save_theme()
    }

    $scope.init_notification = () => {
        //temp notification
        if (Notification.permission === 'denied' || Notification.permission === 'default') {
            console.log("notification false")
            $scope.askNotificationPermission()
        } else {
            console.log("notification true")

        }

        if (Notification.permission === 'granted') {
            $scope.createNotification("hello world")
        }
    }


    $scope.askNotificationPermission = () => {
        function handlePermission(permission) {
            if (!Reflect.has(Notification, 'permission')) {
                Notification.permission = permission;
            }
            // Set the button to shown or hidden, depending on what the user answers
            // if (Notification.permission === 'denied' || Notification.permission === 'default') {
            //   notificationBtn.style.display = 'block';
            // } else {
            //   notificationBtn.style.display = 'none';
            // }
        };

        // Check if the browser supports notifications
        if (!Reflect.has(window, 'Notification')) {
            console.log('This browser does not support notifications.');
        } else {
            if ($scope.checkNotificationPromise()) {
                Notification.requestPermission().then(handlePermission);
            } else {
                Notification.requestPermission(handlePermission);
            }
        }
    };

    $scope.checkNotificationPromise = () => {
        try {
            Notification.requestPermission().then();
        } catch (e) {
            return false;
        }
        return true;
    };

    $scope.createNotification = function (title) {
        // Create and show the notification
        const img = 'img/ios/128.png';
        const text = `Hello notebooks`;
        const notification = new Notification('Notebook', { body: text, icon: img });
    };


    $scope.load_last_notebook = () => {
        //check number of notebooks
        // let old_list_index = localStorage.selectedListIndex || 0;
        // if (old_list_index < 0)
        //     old_list_index = 0
        $scope.open_notebook(0)
    };


    $scope.handle_click_on_notebook_title = () => {
        if ($scope.selectedListIndex >= 0) {
            //close all dialogs
            $scope.close_all_dialogs()
            //show notebook options
            $scope.dialog_flags.show_list_more_options = true
            //update texts when opening more options 
            $scope.init_notebook_more_options()
        }
    }

    $scope.handle_click_on_more_vert = () => {
        if ($scope.is_any_dialog_open()) {
            $scope.close_all_dialogs();
        } else {
            $scope.handle_click_on_notebook_title()
        }
    }

    $scope.handle_keypress_newtask = function (e) {
        try {
            let textarea = document.querySelector("#newTaskContent")
            // if(e.keyCode==13)
            let h = textarea.scrollHeight
            // if(h>400)
            //   h=400
            textarea.style.height = `${Math.min(h, $scope.textarea_max_height)}px`

            if (e.keyCode == 32 || e.keyCode == 13) {
                //#today #now #day
                var codes = {
                    "#today": formatDate(new Date()),
                    "#now": formatTime(new Date()),
                    "#day": formatDay(new Date())
                };
                for (var code in codes) {
                    if ($scope.newTaskContent.includes(code)) {
                        $scope.newTaskContent = $scope.newTaskContent.replace(code, codes[code]);
                    }
                }
                if (e.keyCode == 13) {
                    let value = textarea.value;
                    let lines = value.split('\n');
                    let lastLine = lines[lines.length - 1];
                    let match = lastLine.match(/^(\d+)\.\s/);
                    if (match) {
                        let currentNumber = parseInt(match[1]);
                        textarea.value += `\n${currentNumber + 1}. `;
                        e.preventDefault();
                    }
                }
            }
        } catch (error) {
            console.log(error)
        }
    }



    $scope.init_notify = () => {
        // Check if the browser supports notifications
        if (!('Notification' in window)) {
            alert('This browser does not support notifications.');
            return;
        }

        // Request permission if not already granted
        if (Notification.permission !== 'granted') {
            Notification.requestPermission().then(function (permission) {
                if (permission === 'granted') {
                    sendNotification();
                }
            });
        } else {
            sendNotification();
        }
    }

    $scope.handle_select_notebooks = () => {
        $scope.select_notebooks = !$scope.select_notebooks
        $scope.select_notebooks_menu_text = $scope.select_notebooks ? "Cancel Selection" : "Select Notebooks";
        $scope.dialog_flags.show_list_more_options = false
        $scope.dialog_flags.show_task_more_options = false
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
        $scope.dialog_flags.show_task_more_options = false
        $scope.dialog_flags.show_list_more_options = false
        $scope.save_data();
    };

    $scope.get_total = () => {
        let total_tasks = 0, total_notebooks = $scope.notebooks.length
        // console.log($scope.notebooks)
        $scope.notebooks.forEach((item, index) => {
            total_tasks += item["taskArray"].length;
        })
        return {
            "total_tasks": total_tasks,
            "total_notebooks": total_notebooks
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
            $scope.close_all_dialogs()
            $scope.dialog_flags.show_delete_system_var_button = false
            $scope.save_data()
            $scope.show_toast("System var removed")
        }
    }

    $scope.create_system_var = () => {
        let error = ""
        console.log($scope.new_var_value)
        if ($scope.new_var_name.length > 0 && $scope.new_var_value.length > 0) {
            //clean vars
            $scope.new_var_name = $scope.new_var_name.trim().toLocaleLowerCase()
            $scope.new_var_value = $scope.new_var_value.trim().toLocaleLowerCase()

        } else {
            error = "Empty variables cannot be created"
        }

        if (error == "") {
            system_vars[$scope.new_var_name] = $scope.new_var_value
            $scope.save_data();
            $scope.new_var_name = ""
            $scope.new_var_value = ""
            $scope.close_all_dialogs()
            $scope.show_toast("Variable created");
        } else {
            $scope.show_toast(error)
        }

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
        $scope.newTaskContent = ""
        document.querySelector("#newTaskContent").style.height = `${$scope.textarea_default_height}px`
        //we are in a notebook
        if ($scope.selectedListIndex >= 0)
            $scope.show_select_notebooks_dropdown = false
        else
            $scope.show_select_notebooks_dropdown = true
    }


    $scope.handle_rename_notebook = () => {
        $scope.close_all_dialogs()
        $scope.dialog_flags.show_rename_notebook_popup = true
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
        if ($scope.selectedListIndex >= 0 && $scope.notes.length > 0) {
            const hasCompletedTasks = $scope.notes.some(note => note.isTaskCompleted === true);
            return hasCompletedTasks;
        }
        return false;
    }



    $scope.init_notebook_more_options = () => {
        $scope.notebook_more_options = [
            {
                text: $scope.app_size(),
                icon: "cloud",
                class: "task-more-options-item",
                show: true,
                action: () => { }
            }, {
                text: "Database",
                icon: "database",
                class: "task-more-options-item",
                show: true,
                action: () => { $scope.dialog_flags.show_db_popup = true; $scope.dialog_flags.show_list_more_options = false; }
            }, {
                text: $scope.is_sortable ? "Disable Sorting" : "Enable Sorting",
                icon: "swap_vert",
                class: "task-more-options-item",
                show: true,
                action: () => {
                    $scope.is_sortable = !$scope.is_sortable;
                    $scope.close_all_dialogs();
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
                text: "Complete all tasks",
                icon: "priority",
                class: "task-more-options-item",
                show: $scope.notebook_has_completed_tasks(),
                action: () => { $scope.handle_remove_completed_tasks() }
            }, {
                text: "Remove completed tasks",
                icon: "delete_sweep",
                class: "task-more-options-item",
                show: $scope.notebook_has_completed_tasks(),
                action: () => { $scope.handle_remove_completed_tasks() }
            }, {
                text: "Delete all tasks",
                icon: "warning",
                class: "task-more-options-item text-red-500",
                show: true,
                action: () => { $scope.purgeList() }
            },
            {
                text: "Delete notebook",
                icon: "delete",
                class: "task-more-options-item text-red-500",
                show: true,
                action: () => { $scope.handleDeleteList() }
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
            if ($scope.db_operation != "import") {
                $scope.show_toast("Operation not selected")
                return ""
            }
            if ($scope.db_textarea.length == 0) {
                $scope.show_toast("Missing JSON code")
                return ""
            }
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
                $scope.db_operation = "";
                $scope.close_all_dialogs()
                //read data from storage
                $scope.notebooks = $scope.read_data()
            }
        }
        catch (err) {
            $scope.show_toast("Failed to import data.");
            console.error("Failed to import data.", err);
        }
    }

    $scope.handle_db_operation_change = () => {

        if ($scope.db_operation == "export") {
            let data = JSON.stringify(localStorage)
            $scope.db_textarea = data
        } else {
            $scope.db_textarea = ""
        }
    }

    $scope.is_any_dialog_open = () => {
        // console.log($scope.dialog_flags)
        return Object.values($scope.dialog_flags).some(flag => flag);
    };

    $scope.close_all_dialogs = () => {
        //hide delete button on system var
        $scope.show_delete_system_var_button = false
        $scope.open_sidebar(false)
        for (let key in $scope.dialog_flags) {
            if ($scope.dialog_flags.hasOwnProperty(key)) {
                $scope.dialog_flags[key] = false;
            }
        }
    };

    $scope.init_system_notebooks = () => {
        //notebooks must contain System and Trash notebooks
        let has_sys = $scope.notebooks.some(list => list.title.toLowerCase() === "system")
        let has_trash = $scope.notebooks.some(list => list.title.toLowerCase() === "trash")
        if (!has_sys) {
            $scope.notebooks.push(new List("System", "keyboard_command_key"))
        }
        if (!has_trash) {
            $scope.notebooks.push(new List("Trash", "recycling"))
        }
    }

    $scope.empty_notebook_msg = () => {
        //show text when notebook is empty
        try {
            return get_empty_proverbs()
        } catch (err) {
            console.log(err)
        }
    }

    $scope.init_sortable_list = function (selector, array_name) {
        //lets sort
        $scope.sortable = Sortable.create(document.querySelector(selector), {
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


    // $scope.init_sortable_tasks = function(){
    //     //lets sort
    //     let sortable = Sortable.create(document.querySelector(".tasks"),{
    //         animation:250,
    //         onEnd:function(evt)
    //         {
    //             // console.log("new index = ",evt.newIndex,"old index",evt.oldIndex)
    //             if(evt.newIndex!=evt.oldIndex)
    //             {
    //                 //swap items
    //                 const [movedItem] = $scope.notes.splice(evt.oldIndex, 1);
    //                 $scope.notes.splice(evt.newIndex, 0, movedItem);
    //                 $scope.save_data()
    //             }
    //         }
    //     })
    // }

    //define all funcions above init

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


    $scope.lock_data = (key) =>
    {
        //let lock only content of note
        key = "0000"
        $scope.notes.forEach((data,index)=>{
            data.title = encrypt_data(data.title,key)
        })
        console.log($scope.notes)
    }

    $scope.unlock_data = (key) => {
        key = "0000"
        $scope.notes.forEach((data,index)=>{
            data.title = decrypt_data(data.title,key)
        })
        console.log($scope.notes)
    }

    $scope.toggle_data_lock = ()=>{
        if(!$scope.is_data_locked)
        {
            $scope.lock_data()
        }else{
            $scope.unlock_data()
        }
        $scope.is_data_locked = !$scope.is_data_locked;
    }




    $scope.init = () => {
        //dialog flags
        $scope.dialog_flags = {
            is_sidebar_menu_open: false,
            show_list_more_options: false,
            show_task_more_options: false,
            show_create_notebook_popup: false,
            show_create_task_popup: false,
            show_db_popup: false,
            show_create_system_var_popup: false,
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
        $scope.toast_msg = ""

        $scope.show_searchbar = false
        $scope.textarea_default_height = 64
        $scope.textarea_max_height = 200
        $scope.new_notebook_icon = "folder"
        //icons
        $scope.icons = {
            checked: "radio_button_checked",
            unchecked: "radio_button_unchecked"
        }
        //by default edit options are hidden
        $scope.show_add_task_edit_options = false

        //enable select notebooks
        $scope.select_notebooks = false
        $scope.selected_notebooks = []
        $scope.select_notebooks_menu_text = "Select Notebooks"

        //read saved data
        $scope.notebooks = [];
        $scope.notes = [];
        $scope.read_data();
        console.log("Read Data", $scope.notebooks, $scope.notes)
        $scope.init_system_notebooks()

        if (patchApplied) {
            //if new property added to previous version
            //save these properties now
            $scope.save_data();
        }

        //default values notebooks
        $scope.selectedListIndex = -1
        $scope.selectedListName = null
        $scope.defaultPageTitle = "Notebooks";
        $scope.default_app_icon = "eco"
        $scope.pageTitle = $scope.defaultPageTitle;
        $scope.copied_task = null

        // input values
        $scope.newTaskContent = ""
        $scope.new_list_name = ""
        $scope.selected_task = -1;
        $scope.new_task_placeholder = "Create Task"
        $scope.new_var_name = ""
        $scope.new_var_value = ""
            
        // $scope.allTasks = $scope.getTasksOnly();
        $scope.max_notebook_title_len = 20

        $scope.edit_options = [
            { icon: "title", insert_text: "#H1" , title:"Heading"},
            { icon: "list", insert_text: "* Item" , title:"List"},
            { icon: "sliders", insert_text: "#50%" , title:"Progress bar"},
            { icon: "check_box", insert_text: "$ " , title:"Split notes"}
        ]


        //default theme
        $scope.init_theme()

        //notebook more options
        $scope.notebook_more_options = []
        $scope.init_notebook_more_options()

        //try to load first or last notebook
        $scope.load_last_notebook()
        $scope.init_sortable_list(".tasks", "notes");
        // $scope.init_sortable_list(".notebooks","notebooks");
    };
}