function main_controller($scope, $timeout, db_service) {

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
        try {
            if ($scope.current_notebook) {
                let ms = $scope.current_notebook.dateCreated
                return `Created: ${timeSince(ms)}`
            }
            return "Notebook is very old"
        } catch (err) {
            console.log("Error while getting notebook age",err)
        }
    }

    $scope.open_notebook = function (notebook) {
        try {
            if (notebook) {
                console.log("opening notebook",notebook)
                $scope.current_notebook = notebook;
                $scope.selectedListIndex = $scope.notebooks.indexOf(notebook);
                $scope.notes = notebook.taskArray;
                $scope.selectedListName = notebook.title;
                $scope.pageTitle = notebook.title;
                $scope.show_delete_list_option = true
                $scope.show_purge_list_option = true
                $scope.show_rename_list_option = true
                
                if(notebook.icon)
                    $scope.default_app_icon = notebook.icon
                else
                    $scope.default_app_icon = "eco"
                
                $scope.note_content_placeholder = `Create task in ${$scope.selectedListName}`
                $scope.open_sidebar(false)
                $scope.save_data()
            }
        } catch (err) {
            console.log("Error while opening notebook",err)
        }
    }

    $scope.open_sidebar = function (state) {
        try {
            let left_val = state ? "0px" : "-90vw";
            $scope.sidebar_left = { left: left_val }
            $scope.dialog_flags.is_sidebar_menu_open = state
        } catch (err) {
            console.log("Cannot open side bar",err)
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
                $scope.create_notebook()
                e.target.value = "";
            } else {
                $scope.new_notebook_icon = getIconForTitle($scope.new_list_name)
            }
        } catch (err) {
            console.log(err)
        }
    }



    //rename to notebook
    $scope.get_notebook_icon = function (notebook) {
       try {
         if (notebook.hasOwnProperty("icon"))
             return notebook.icon
         else
             return "folder"
       } catch (err) {
        console.log(err)
       }
    }

    $scope.insertTextAtCursor = function (id, value) {
        insertTextAtCursor(id, value)
    }

    $scope.get_notebook_info = function (notebook) {
        try {
            let title = notebook.title
            if (title.toLowerCase() == "system") {
                return Object.keys(system_vars).length
            }
            var completed = notebook.taskArray.filter(function (note) { return note.isTaskCompleted == true }).length;
            if (completed == 0)
                return notebook.taskArray.length;
            return `${completed}/${notebook.taskArray.length}`
        } catch (err) {
            console.log("Failed to get notebook info",err)
        }
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




    // create note: Optimized
    $scope.create_note = () => {
        try {
            const taskContent = $scope.note_content.trim();
            if (taskContent.length > 0 && $scope.selectedListIndex>=0) {
                let tasks = split_text_into_tasks(taskContent, "$");
                // Determine if adding single or multiple tasks
                tasks = tasks.length > 0 ? tasks : [taskContent];
                // Add tasks to the selected notebook
                tasks.forEach(item => {
                    let newTask = new Task(item);
                    newTask.taskIcon = $scope.icons.unchecked;
                    $scope.notebooks[$scope.selectedListIndex].taskArray.push(newTask);
                });
    
                $scope.notes = $scope.notebooks[$scope.selectedListIndex].taskArray;
    
                // Reset input and dialog states
                $scope.note_content = "";
                $scope.note_textarea_container_height = 45;
                $scope.pageTitle = $scope.selectedListName;
                // Save data and show toast notification
                $scope.save_data();
                const toastText = tasks.length > 1 ? `${tasks.length} Notes added` : "Note added";
                $scope.show_toast(toastText);
            }
        } catch (err) {
            console.error(err);
            $scope.show_toast("Failed to create note");
        }
    };
    

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
        insertTextAtCursor('note_content', $scope.selected_system_var)
    }

    $scope.lock_data = () => {
        try {
            if($scope.is_notebook_locked())
            {
                alert("Notebook is already locked")
                return "";
            }
            $scope.notes.forEach((data, index) => {
                data.title = encrypt_data(data.title, $scope.password)
            })
            $scope.password = ""
            $scope.notebooks[$scope.selectedListIndex].is_locked = true;
            $scope.save_data()
            $scope.close_all_dialogs()
            $scope.show_toast("Notebook is locked")
        } catch (err) {
            $scope.show_toast("Cannot lock Notebook")
            console.log("Lock data",err)
        }
    }

    $scope.unlock_data = () => {
        try {
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
    
    $scope.save_theme = ()=>{
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
            // console.log("saving index",$scope.selectedListIndex)
            db_service.write(
                {
                    notebooks: $scope.notebooks,
                    selectedListIndex: $scope.selectedListIndex,
                    theme: _theme,
                    system_vars: system_vars
                }, angular
            )
        } catch (err) {
            console.log("Save data error",err)
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
            
            //load last notebook
            $scope.selectedListName = $scope.notebooks[$scope.selectedListIndex].title
            $scope.open_notebook($scope.notebooks[$scope.selectedListIndex])
            
            //set up system notebooks
            $scope.init_system_notebooks()
        } catch (err) {
            console.log("Read data error",err)
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
            console.log("Error while deleting notebook",err)
        }
    }

    $scope.handle_tap_on_note = function (note) {
        try {
            console.log(note)
            $scope.selected_note = note;
            $scope.dialog_flags.show_task_more_options = true
            $scope.task_completed_state = note.isTaskCompleted
        } catch (err) {
            console.log("Error",err)
        }
    }
    
    $scope.handle_remove_completed_tasks = () => {
        try {
            if(confirm("Are you sure?"))
            {
                $scope.notes = $scope.notes.filter(note => !note.isTaskCompleted)
                $scope.notebooks[$scope.selectedListIndex].taskArray = $scope.notes
                $scope.save_data()
                $scope.close_all_dialogs()
                $scope.show_toast("Notes deleted");
            }
        } catch (error) {
            console.log("Cannot remove completed notes",error)
        }
    }


    $scope.delete_task = () => {
        if (confirm("Are you sure?")) {
            // Remove the selected task
            $scope.notes = $scope.notes.filter(task => task !== $scope.selected_note);
            $scope.notebooks[$scope.selectedListIndex].taskArray = $scope.notes;
            
            if($scope.current_notebook.title.toLowerCase()!='trash')
            {
                const has_trash_notebook = $scope.notebooks.find(notebook => notebook.title.toLowerCase() === "trash");
                if (has_trash_notebook) {
                    has_trash_notebook.taskArray.push($scope.selected_note);
                }
                $scope.show_toast("Note moved to Trash");
            }else{
                $scope.show_toast("Note deleted");
            }
            $scope.save_data();
            $scope.close_all_dialogs();
        }
    };
    


    $scope.copy_task = () => {
        try {
            if ($scope.selected_note) {
                //create new task to make a copy
                $scope.copied_task = new Task($scope.selected_note.title)
                $scope.show_toast("Task Copied");
                $scope.close_all_dialogs()
            }
        } catch (err) {
            $scope.show_toast("Failed to copy");
            console.log("Error while copying note", err)
        }

    }

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
        $scope.note_textarea_container_height = 300

        // var textarea = document.querySelector('#note_content');
        // const h = calculate_height_based_on_lines($scope.note_content, $scope.textarea_max_height)
        // textarea.style.height = `${h + 40}px`;
    }

    // update task in popup
    $scope.update_note = () => {
        try {
            $scope.selected_note.title = $scope.note_content.trim()
            $scope.show_update_task_button = false
            $scope.note_content = ""
            $scope.note_textarea_container_height = 45
            $scope.save_data()
            $scope.show_toast("Note updated");
        } catch (err) {
            $scope.show_toast("Error while updating note")
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
            return `App storage is ${(totalSize / 1024).toFixed(2)} kb`
        } catch (err) {
            console.log("App size error",err)
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
                    $scope.note_textarea_container_height = Math.min(textarea.scrollHeight + 30,300)
                }

            }
            if($scope.note_content.length==0)
            {
                $scope.note_textarea_container_height = 45;
                console.log("empty")
            }           
        } catch (error) {
            console.log(error)
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


    $scope.is_notebook_locked = ()=>{
        $scope.current_notebook = $scope.notebooks[$scope.selectedListIndex]
        if($scope.current_notebook.hasOwnProperty("is_locked"))
        {
            return $scope.current_notebook.is_locked
        }
        return false
    }
    //options shown when notebook is clicked
    $scope.init_notebook_more_options = () => {
        $scope.notebook_more_options = [
            {
                text: $scope.app_size(),
                icon: "cloud",
                class: "task-more-options-item",
                show: true,
                action: () => { }
            },{
                text:$scope.is_notebook_locked()?"Unlock notebook":"Lock notebook",
                icon: "password",
                class: "task-more-options-item",
                show: true,
                action: () => { $scope.dialog_flags.show_password_popup=true}
            },{
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
            },{
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
            },{
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



    //options shown when note is clicked
    $scope.init_note_more_options = () => {
        $scope.note_more_options = [
            {
                text: "Update note",
                icon: "edit",
                class: "task-more-options-item",
                show: true,
                action: () => { $scope.open_update_task_popup() }
            }, {
                text: "Copy note",
                icon: "file_copy",
                class: "task-more-options-item",
                show: true,
                action: () => {$scope.copy_task()}
            }, {
                text:"Paste inside note",
                icon: "content_paste",
                class: "task-more-options-item",
                show: $scope.copied_task!=null,
                action: () => {
                    $scope.paste_task()
                }
            }, {
                text: "Delete note",
                icon: "delete",
                class: "task-more-options-item",
                show: true,
                action: () => { $scope.delete_task() }
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

    $scope.handle_note_edit_option_change = () => {
        if($scope.note_edit_selected_option)
        {
            $scope.insertTextAtCursor("note_content",$scope.note_edit_selected_option)
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
        //System 2nd last, Trash at last
        let sys_i = -1, trash_i = -1
        $scope.notebooks.forEach((notebook,index)=>{
            if(notebook.title.toLowerCase()=="system")
                sys_i=index;
            if(notebook.title.toLowerCase()=="trash")
                trash_i=index;
        })
        if (sys_i==-1) {
            $scope.notebooks.push(new List("System", "keyboard_command_key"))
        }
        if (trash_i==-1) {
            $scope.notebooks.push(new List("Trash", "recycling"))
        }
    }

    // sort notes and notebooks: Optimized
    $scope.init_sortable_list = function (selector, array_name) {
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
    $scope.exclude_sys_trash = function(notebook) {
        return notebook.title.toLowerCase() !== 'system' && notebook.title.toLowerCase() !== 'trash';
    }
    
    // filter to show only system and trash notebook: Optimized
    $scope.only_sys_trash = function(notebook) {
        return notebook.title.toLowerCase() == 'system' || notebook.title.toLowerCase() == 'trash';
    }

    $scope.toggle_lock_on_notebook = ()=>{
        console.log()
        let notebook = $scope.notebooks[$scope.selectedListIndex];
        if(notebook.hasOwnProperty('is_locked'))
        {
            //toggle lock
        }else{
            //create property lock
        }
    }

    $scope.choose_create_btn = (pos)=>{
        let toast_txts = ["Creat notes","Create notebook","System vars"]
        if(!$scope.show_all_create_btns)
        {
            //open all so user can choose
            // $scope.create_btns_arr = [true,true,true]
            $scope.show_all_create_btns = true
        }else{
            //all are open now user can choose one
            $scope.create_btns_arr = [false,false,false]
            $scope.create_btns_arr[pos] = true
            $scope.show_toast(toast_txts[pos])
            $scope.show_all_create_btns = false
        }
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
            show_password_popup:false,
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

        $scope.create_btns_arr = [true,false,false]
        $scope.show_all_create_btns = false
        

        $scope.show_searchbar = false
        $scope.textarea_default_height = 64
        $scope.textarea_max_height = 200
        $scope.new_notebook_icon = "folder"

        //icons
        $scope.icons = {
            checked: "radio_button_checked",
            unchecked: "radio_button_unchecked"
        }
        
        //default values
        $scope.defaultPageTitle = "Notebooks";
        $scope.default_app_icon = "eco"
        $scope.pageTitle = $scope.defaultPageTitle;
        $scope.copied_task = null

        //enable select notebooks
        $scope.select_notebooks = false
        $scope.selected_notebooks = []
        $scope.select_notebooks_menu_text = "Select Notebooks"
        
        // input values
        $scope.note_content = ""
        $scope.new_list_name = ""
        $scope.selected_note = null;
        $scope.note_content_placeholder = "Create note"
        $scope.new_var_name = ""
        $scope.new_var_value = ""
        $scope.max_notebook_title_len = 20
        $scope.note_textarea_container_height = 45
        
        // edit options for new note
        $scope.edit_options = [
            { icon: "title", insert_text: "#H1", title: "Heading" },
            { icon: "list", insert_text: "* Item", title: "List" },
            { icon: "sliders", insert_text: "#50%", title: "Progress bar" },
            { icon: "check_box", insert_text: "$ ", title: "Split notes" }
        ]

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
        $scope.init_note_more_options()

        //make notebook and notes sortable
        $scope.init_sortable_list(".tasks", "notes");
        $scope.init_sortable_list(".notebooks","notebooks");
    };
}