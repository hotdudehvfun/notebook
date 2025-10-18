function notebook_more_options_controller($scope, $rootScope, shared_service, note_service, notebook_service, db_service) {
    const set_shared = (k, v) => shared_service.set(k, v);
    const emit_toast = msg => $scope.$emit("show_toast", msg);
    $scope.notebook_more_options = []; // to hold notebook more options
    //listen to close all dialogs event from shared service
    $scope.show_dialog = false;
    $scope.$on("close_all_dialogs", function (e, data) {
        $scope.show_dialog = false;
    })
    //listen to open notebook more options menu event
    $scope.$on("open_notebook_more_options_menu", function (e, data) {
        //current notebook is available in shared service
        try {
            $scope.copied_task = shared_service.get("copied_task")
            $scope.current_notebook = shared_service.get("current_notebook")
            $scope.show_dialog = true;
            $scope.init_notebook_more_options()
        } catch (err) {
            console.log(err)
        }
    })

    //quick_notebook_changed
    //only move completed tasks requires quick notebook change
    $scope.$on("quick_notebook_changed", function (e, _notebook) {
        try {
            if(shared_service.get("quick_notebooks_action")== shared_service.CONST.MOVE_COMPLETED)
            {
                //move completed tasks to quick notebook
                const from_notebook = $scope.current_notebook;
                const to_notebook = _notebook
                $scope.current_notebook = notebook_service.move_completed_notes(from_notebook,to_notebook)
                shared_service.set("current_notebook",$scope.current_notebook)
                emit_toast(`Completed notes moved to ${to_notebook}`)
                
            }
        } catch (err) {
            $scope.$emit('show_toast', err);
        }
    });




    $scope.is_user_notebook = function (notebook) {
        if (!notebook)
            return false
        if (notebook.title.toLowerCase() == 'system')
            return false
        if (notebook.title.toLowerCase() == 'trash')
            return false
        return true
    }
    $scope.is_lockable = function(notebook){
        if (!notebook)
            return false
        if(notebook.taskArray.length==0)
            return false;
        if (notebook.title.toLowerCase() == 'system')
            return false
        if (notebook.title.toLowerCase() == 'trash')
            return false
        return true

    }

    //notebook menu
    $scope.init_notebook_more_options = () => {
        const notebook = shared_service.get("current_notebook");
        
        if (!notebook)
        {
            emit_toast("Notebook not available")
            return;
        }

        const is_trash = notebook.title?.toLowerCase() === "trash";
        const is_system = notebook.title?.toLowerCase() === "system";
        const is_user_notebook = $scope.is_user_notebook(notebook);
        const is_lockable = $scope.is_lockable(notebook)
        const has_completed = notebook_service.notebook_has_completed_tasks(notebook);
        const copied_task = $scope.copied_task;
        const menu_definitions = [
            {
                text: notebook.is_locked ? "🔓 Unlock notebook" : "🔏 Lock notebook",
                show: is_lockable,
                action: () => set_shared("show_password_popup", true)
            },
            {
                text: "🍯 Paste Task",
                show: !!copied_task,
                action: () => {
                    if(!copied_task)
                        return;
                    const updated = notebook_service.paste_task_inside_notebook(notebook, copied_task);
                    set_shared("current_notebook", updated);
                    set_shared("copied_task", null);
                }
            },
            {
                text: "📘 Rename notebook",
                show: is_user_notebook,
                action: () => $rootScope.$broadcast("open_notebook_popup", { action: "rename" })
            },
            {
                text: "🚕 Move completed tasks",
                show: has_completed,
                action: () => {
                    set_shared("quick_notebooks_action", shared_service.CONST.MOVE_COMPLETED);
                    $rootScope.$broadcast("show_quick_notebooks")
                }
            },
            {
                text: "🪏 Merge completed tasks",
                show: has_completed,
                action: () => {
                    const updated = note_service.merge_completed_notes(notebook);
                    db_service.write_notebook(updated);
                    set_shared("current_notebook", updated);
                    emit_toast("Merged completed tasks successfully");
                }
            },
            {
                text: "🗑️ Remove completed tasks",
                show: has_completed,
                action: () => {
                    if (confirm("Remove completed tasks?")) {
                        const updated = note_service.remove_completed_notes(notebook);
                        db_service.write_notebook(updated);
                        set_shared("current_notebook", updated);
                        emit_toast("Completed notes removed");
                    }
                }
            },
            {
                text: "🔄 Refresh",
                show: true,
                action: () => location.reload()
            },
            {
                text: is_trash ? "🗑️ Empty Recycling Bin" : "🧹 Delete All",
                show: !is_system,
                action: () => {
                    if (confirm("Remove all tasks?")) {
                        const updated = note_service.remove_all_notes(notebook);
                        db_service.write_notebook(updated);
                        set_shared("current_notebook", updated);
                        emit_toast("All notes removed");
                    }
                }
            },
            {
                text: "📚 Delete notebook",
                show: !$scope.only_sys_trash(notebook),
                action: () => {
                    if (confirm("Delete this notebook?")) {
                        db_service.remove_notebook(notebook);
                        set_shared("current_notebook", null);
                        $scope.$emit("notebook_deleted");
                        emit_toast("Notebook moved to Trash");
                    }
                }
            }
        ];

        // Filter and map visible items
        $scope.notebook_more_options = menu_definitions
            .filter(item => item.show)
            .map(({ text, action }) => ({
                text,
                action: () => {
                    action();
                    $scope.show_dialog = false;
                }
            }));
    };



    $scope.init = () => {
        try {

        } catch (err) {
            console.log(err)
        }
    }








}