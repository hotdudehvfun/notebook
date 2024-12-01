function directive_delimit_popup()
{
    return{
        scope:false,
        /*html*/
        template:`
        <div class="new_notebook_popup_child">
         <div class="flex-col align-center gap-1">
            <div class="flex-row align-center gap-1 m-2 w-full">
             <span
                class="material-symbols-outlined new-list-icon">password</span>
             <div class="text-120">Enter password</div>
            </div>
             <input
                name="password"
                type="password"
                class="add-new-list-title rounded-2"
                ng-model="password" 
                placeholder="Enter the password"></input>
            <div class="flex-row space-between m-2">
                <span ng-click="dialog_flags.show_password_popup=false" class="button text-red-500">Cancel</span>
                <span 
                    ng-hide="is_notebook_locked()" 
                    ng-click="lock_data()" 
                    class="button">Lock Data
                </span>
                <span 
                    ng-show="is_notebook_locked()" 
                    ng-click="unlock_data()" 
                    class="button">Unlock Data
                </span>
            </div>
         </div>
        </div>
        `
    }
}