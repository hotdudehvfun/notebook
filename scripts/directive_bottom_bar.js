function directive_bottom_bar() {
    return {
        scope: false,
        /*html*/
        template: `
                <div
                    ng-class="{active:dialog_flags.show_create_notebook_popup}"
                    class="bottom-bar-button button" 
                    ng-click="dialog_flags.show_create_notebook_popup=true">
                    <span class="material-symbols-outlined">contract_edit</span>
                    <span class="">NoteBook</span>
                </div>
                <div 
                    ng-class="{active:dialog_flags.show_create_task_popup}"
                    class="bottom-bar-button button" 
                    ng-click="open_create_new_note_popup()">
                    <span class="material-symbols-outlined">draw</span>
                    <span class="">Note</span>
                </div> 
                <div 
                    ng-class="{active:dialog_flags.show_create_system_var_popup}"
                    class="bottom-bar-button button" 
                    ng-click="open_create_system_var_popup()">
                    <span class="material-symbols-outlined">keyboard_command_key</span>
                    <span class="">System Var</span>
                </div> 
                <div 
                    ng-class="{active:dialog_flags.is_sidebar_menu_open}"
                    class="bottom-bar-button button" 
                    ng-click="open_sidebar(true)">
                    <span class="material-symbols-outlined">apps</span>
                    <span class="">View Notebooks</span>
                </div> 
        `,

    }
}