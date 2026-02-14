function note_more_options_controller($scope, $rootScope, shared_service, note_service, notebook_service, db_service) {
    $scope.copied_task = null; // to hold copied task for paste operation
    $scope.selected_note = null; // to hold selected note for more options
    $scope.is_note_selected = false; // to check if note is selected
    $scope.note_more_options = []; // to hold note more options
    $scope.current_notebook = null; // to hold current notebook for more options
    $scope.is_note_multi_select_on = false
    $scope.show_note_complete_button = false

    //listen to close all dialogs event from shared service
    $scope.show_dialog = false;
    $scope.is_user_notebook = function (notebook) {
        if (!notebook)
            return false
        if (notebook.taskArray.length == 0)
            return false
        if (notebook.title.toLowerCase() == 'system')
            return false
        if (notebook.title.toLowerCase() == 'trash')
            return false
        return true
    }

    $scope.is_chart = (note) => {
        return note.component_type == COMPONENT.TYPE.CHART
    }

    //open more options
    $scope.open_more_options = () => {
        console.log("note more options using button")
        $scope.selected_note = shared_service.get("current_note")
        console.log($scope.selected_note)
        
        $scope.current_notebook = shared_service.get("current_notebook")
        $scope.copied_task = shared_service.get("copied_task")
        $scope.is_note_selected = true
        $scope.init_note_more_options()
        $scope.show_dialog = true;
    }


    //when note is clicked
    $scope.$on("open_note_more_options_menu", function (e, type) {
        $scope.selected_note = shared_service.get("current_note")
        let flag = true;
        if(type=='note')
        {
            //do not open if chart is clicked
            if($scope.is_chart($scope.selected_note))
                flag = false;
        }
        if(flag)
            $scope.open_more_options()
    });

    //copy task and its content
    $scope.copy_task = () => {
        try {
            if ($scope.selected_note) {
                //create new task to make a copy
                $scope.copied_task = new Task($scope.selected_note.title)
                $scope.copied_task.id = generate_id()
                shared_service.set("copied_task", $scope.copied_task)
                //also copy to clipboard
                let dummy = document.createElement("textarea")
                // dummy.setAttribute("type", "text")
                dummy.value = $scope.selected_note.title
                dummy.select()
                dummy.setSelectionRange(0, 99999)
                navigator.clipboard.writeText(dummy.value);
                $scope.show_toast("Note and content copied to clipboard");
                $scope.show_dialog = false;
                shared_service.set("show_toast", "Note and content copied to clipboard");
            } else {
                shared_service.set("show_toast", "No task selected")
            }
        } catch (err) {
            console.log("Error while copying note", err)
        }
    }

    // prepare more options when note is clicked
    $scope.init_note_more_options = () => {
        try {
            const note = $scope.selected_note;
            const is_trash = $scope.current_notebook.title.toLowerCase() === "trash";
            const is_completed = note.isTaskCompleted;
            $scope.is_trash_open = is_trash;
            const set_shared = (key, value) => shared_service.set(key, value);

            const menu_items = [
                ["📝 Edit", "edit"],
                [is_completed ? "↩️ Mark Undo" : "✅ Mark Done", is_completed ? "not_done" : "done"],
                ["🔄 Sort", "sort"],
                ["🎳 Split", "split"],
                ["☑️ Select Notes", "select"],
                ["📋 Copy", "copy"],
                ["🍯 Paste", "paste"],
                ["♻️ Restore it", "restore"],
                [is_trash ? "🧹 Remove from Trash" : "🗑 Trash it", "trash"]
            ];
            const show_items = {
                paste: $scope.copied_task != null,
                restore: is_trash,
            }

            const actions = {
                edit: () => {
                    set_shared("current_note", note);
                    shared_service.set("create_note_source","edit")
                    set_shared("show_view", shared_service.CONST.VIEW_CREATE_NOTE)
                },
                done: () => {
                    note.isTaskCompleted = true; //updated by reference
                    //move complete tasks to bottom
                    //update positions of tasks
                    $scope.current_notebook.taskArray = note_service.set_positions($scope.current_notebook.taskArray)
                    db_service.write_notebook($scope.current_notebook)
                    set_shared("current_notebook", $scope.current_notebook);
                    set_shared("show_toast", "Note completed")
                },
                not_done: () => {
                    note.isTaskCompleted = false; //updated by reference
                    db_service.write_notebook($scope.current_notebook)
                    set_shared("current_notebook", $scope.current_notebook);
                    set_shared("show_toast", "Note unmarked")
                },
                sort: () => {
                    //enable sorting
                    set_shared("sorting_mode",true)
                },
                split: () => {
                    try {
                        $scope.current_notebook.taskArray = note_service.split_note("new line", note, $scope.current_notebook.taskArray);
                        console.log($scope.current_notebook)
                        db_service.write_notebook($scope.current_notebook);
                        set_shared("current_notebook", $scope.current_notebook);
                        set_shared("show_toast", "Note split done")
                    } catch (err) {
                        console.log("Split error:", err);
                    }
                },
                select: () => {
                    set_shared("note_multi_select_on", true)
                    set_shared("show_toast", "Multi selection is on")
                },
                copy: () => $scope.copy_task(),
                paste: () => {
                    try {
                        if ($scope.copied_task) {
                            const updated = notebook_service.paste_task_inside_notebook($scope.current_notebook, $scope.copied_task);
                            set_shared("current_notebook", updated);
                            set_shared("copied_task", null);
                        } else {
                            set_shared("show_toast", "No task on clipboard!");
                        }
                    } catch (err) {
                        console.log(err)
                    }

                },
                restore: () => {
                    try {
                        const [notebook, parent_notebook] = notebook_service.restore_note($scope.current_notebook, note);
                        set_shared("current_notebook", notebook);
                        set_shared("show_toast", `Note restored to ${parent_notebook.title}`);
                    } catch (err) {
                        console.log("Delete error:", err);
                    }
                },
                trash: () => {
                    try {
                        const notebook = notebook_service.delete_note($scope.current_notebook, note);
                        set_shared("current_notebook", notebook);
                        set_shared("show_toast", !is_trash ? "Note moved to Trash" : "Note removed from Trash");
                    } catch (err) {
                        console.log("Delete error:", err);
                    }
                },
            };

            $scope.note_more_options = menu_items
                .filter(([text, key]) => !show_items.hasOwnProperty(key) || show_items[key])
                .map(([text, key]) => ({
                    text,
                    action: () => {
                        actions[key]();
                        $scope.show_dialog = false;
                    }
                }));

        } catch (err) {
            console.log("Error initializing note options:", err);
        }
    }

}