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
                    <div class="chip2">
                        <span class="material-symbols-outlined">edit_note</span>
                        <span>Edit Options</span>
                    </div>
                    <div 
                        ng-repeat="option in edit_options" 
                        class="chip" 
                        ng-click="insertTextAtCursor('note_content',option.insert_text)">
                        <span class="material-symbols-outlined">{{option.icon}}</span>
                        <span>{{option.title}}</span>
                    </div>
                    <div class="chip2">
                        <span class="material-symbols-outlined">deployed_code</span>
                        <span>System Vars</span>
                    </div>
                    <div
                        class="chip"
                        ng-repeat="(key,value) in get_system_vars()"
                        ng-click="insertTextAtCursor('note_content',key)"
                        >
                        <span>{{key}}={{value}}</span>
                        <span>{{option.title}}</span>
                    </div>
                </div>

                <div class="flex-row" style="grid-area:create_btns;">
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
                    <span
                    ng-hide="show_update_task_button"
                    ng-click="create_note()"
                    class="material-symbols-outlined icon-btn">arrow_upward</span>
                    <span
                    ng-show="show_update_task_button"
                    ng-click="update_note()"
                    class="material-symbols-outlined icon-btn">upgrade</span>
                </div>
                
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