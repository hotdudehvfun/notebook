function dialog_controller($scope, notebook_service,shared_service) {
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
    
    $scope.copied_task = null; // to hold copied task for paste operation
    $scope.selected_note = null; // to hold selected note for more options
    $scope.is_note_selected = false; // to check if note is selected
    $scope.notebook_more_options = []; // to hold notebook more options
    $scope.note_more_options = []; // to hold note more options
    // $scope.current_notebook = null; // to hold current notebook for more options


    //listen to current_notebook changed event from main controller
    // $scope.$on('notebook_changed', function(e, notebook)
    // {
    //     $scope.current_notebook = notebook;
    // });
    // check if any dialog is open
    
    // listen to open sidebar event
    //because sidebar is inside dialog controller
    // but open sidebar function is in main controller
    $scope.$on('open_sidebar', function (event, data) {
        console.log("open sidebar event received", data)
        let state = data.state
        try {
            let left_val = state ? "0px" : "-90vw";
            $scope.sidebar_left = { left: left_val }
            $scope.dialog_flags.is_sidebar_menu_open = state
        } catch (err) {
            console.log("Cannot open side bar", err)
        }
    });

    
    


    

    $scope.show_notebook_lock_option = function (notebook) {
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

    $scope.init = () => {
        try {
            
        } catch (err) {
            console.log(err)
        }
    }



    




}