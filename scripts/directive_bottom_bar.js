function directive_bottom_bar() {
    return {
        scope: false,
        /*html*/
        template: `
        
            <div class="note_content_container">
                <span class="material-symbols-outlined icon-btn">folder</span>
                <div
                    ng-style="{'height':note_textarea_container_height+'px'}"
                    class="note_textarea_container">
                    <textarea
                        ng-model="note_content"
                        ng-keyup="handle_keypress_note_input($event)"
                        id="note_content"
                        class="new-task-content" 
                        placeholder={{note_content_placeholder}}
                        autofocus>
                    </textarea>
                    <span
                    ng-hide="show_update_task_button"
                    ng-click="create_note()"
                    class="material-symbols-outlined icon-btn">arrow_upward</span>
                    <span
                    ng-show="show_update_task_button"
                    ng-click="update_note()"
                    class="material-symbols-outlined icon-btn">upgrade</span>
                </div>
                <!--
                <span 
                ng-click="open_edit_options()"
                class="material-symbols-outlined">apps</span>
                -->
                <select
                ng-change="handle_note_edit_option_change()"
                ng-model="note_edit_selected_option"
                name="notes_edit_options"
                class="select edit_options">
            <option value="">Edit</option>
            <optgroup label="Edit options">
                <option
                    ng-repeat="option in edit_options"
                    ng-value="option.insert_text"
                    >{{option.title}}</option>
            </optgroup>
            <optgroup label="System Variables">
                <option 
                ng-repeat="(key,value) in get_system_vars()"
                ng-value="key"
                >{{key}} = {{value}}</option>
            </optgroup>
        </select>

            </div>
            <!-- 
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
                content bar -->
        `,

    }
}