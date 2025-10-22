function shared_service($rootScope) {
    //define keys for shared state
    let state = { 
            current_notebook: null, 
            current_note: null,
            show_password_popup: false,
            quick_notebooks_action: null,
            quick_notebook:null,
            note_multi_select_on:false,
            copied_task:null,
            show_toast:"",
            show_sidebar:false,
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
        VIEW_BIN:"bin"
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