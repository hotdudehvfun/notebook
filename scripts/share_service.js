function shared_service($rootScope) {
    //define keys for shared state
    let state = {
            //VIEWS
            create_note_popup:false,
            show_tag_list:false,
            show_var_list:false,
            show_bin:false,
            show_notebook_list:false,
            show_note_list:false,
            show_sidebar:false,
            show_password_popup: false,
            //STATES
            current_notebook: null, 
            current_note: null,
            quick_notebooks_action: null,
            quick_notebook:null,
            note_multi_select_on:false,
            copied_task:null,
            show_toast:"",
            create_note_source:"create",

    };
    let CONST = {
        MOVE: "move",
        MOVE_COMPLETED:"move completed",
        OPEN: "open",
        VIEW_CREATE_NOTE: "create_note",
        GET:"get",
        VIEW_NOTEBOOK: "notebook",
        VIEW_NOTE: "note",
        VIEW_SYSTEM: "system_var",
        VIEW_TAG: "tag",
        VIEW_BIN:"bin",
        
    }
    this.CONST = CONST;

    //set keys from anywhere and broadcast change event
    this.set = function(key, val) {
        state[key] = val;
        $rootScope.$broadcast(key + '_changed', val);
    };

    //get keys from anywhere
    this.get = function(key) {
        return state[key];
    };
}