function directive_new_notebook_popup()
{
    return{
        scope:false,
        /*html*/
        template:`
        <div class="new_notebook_popup_child">
         <div class="flex-col align-center gap-1">
            <div class="flex-row align-center gap-1 m-2 w-full">
             <span class="material-symbols-outlined new-list-icon" ng-bind="new_notebook_icon"></span>
             <div class="text-120">Create new notebook</div>
            </div>
             <input
                name="notebook_name"
                ng-keyup="handle_input_on_notebook($event)"
                class="add-new-list-title rounded-2"
                ng-model="new_list_name" 
                ng-attr-placeholder="New NoteBook name..."
                placeholder="New NoteBook name..."
                autofocus
                 ></input>
             <!-- using css animation class with ng-show  -->
                    <div class="flex-row space-between m-2">
                        <span ng-click="dialog_flags.show_create_notebook_popup=false" class="button text-red-500">Cancel</span>
                        <span ng-click="create_notebook()" class="button">Create</span>                
                    </div>
         </div>
            </div>
        `
    }
}