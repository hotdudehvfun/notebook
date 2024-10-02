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
              <h2>Hello Arun</h2>
          </div>
          <div class="flex-row align-center">
              <h3>Dark theme</h3>
              <div style="transform: scale(.8);">
                  <input
                  ng-model="is_dark"
                  ng-change="save_theme()" type="checkbox" id="type2" class="toggle_checkbox"/>
                  <label for="type2" class="toggle_label">
                      <span class="toggle_span"></span>
                  </label>
              </div>
          </div>
          
          
          <h3 class="mt-2">Your notebooks</h3>
          <div class="notebook_count">
              {{get_total().total_tasks}} tasks {{get_total().total_notebooks}} notebooks
          </div>
          <!-- show all notebooks -->
          <div class="scroll-y flex-col m-1/2 rounded-3/4 border h-60vh">
              <ul class="notebooks reset_ul">
                  <li ng-repeat="(key, value) in notebooks | filter:exclude_sys_trash">
                      <div class="list-panel-item" >
                          <div 
                          class="list-panel-item-title"
                          ng-class="{system:value.title.toLowerCase()=='system',trash_color:value.title.toLowerCase()=='trash'}"
                          >
                              <!-- show when selected -->
                              <span
                              ng-show="select_notebooks"
                              class="material-symbols-outlined notebook_icon"
                              ng-bind="notebook_selected_state(key)"></span>
                              <span
                              class="material-symbols-outlined icon-btn"
                              ng-bind="get_notebook_icon(value)"
                              ng-hide="select_notebooks"
                              ></span>
                              <article ng-click="open_notebook(value)" class="selected" ng-bind="value.title"></article>
                              <span 
                              class="list-sub-text"
                              ng-bind="get_notebook_info(value)"></span>
                              <span ng-show="is_sortable" class="material-symbols-outlined handle p-1/2">drag_handle</span>
                          </div>
                      </div>
                  </li>
                  <!-- show system and trash notebook -->
                  <li ng-repeat="(key, value) in notebooks | filter:only_sys_trash">
                      <div class="list-panel-item" >
                          <div class="list-panel-item-title">
                              <!-- show when selected -->
                              <span
                                  class="material-symbols-outlined icon-btn green-btn"
                                  ng-bind="get_notebook_icon(value)">
                              </span>
                              <article ng-click="open_notebook(value)" class="selected" ng-bind="value.title">
                              </article>
                              <span 
                                  class="list-sub-text" 
                                  ng-bind="get_notebook_info(value)">
                              </span>
                              <span 
                                  ng-show="is_sortable" 
                                  class="material-symbols-outlined handle p-1/2">
                                  drag_handle
                              </span>
                          </div>
                      </div>
                  </li>
  
              </ul>
          </div>
      `
    }
  }