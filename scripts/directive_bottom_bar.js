function directive_bottom_bar() {
    return {
        scope: false,
        /*html*/
        template: `
            <div class="note_content_container">
                <!-- system var button -->    
                <span 
                    ng-click="choose_create_btn(0)"
                    ng-show="create_btns_arr[0] || show_all_create_btns"
                    class="material-symbols-outlined icon-btn visible_pop_animation">edit_note</span>
                <!-- notebook button -->
                <span 
                    ng-click="choose_create_btn(1)"
                    ng-show="create_btns_arr[1] || show_all_create_btns" 
                    class="material-symbols-outlined icon-btn visible_pop_animation">auto_stories</span>
                <!-- system var button -->
                <span 
                    ng-click="choose_create_btn(2)"
                    ng-show="create_btns_arr[2] || show_all_create_btns" 
                    class="material-symbols-outlined icon-btn visible_pop_animation">keyboard_command_key</span>
                <div
                    ng-show="create_btns_arr[0]"
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
                    ng-show="create_btns_arr[0]"
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


                <!-- create notebook div -->
                <div
                    ng-show="create_btns_arr[1]"
                    class="notebook_container">
                    <input
                        name="notebook_name"
                        ng-keyup="handle_input_on_notebook($event)"
                        class="add-new-list-title rounded-2"
                        ng-model="new_list_name" 
                        ng-attr-placeholder="New NoteBook name..."
                        placeholder="New NoteBook name..."
                        autofocus/>
                    <span
                        ng-click="create_notebook()"
                        class="material-symbols-outlined icon-btn">arrow_upward</span>
                </div>
                <!-- create system var -->
                <div
                    ng-show="create_btns_arr[2]"
                    class="system_var_container">
                    <input
                        name="system_var_name" 
                        class="system_var_input"
                        ng-model="new_var_name" 
                        placeholder="Variable name"
                        style="grid-column-start: 1;grid-column-end: 3;"/>
                    <input
                        name="system_var_value"
                        type="text"
                        class="system_var_input"
                        ng-model="new_var_value" 
                        placeholder="Variable value"
                        style="grid-column-start: 1;grid-column-end: 3;"/>
                    <div
                        style="
    grid-column-start: 3;
    grid-row-start: 1;
    grid-row-end: 3;
    text-align: center;
    display: grid;
    gap: 4px;
    justify-content: center;">
                    <span
                        ng-click="create_system_var()"
                        class="material-symbols-outlined icon-btn">arrow_upward</span>
                    <span
                        ng-if="show_delete_system_var_button"
                        ng-click="delete_system_var()"
                        class="material-symbols-outlined icon-btn">delete</span>
                        
                    </div>
                    
                </div>
                

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