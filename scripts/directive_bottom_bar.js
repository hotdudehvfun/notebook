function directive_bottom_bar() {
    return {
        scope: false,
        /*html*/
        template: `
            <div
            ng-class="{
                create_btns_close:!show_all_create_btns,
                create_btns_open:show_all_create_btns,
                grid_rows_one:!create_btns_arr[0]
                }"
            class="note_content_container create_btns_close grid_rows_two">
                <!-- system var button -->
                <div
                    ng-if="create_btns_arr[0]"
                    class="edit_options_container">
                    <div class="flex-row gap-1">
                        <div
                            ng-show="is_note_selected"
                            ng-class="{disabled:!show_edit_options}"
                            ng-click="show_edit_options=!show_edit_options" 
                            class="chip2">
                            <span class="material-symbols-outlined">edit_note</span>
                            <span>File</span>
                        </div>
                        <div
                            ng-class="{disabled:!show_insert_options}"
                            ng-click="show_insert_options=!show_insert_options" 
                            class="chip2">
                            <span class="material-symbols-outlined">edit_note</span>
                            <span>Insert</span>
                        </div>
                        <div 
                            ng-class="{disabled:!show_edit_options_system_vars}" 
                            ng-click="show_edit_options_system_vars=!show_edit_options_system_vars"  class="chip2">
                            <span class="material-symbols-outlined">deployed_code</span>
                            <span>System Vars</span>
                        </div>
                        <div
                            ng-class="{disabled:!dialog_flags.is_sidebar_menu_open}" 
                            ng-click="open_sidebar(true)" class="chip2">
                            <span class="material-symbols-outlined">book_ribbon</span>
                            <span>View Notebooks</span>
                        </div>
                        
                    </div>
                    
                    <div class="flex-row gap-1">
                        <!-- show note edit options when note is selected -->
                        <div
                            ng-if="show_edit_options && option.show && is_note_selected" 
                            ng-repeat="option in note_more_options"
                            class="chip mx-1" 
                            ng-click="option.action()">
                            <span class="material-symbols-outlined">{{option.icon}}</span>
                            <span>{{option.text}}</span>
                        </div>
                        <!-- sub menu for split note -->

                        <div
                            ng-if="show_split_note_btns" 
                            ng-repeat="delimiter in presets_delimiters"
                            class="chip mx-1" 
                            ng-click="split_note(delimiter)">
                            <span>{{delimiter}}</span>
                        </div>

                        <!-- show insert options -->
                        <div
                        ng-if="show_insert_options" 
                        ng-repeat="option in edit_options" 
                        class="chip" 
                        ng-click="insertTextAtCursor('note_content',option.insert_text)">
                            <span class="material-symbols-outlined">{{option.icon}}</span>
                            <span>{{option.title}}</span>
                        </div>
                    <!-- show system vars options -->
                    <div
                        ng-if="show_edit_options_system_vars"
                        class="chip"
                        ng-repeat="(key,value) in get_system_vars()"
                        ng-click="insertTextAtCursor('note_content',key)">
                            <span>{{key}}={{value}}</span>
                            <span>{{option.title}}</span>
                    </div>
                    
                    </div>
                </div>

                <!-- three buttons -->
                <div class="flex-row" style="grid-area:create_btns;">
                    <!-- note button -->
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
                </div>
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
                    <div class="flex-col">
                        <span
                        ng-hide="show_update_task_button"
                        ng-click="create_note()"
                        class="material-symbols-outlined icon-btn">arrow_upward</span>
                        <span
                        ng-show="show_update_task_button"
                        ng-click="update_note()"
                        class="material-symbols-outlined icon-btn">update</span>
                        <span
                        ng-show="show_update_task_button"
                        ng-click="cancel_update_note()"
                        class="material-symbols-outlined icon-btn">cancel</span>
                    </div>
                    
                    
                </div>
                
                <!-- create notebook div -->
                <div
                    ng-show="create_btns_arr[1]"
                    class="notebook_container">
                    <input
                        type="text"
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
                        type="text"
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
                        style="grid-column-start: 3;grid-row-start: 1;grid-row-end: 3;text-align: center;display: grid;gap: 4px;justify-content: center;">
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
        `,

    }
}