function directive_create_note_layout() {
    return{
        scope:false,
        /*html*/
        template:`
            <!-- title -->
            <div class="botom_bar_title">
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

            <!-- bottom bar sub menu items -->
            <div class="flex-row gap-1 scroll-y w-full">
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
        
            <!-- note input -->
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
            </div>
            <!-- note buttons -->
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
        `
    }
}