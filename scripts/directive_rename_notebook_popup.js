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
                type="text"
                name="notebook_name"
                id="rename-notebook"
                class="add-new-list-title"
                ng-model="new_list_name" 
                ng-attr-placeholder="Enter new name"
                ng-keypress="handle_input_on_rename_notebook($event)"
                autofocus/>
                    <div class="flex-row space-between m-2">
                        <span ng-click="dialog_flags.show_rename_notebook_popup=false;new_list_name=''; " class="button text-red-500">Cancel</span>
                        <span
                            ng-class="{'orange':new_list_name.length>=2}" 
                            ng-click="rename_notebook()" 
                            class="button not-active transition">Rename</span>                
                    </div>
         </div>
            </div>
        `
    }
}