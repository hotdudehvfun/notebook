function directive_sidebar(){
    return{
      scope:false,
      /* html */
      template:`
      <div>
              <span 
              ng-click="open_sidebar(false)" 
              class="material-symbols-outlined">close</span>
          </div>
          <div class="flex-row">
              <h2>{{greet_user('528491')}}</h2>
          </div>
          
          <!-- show all notebooks -->
          


          <!-- settings -->
          <div class="flex-col rounded-3/4 border m-1/2">
            <h2 class="mt-2">Settings</h2>
            <div class="flex-row space-between">
                <h4>App Size</h4>
                <h4>{{app_size()}}</h4>
            </div>

            <div class="flex-row space-between">
                <h4>Enable dark theme</h4>
                <div style="transform: scale(.65);">
                    <input
                    ng-model="is_dark"
                    ng-change="save_theme()" type="checkbox" id="type2" class="toggle_checkbox"/>
                    <label for="type2" class="toggle_label">
                        <span class="toggle_span"></span>
                    </label>
                </div>
            </div>
            
            <div class="flex-row space-between">
                <h4>Show complete button</h4>
                <div style="transform: scale(.65);">
                    <input
                    ng-model="show_note_complete_button"
                    type="checkbox" id="type3" class="toggle_checkbox"/>
                    <label for="type3" class="toggle_label">
                        <span class="toggle_span"></span>
                    </label>
                </div>
            </div>

            <div class="flex-row space-between">
                <h4>Rearrange notebooks and notes</h4>
                <div style="transform: scale(.65);">
                    <input
                        ng-model="is_sortable"
                        type="checkbox" id="type4" class="toggle_checkbox"/>
                        <label for="type4" class="toggle_label">
                            <span class="toggle_span"></span>
                        </label>
                </div>
            </div>

            <div class="flex-row space-between align-center">
                <h4>Import/Export</h4>
                <div 
                    ng-click="close_all_dialogs(); dialog_flags.show_db_popup = true;"
                    class="button">Open Database</div>
            </div>
            
          </div>
      `
    }
  }