function directive_bottom_bar() {
    return {
        scope: false,
        /*html*/
        template: `
            <div
                ng-class="{
                create_btns_close:!show_all_create_btns,
                create_btns_open:show_all_create_btns,
                }"
            class="note_content_container create_btns_close grid_rows_two">
                <div class="edit_options_container">
                    <!-- title -->
                    <div class="botom_bar_title" ng-if="show_view=='notebooks'">
                        Open a new notebook
                    </div>
                    <div class="botom_bar_title" ng-if="show_view=='notes'">
                        {{note_content_placeholder}}
                    </div>
                    
                    <!-- menu buttons -->
                    <div class="flex-row gap-1 scroll-y w-full">
                        <div
                            ng-repeat="item in bottom_bar_menu"
                            ng-show="item.show"
                            ng-class="{'chip2-selected': item.is_selected}" 
                            ng-click="item.action(item)" 
                            class="chip2">
                            <span class="material-symbols-outlined">{{item.icon}}</span>
                            <span>{{item.text}}</span>
                        </div>
                    </div>
                    
                    <div class="flex-row gap-1 scroll-y w-full">
                        <!-- bottom bar sub menu items -->
                        <div
                            ng-repeat="submenu_item in current_bottom_bar_active_menu"
                            class="chip mx-1" 
                            ng-show="submenu_item.show"
                            ng-click="submenu_item.action()">
                            <span class="material-symbols-outlined">{{submenu_item.icon}}</span>
                            <span>{{submenu_item.text}}</span>
                        </div>


                        

                        <!-- show component options -->
                        <div
                            ng-if="show_component_options" 
                            class="chip">
                            <span>{{get_component_details()}}</span>
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
                <div class="flex-row gap-1 switch-btns-container" style="grid-area:create_btns;">
                    <!-- note button -->
                    <span 
                        ng-click="choose_create_btn(0)"
                        ng-show="create_btns_arr[0] || show_all_create_btns"
                        class="material-symbols-outlined icon-btn visible_pop_animation teal">stylus_note</span>
                    <!-- notebook button -->
                    <span 
                        ng-click="choose_create_btn(1)"
                        ng-show="create_btns_arr[1] || show_all_create_btns" 
                        class="material-symbols-outlined icon-btn visible_pop_animation yellow">auto_stories</span>
                    <!-- system var button -->
                    <span 
                        ng-click="choose_create_btn(2)"
                        ng-show="create_btns_arr[2] || show_all_create_btns" 
                        class="material-symbols-outlined icon-btn visible_pop_animation red">keyboard_command_key</span>
                </div>
                <div
                    ng-show="create_btns_arr[0]"
                    class="note_textarea_container">
                    <textarea
                        ng-style="{'height':note_textarea_container_height+'px'}"
                        ng-model="note_content"
                        ng-keyup="handle_keypress_note_input($event)"
                        id="note_content"
                        class="new-task-content" 
                        placeholder={{note_content_placeholder}}
                        autofocus>
                    </textarea>
                    <div class="flex-col gap-1 align-center m-1">
                        <span
                            ng-hide="show_update_task_button"
                            ng-click="create_note()"
                            class="material-symbols-outlined icon-btn green">add_circle</span>
                        <span
                            ng-show="show_update_task_button"
                            ng-click="update_note()"
                            class="material-symbols-outlined icon-btn green">edit_square</span>
                        <span
                            ng-show="note_content.length>=1"
                            ng-click="cancel_update_note()"
                            class="material-symbols-outlined icon-btn red">cancel</span>
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
                        class="material-symbols-outlined icon-btn yellow">arrow_upward</span>
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