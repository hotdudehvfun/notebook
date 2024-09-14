function directive_rename_notebook_popup() {
    return {
        scope: false,
        /*html*/
        template: `
        <div class="new_notebook_popup_child">
         <div class="flex-col align-center gap-1">
            <div class="flex-row align-center gap-1 m-2">
             <span class="material-symbols-outlined new-list-icon" ng-bind="new_notebook_icon"></span>
             <div>Rename: <span>{{selectedListName}}</span></div>
            </div>
             <input
                name="notebook_name" 
                class="add-new-list-title rounded-2"
                ng-model="new_list_name" 
                ng-attr-placeholder="Enter new name"
                ng-keypress="handle_input_on_rename_notebook($event)"
                autofocus></input>
                    <div class="flex-row space-between m-2">
                        <span ng-click="dialog_flags.show_rename_notebook_popup=false;new_list_name=''; " class="button text-red-500">Cancel</span>
                        <span ng-click="rename_notebook()" class="button">Rename</span>                
                    </div>
         </div>
            </div>
        `
    }
}