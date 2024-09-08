function my_controller($scope,db_service) {

    // output  of task content
    $scope.handle_task_html = function (text) {
        text = parseWikiTextToHTML(text)
        return text
    }

    //for searching made easy
    $scope.getTasksOnly = function () {
        var allTasks = [];
        $scope.listArray.forEach(list => {
            allTasks = allTasks.concat(list.taskArray)
        });
        //console.log(allTasks);
        return allTasks;
    };


    $scope.notebook_age = function () {
        if ($scope.selectedListIndex >= 0) {
            let ms = $scope.listArray[$scope.selectedListIndex].dateCreated
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
        $scope.default_app_icon = $scope.listArray[$scope.selectedListIndex].icon
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
                $scope.taskArray = $scope.listArray[index].taskArray;
                // when name is changed list view is hided and task view is shown
                $scope.selectedListName = $scope.listArray[index].title;
                $scope.pageTitle = $scope.selectedListName;
                console.log("Opening notebook = ", $scope.pageTitle)
                //load list info, this function also used by tap and hold event to load list info
                $scope.load_list_info(index)
                $scope.new_task_placeholder = `Create task in ${$scope.selectedListName}`
                // $scope.dialog_flags.show_select_notebooks_dropdown = false
                $scope.open_sidebar(false)
            }
        }
        $scope.saveData()
    }

    $scope.open_sidebar = function (state) {
        let left_val = state ? "0px" : "-90vw";
        $scope.sidebar_left = { left: left_val }
        $scope.dialog_flags.is_sidebar_menu_open = state
    }

    $scope.reset_view = function () {
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

    $scope.get_list_info = function (key, taskArray) {
        let title = $scope.listArray[key].title
        if (title.toLowerCase() == "system") {
            return Object.keys(system_vars).length
        }
        var completed = taskArray.filter(function (task) { return task.isTaskCompleted == true }).length;
        if (completed == 0)
            return taskArray.length;
        return `${completed}/${taskArray.length}`
    }

    $scope.completed_tasks_len = function () {
        var completed = $scope.taskArray.filter(function (task) { return task.isTaskCompleted == true }).length;
        return completed
    }

    $scope.create_notebook = function () {
        try {
            if ($scope.new_list_name.length > 1) {
                let duplicate = $scope.listArray.some(list => list.title.toLowerCase() === $scope.new_list_name.toLowerCase())
                if (duplicate) {
                    alert(`Notebook "${$scope.new_list_name}" already exists.`);
                    return;
                }
                let new_list = new List($scope.new_list_name, $scope.new_notebook_icon);
                $scope.listArray.push(new_list)
                showToast(`Notebook created: ${new_list.title}`);
                $scope.new_list_name = ""
                $scope.dialog_flags.show_create_notebook_popup = false
                $scope.saveData();
            }
        } catch (err) {
            console.log("Error while creating notebook", err)
            showToast("Failed to created notebook");
        }
    }




    $scope.create_task = function () {
        try {
            if (
                $scope.newTaskContent.trim().length > 0 &&
                ($scope.selectedListIndex != undefined || $scope.selectedListIndex >= 0)) {
                let multiple_tasks = split_text_into_tasks($scope.newTaskContent, "$")
                if (multiple_tasks.length > 0) {
                    //add multiple tasks
                    multiple_tasks.forEach((item, index) => {
                        let newTask = new Task(item)
                        newTask.taskIcon = $scope.icons.unchecked;
                        $scope.listArray[$scope.selectedListIndex].taskArray.push(newTask)
                    })
                } else {
                    //add single task
                    let newTask = new Task($scope.newTaskContent.trim())
                    newTask.taskIcon = $scope.icons.unchecked;
                    $scope.listArray[$scope.selectedListIndex].taskArray.push(newTask)
                }
                $scope.taskArray = $scope.listArray[$scope.selectedListIndex].taskArray

                //reset options
                $scope.newTaskContent = ""
                $scope.textarea_default_height = 64
                document.querySelector("#newTaskContent").style.height = 64
                $scope.dialog_flags.show_add_task_edit_options = false
                $scope.dialog_flags.show_create_task_popup = false
                //if we are creating without opening the notebook
                $scope.pageTitle = $scope.selectedListName

                $scope.saveData();
                let toast_text = "Note added"
                if (multiple_tasks.length > 1)
                    toast_text = `${multiple_tasks.length} notes added`;
                showToast(toast_text);
            }
        } catch (err) {
            console.log(err)
            showToast(`Unable to add note`)
        }
    }

    $scope.get_system_vars = function () {
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

    $scope.insert_system_var_at_cursor = function () {
        //console.log($scope.selected_system_var)
        insertTextAtCursor('newTaskContent', $scope.selected_system_var)
    }



    $scope.saveData = function () {
        const _theme = $scope.is_dark?"dark":"light";
        db_service.write(
            {
                notebooks:$scope.listArray,
                selectedListIndex:$scope.selectedListIndex,
                theme:_theme,
                system_vars:system_vars
            },angular
        )
    }

    $scope.readData = function () {
        let data = db_service.read()
        $scope.listArray = data.notebooks;
        $scope.selectedListIndex = data.selectedListIndex;
        system_vars = data.system_vars;
        $scope.theme = data.theme
    }


    $scope.emptyList = handleNoTasksState();


    $scope.handleDeleteList = function () {
        if ($scope.selectedListIndex >= 0) {
            if (confirm("Are you sure?")) {
                console.log("List at index removed:", $scope.selectedListIndex)
                showToast("Notebook Deleted");
                let removedList = $scope.listArray.splice($scope.selectedListIndex, 1);
                $scope.selectedListIndex = 0
                if ($scope.listArray.length != 0) {
                    $scope.open_notebook($scope.selectedListIndex)
                } else {
                    //all notebooks removed
                    $scope.taskArray = []
                    $scope.pageTitle = $scope.defaultPageTitle
                }
                $scope.close_all_dialogs()
            }
        }
    }

    $scope.handle_tap_on_task = function (task) {
        console.log(task)
        if ($scope.mergeInProgress) {
            // $scope.selected_task = task;
            // if ($scope.selected_task == $scope.oldselected_task) {
            //   showToast("Cannot merge with same Note");
            // } else {

            //   //concat selected content at the end
            //   $scope.taskArray[$scope.selected_task].title += "\n" + $scope.taskArray[$scope.oldselected_task].title;

            //   //remove old note now
            //   $scope.deleteTask($scope.oldselected_task);
            //   $scope.oldselected_task = -1;

            //   $scope.mergeInProgress = false;

            //   showToast("Merge complete");
            //   $scope.saveData();
            // }

        } else {
            $scope.selected_task = task;
            $scope.dialog_flags.show_task_more_options = true
            $scope.task_completed_state = task.isTaskCompleted
        }
    }



    $scope.handle_remove_completed_tasks = function () {
        try {
            $scope.taskArray = $scope.taskArray.filter(task => !task.isTaskCompleted)
            $scope.listArray[$scope.selectedListIndex].taskArray = $scope.taskArray
            $scope.saveData()
            $scope.close_all_dialogs()
        } catch (error) {
            console.log(error)
        }
    }


    $scope.delete_task = function () {

        if ($scope.selected_task == undefined || $scope.selected_task == null) {
            showToast("No task selected")
            return ""
        }
        if (confirm("Are you sure?")) {
            // let removed = $scope.taskArray.splice(indexToRemove, 1);
            $scope.taskArray = $scope.taskArray.filter(function (task) {
                return task !== $scope.selected_task;
            });
            $scope.listArray[$scope.selectedListIndex].taskArray = $scope.taskArray

            //add task to trash notebook
            $scope.listArray.forEach((item, index) => {
                if (item.title.toLowerCase() == "trash") {
                    item.taskArray.push($scope.selected_task)
                }
            })
            $scope.saveData();
            $scope.close_all_dialogs()
            showToast("Note deleted!")
        }
    }


    $scope.copy_task = function () {
        //move to another list
        if ($scope.selected_task != undefined) {
            $scope.copied_task = $scope.selected_task
            showToast("Task Copied");
            $scope.close_all_dialogs()
        } else
            showToast("Failed to copy");
    }


    $scope.paste_task = function () {
        try {
            //append copied task to selected task
            //save selected note position
            $scope.selected_task.title = $scope.selected_task.title.concat(
                "\n", $scope.copied_task.title
            )
            showToast("Task Pasted")
            $scope.saveData()
            $scope.close_all_dialogs()

            $scope.copied_task = null;
        } catch (err) {
            showToast("Fail to paste")
            console.log("Cannot paste task", err)
        }
    }
    $scope.paste_task_inside_notebook = function () {
        if ($scope.selectedListIndex >= 0) {
            $scope.taskArray.push($scope.copied_task);
            showToast("Task Pasted")
            $scope.copied_task = null;
            $scope.close_all_dialogs()

            $scope.saveData();
        }
    }

    //show dialog to update
    $scope.open_update_task_popup = function () {
        $scope.open_create_new_note_popup()
        $scope.newTaskContent = $scope.selected_task.title
        $scope.show_update_task_button = true
        var textarea = document.querySelector('#newTaskContent');
        const h = calculate_height_based_on_lines($scope.newTaskContent, $scope.textarea_max_height)
        textarea.style.height = `${h + 40}px`;
    }

    // update task in popup
    $scope.updateTask = function () {
        $scope.selected_task.title = $scope.newTaskContent
        $scope.show_update_task_button = false
        $scope.close_all_dialogs()

        $scope.newTaskContent = ""
        showToast("Note updated");
        $scope.saveData()
    }

    $scope.cancelNewTask = function () {
        document.querySelector("#confirm-change-button").style.display = "none";
        document.querySelector("#add-new-task-ok").style.display = "block";
        $("#newTaskContent").html("")
    }

    $scope.purgeList = function () {
        //delete all tasks inside notebook
        if (confirm("Are you sure?") == true) {
            if ($scope.selectedListIndex >= 0) {
                $scope.taskArray = []
                $scope.listArray[$scope.selectedListIndex].taskArray = [];
                $scope.saveData();
                $scope.close_all_dialogs()

                showToast("All tasks removed")
            }
        }
    }

    $scope.toggle_task_complete = function (task) {
        if (task != undefined) {
            console.log(task)
            task.isTaskCompleted = !task.isTaskCompleted;
            task.taskIcon = task.isTaskCompleted ? $scope.icons.checked : $scope.icons.unchecked;
            $scope.saveData();
            $scope.close_all_dialogs()

        }
    }

    $scope.move_task = function (distance) {
        // move completed tasks at end
        if ($scope.selected_task != undefined) {
            let key = $scope.taskArray.indexOf($scope.selected_task)
            console.log($scope.selected_task, key)

            // if (key + distance < 0) {
            //   showToast("Task already at top")
            // } else if (key + distance >= $scope.taskArray.length) {
            //   showToast("Task already at bottom")
            // } else {
            //   let temp = $scope.taskArray[key + distance]
            //   $scope.taskArray[key + distance] = $scope.taskArray[key]
            //   $scope.taskArray[key] = temp
            //   let str = distance < 0 ? "Task moved up" : "Task moved down";
            //   showToast(str)
            // }
            // $scope.saveData();
            // $scope.dialog_flags.show_task_more_options = false
        }
    }




    $scope.nav_more_vert_icon = function () {
        return $scope.dialog_flags.show_list_more_options ? "close" : "more_horiz";
    }


    $scope.app_size = function () {
        let totalSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            let value = localStorage.getItem(key);
            totalSize += key.length + value.length;
        }
        return `App storage is ${(totalSize / 1024).toFixed(2)} kb`
    }


    $scope.save_theme = function () {
        // console.log($scope.is_dark)
        if ($scope.is_dark) {
            document.querySelector("#theme-color").setAttribute("content", "#272727")
        } else {
            document.querySelector("#theme-color").setAttribute("content", "#ffffff")
        }
        $scope.saveData()
    }

    $scope.init_theme = function () {
        const old_theme = localStorage.theme || "light";
        $scope.is_dark = old_theme=="dark";
    }

    $scope.init_notification = function () {
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


    $scope.askNotificationPermission = function () {
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

    $scope.checkNotificationPromise = function () {
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


    $scope.load_last_notebook = function () {
        //check number of notebooks
        const old_list_index = localStorage.selectedListIndex || 0;

        $scope.open_notebook(old_list_index)
    };


    $scope.handle_click_on_notebook_title = function () {
        if ($scope.selectedListIndex >= 0) {
            //close all dialogs
            $scope.close_all_dialogs()
            //show notebook options
            $scope.dialog_flags.show_list_more_options = true
            //update texts when opening more options 
            $scope.init_notebook_more_options()
        }
    }

    $scope.handle_click_on_more_vert = function () {
        if($scope.is_any_dialog_open())
        {
            $scope.close_all_dialogs();
        }else{
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



    $scope.init_notify = function () {
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

    $scope.handle_select_notebooks = function () {
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

    $scope.delete_selected_notebooks = function () {
        // Sort the selected notebooks in descending order to avoid index issues while removing
        $scope.selected_notebooks.sort((a, b) => b - a);

        // Remove each selected notebook from listArray
        $scope.selected_notebooks.forEach((index) => {
            $scope.listArray.splice(index, 1);
        });

        // Optionally, clear the selected notebooks array
        $scope.selected_notebooks = [];
        $scope.select_notebooks = false
        $scope.select_notebooks_menu_text = "Select Notebooks"
        $scope.dialog_flags.show_task_more_options = false
        $scope.dialog_flags.show_list_more_options = false
        $scope.saveData();
    };

    $scope.get_total = function () {
        let total_tasks = 0, total_notebooks = $scope.listArray.length
        $scope.listArray.forEach((item, index) => {
            total_tasks += item.taskArray.length;
        })
        return {
            "total_tasks": total_tasks,
            "total_notebooks": total_notebooks
        }
    }

    $scope.get_notebooks_list = function () {
        let notebooks = $scope.listArray.map(function (listItem) {
            return listItem.title;
        });
        notebooks = notebooks.filter((list) => list.toLocaleLowerCase() != "system")
        // console.log(notebooks)
        return notebooks
    };

    $scope.update_selected_list_index = function (key) {
        $scope.selectedListIndex = key
        $scope.selectedListName = $scope.listArray[$scope.selectedListIndex].title;
        console.log("Selected notebook", $scope.selectedListIndex)
    }


    $scope.open_create_system_var_popup = function () {
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

    $scope.delete_system_var = function () {
        if (confirm("Are you sure?")) {
            delete system_vars[$scope.new_var_name]
            $scope.close_all_dialogs()
            $scope.dialog_flags.show_delete_system_var_button = false
            $scope.saveData()
            showToast("System var removed")
        }
    }

    $scope.create_system_var = function () {
        let error = ""
        if ($scope.new_var_name.length > 0 && $scope.new_var_value.length > 0) {
            //clean vars
            $scope.new_var_name = $scope.new_var_name.trim().toLocaleLowerCase()
            $scope.new_var_value = $scope.new_var_value.trim().toLocaleLowerCase()

        } else {
            error = "Empty variables cannot be created"
        }

        if (error == "") {
            system_vars[$scope.new_var_name] = $scope.new_var_value
            $scope.saveData();
            $scope.new_var_name = ""
            $scope.new_var_value = ""
            $scope.close_all_dialogs()
            showToast("Variable created");
        } else {
            showToast(error)
        }

    }

    $scope.open_create_new_note_popup = function () {
        if ($scope.selectedListName.toLowerCase() == "trash") {
            return showToast("Cannot create note inside Trash");
        }
        if ($scope.selectedListName.toLowerCase() == "system") {
            return showToast("Cannot create note inside System");
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


    $scope.handle_rename_notebook = function () {
        $scope.close_all_dialogs()
        $scope.dialog_flags.show_rename_notebook_popup = true
    }

    $scope.rename_notebook = function () {
        try {
            if (!$scope.new_list_name) {
                return showToast("Error: Input required");
            }

            if ($scope.new_list_name.toLocaleLowerCase() === "system") {
                return showToast("Error: System title is reserved");
            }

            if ($scope.selectedListIndex < 0) {
                return showToast("Error: No list is selected");
            }

            // Update title and icon
            let selectedList = $scope.listArray[$scope.selectedListIndex];
            selectedList.title = $scope.new_list_name;
            selectedList.icon = $scope.new_notebook_icon;
            $scope.listArray[$scope.selectedListIndex] = selectedList

            // Save data and close popup
            $scope.saveData();
            $scope.close_all_dialogs()


            // Update selected list and page title
            $scope.selectedListName = $scope.new_list_name;
            $scope.pageTitle = $scope.new_list_name;

            // Clean up
            $scope.new_list_name = "";
            showToast("Notebook renamed");
        } catch (err) {
            showToast("Exception occurred while renaming notebook");
            console.error("Error while renaming notebook", err);
        }
    }

    $scope.notebook_has_completed_tasks = function () {
        if ($scope.selectedListIndex >= 0 && $scope.taskArray.length > 0) {
            const hasCompletedTasks = $scope.taskArray.some(task => task.isTaskCompleted === true);
            return hasCompletedTasks;
        }
        return false;
    }



    $scope.init_notebook_more_options = function () {
        $scope.notebook_more_options = [
            {
                text: $scope.app_size(),
                icon: "cloud",
                class: "task-more-options-item",
                show: true,
                action: function () { }
            }, {
                text: "Database",
                icon: "database",
                class: "task-more-options-item",
                show: true,
                action: function () { $scope.dialog_flags.show_db_popup = true; $scope.dialog_flags.show_list_more_options = false; }
            },{
                text: $scope.is_sortable?"Disable Sorting":"Enable Sorting",
                icon: "swap_vert",
                class: "task-more-options-item",
                show: true,
                action: function () { 
                    $scope.is_sortable = !$scope.is_sortable;
                    $scope.close_all_dialogs();
                 }
            }, {
                text: "Paste Task",
                icon: "content_paste",
                class: "task-more-options-item",
                show: $scope.copied_task != null,
                action: function () { $scope.paste_task_inside_notebook() }
            }, {
                text: "Rename notebook",
                icon: "format_color_text",
                class: "task-more-options-item",
                show: true,
                action: function () { $scope.handle_rename_notebook() }
            }, {
                text: "Complete all tasks",
                icon: "priority",
                class: "task-more-options-item",
                show: $scope.notebook_has_completed_tasks(),
                action: function () { $scope.handle_remove_completed_tasks() }
            }, {
                text: "Remove completed tasks",
                icon: "delete_sweep",
                class: "task-more-options-item",
                show: $scope.notebook_has_completed_tasks(),
                action: function () { $scope.handle_remove_completed_tasks() }
            }, {
                text: "Delete all tasks",
                icon: "warning",
                class: "task-more-options-item text-red-500",
                show: true,
                action: function () { $scope.purgeList() }
            },
            {
                text: "Delete notebook",
                icon: "delete",
                class: "task-more-options-item text-red-500",
                show: true,
                action: function () { $scope.handleDeleteList() }
            },
            {
                text: "Close",
                icon: "cancel",
                class: "task-more-options-item text-red-500",
                show: true,
                action: function () { $scope.close_all_dialogs() }
            }
        ]
    }

    $scope.copy_to_clipboard = function (textToCopy) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(function () {
                showToast("Copied to clipboard!");
            }).catch(function (err) {
                showToast("Failed to copy text to clipboard.");
                console.error("Could not copy text: ", err);
            });
        }
    }



    $scope.import_data = function () {
        try {
            if ($scope.db_operation != "import") {
                showToast("Operation not selected")
                return ""
            }
            if ($scope.db_textarea.length == 0) {
                showToast("Missing JSON code")
                return ""
            }
            if (!is_valid_json($scope.db_textarea)) {
                showToast("Invalid JSON code")
                return ""
            }

            if (confirm("Overwrite everything with new data?")) {
                let data = JSON.parse($scope.db_textarea)
                Object.keys(data).forEach(key => {
                    localStorage.setItem(key, data[key]);
                });
                showToast("Import Successful");
                $scope.db_textarea = "";
                $scope.db_operation = "";
                $scope.close_all_dialogs()
                //read data from storage
                $scope.listArray = $scope.readData()
            }
        }
        catch (err) {
            showToast("Failed to import data.");
            console.error("Failed to import data.", err);
        }
    }

    $scope.handle_db_operation_change = function () {

        if ($scope.db_operation == "export") {
            let data = JSON.stringify(localStorage)
            $scope.db_textarea = data
        } else {
            $scope.db_textarea = ""
        }
    }

    $scope.is_any_dialog_open = function () {
        // console.log($scope.dialog_flags)
        return Object.values($scope.dialog_flags).some(flag => flag);
    };

    $scope.close_all_dialogs = function () {
        //hide delete button on system var
        $scope.show_delete_system_var_button = false
        $scope.open_sidebar(false)
        for (let key in $scope.dialog_flags) {
            if ($scope.dialog_flags.hasOwnProperty(key)) {
                $scope.dialog_flags[key] = false;
            }
        }
    };

    $scope.init_system_notebooks = function () {
        //listArray must contain System and Trash notebooks
        let has_sys = $scope.listArray.some(list => list.title.toLowerCase() === "system")
        let has_trash = $scope.listArray.some(list => list.title.toLowerCase() === "trash")
        if (!has_sys) {
            $scope.listArray.push(new List("System", "keyboard_command_key"))
        }
        if (!has_trash) {
            $scope.listArray.push(new List("Trash", "recycling"))
        }
    }

    $scope.empty_notebook_msg = function(){
        //show text when notebook is empty
        try {
            return get_empty_proverbs()
        } catch (err) {
            console.log(err)
        }
    }

    $scope.init_sortable_list = function(selector,array_name){
        //lets sort
        $scope.sortable = Sortable.create(document.querySelector(selector),{
            animation:250,
            dragClass: "sortable-drag",
            handle:".handle",
            onEnd:function(evt)
            {
                if(evt.newIndex!=evt.oldIndex)
                {
                    //swap items
                    const [movedItem] = $scope[array_name].splice(evt.oldIndex, 1);
                    $scope[array_name].splice(evt.newIndex, 0, movedItem);
                    $scope.saveData()
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
    //                 const [movedItem] = $scope.taskArray.splice(evt.oldIndex, 1);
    //                 $scope.taskArray.splice(evt.newIndex, 0, movedItem);
    //                 $scope.saveData()
    //             }
    //         }
    //     })
    // }

    //define all funcions above init
    $scope.init = function () {
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
        $scope.listArray = [];
        $scope.taskArray = [];
        $scope.readData();
        console.log("Read Data", $scope.listArray)
        $scope.init_system_notebooks()

        if (patchApplied) {
            //if new property added to previous version
            //save these properties now
            $scope.saveData();
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
        $scope.allTasks = $scope.getTasksOnly();
        $scope.max_notebook_title_len = 20

        $scope.edit_options = [
            { icon: "title", insert_text: "#H1" },
            { icon: "list", insert_text: "* Item" },
            { icon: "sliders", insert_text: "#50%" },
            { icon: "check_box", insert_text: "$ Task" }
        ]
        

        //default theme
        $scope.init_theme()

        //notebook more options
        $scope.notebook_more_options = []
        $scope.init_notebook_more_options()

        //try to load first or last notebook
        $scope.load_last_notebook()
        $scope.init_sortable_list(".tasks","taskArray");
        // $scope.init_sortable_list(".notebooks","listArray");
    };
    $scope.init();
}