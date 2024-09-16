function directive_top_bar() {
    return {
        scope: false,
        /*html*/
        template: `
        <!-- app title -->
         <div class="flex">
            <span ng-click="open_sidebar(true)" class="material-symbols-outlined">menu</span>
         </div>
        <div class="flex-row flex gap-1">
            <span class="material-symbols-outlined">
                {{default_app_icon}}
            </span>
            <div 
                class="app-title"
                ng-click="handle_click_on_notebook_title()">
                {{pageTitle}}
            </div>
        </div>
        <div class="flex-row flex align-center justify-end gap-1">
            <span 
            ng-click="show_searchbar=!show_searchbar"
            class="material-symbols-outlined">search
            </span>
            <!-- <span 
            ng-click="toggle_data_lock()"
            class="material-symbols-outlined">{{is_data_locked?'lock':'lock_open';}}
            </span> -->
            
            <span
                style="z-index: 999;" 
                class="material-symbols-outlined"
                ng-click="handle_click_on_more_vert()" 
                ng-bind="nav_more_vert_icon()"></span>
        </div>
        `,

    }
}