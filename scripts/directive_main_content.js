function directive_main_content(){
    return{
        scope:false,
        /*html*/ 
        template:`
            <!-- search bar -->
            <div
                class="flex-row align-center bg-list-bg rounded-full px-2 m-2 border"
                ng-show="show_searchbar">
                <span class="material-symbols-outlined">search</span>
                <input
                    name="search" 
                    id="search-box" 
                    ng-model="search" 
                    ng-attr-placeholder="Search"
                    value="">
                </input>
            </div>
            
            <!-- search results start-->
            <div id="search-results" ng-show="search.length>0">
                <div style="text-align: center;font-size: 125%;">Search Results: Under Construction</div>
                <!-- <div style="text-align: center;font-size: 85%;">Results found: {{filtered_search.length}}</div>
                <div ng-repeat="task in filtered_search = (allTasks | filter: search | limitTo: 10)">
                    <div class="task" ng-click="">
                        <span class="material-symbols-outlined" ng-bind="task.taskIcon"></span>
                        <span ng-bind-html="parse_markdown_to_html(task.title) | sanitize"></span>
                    </div>
                </div> -->
            </div>



            <!-- notebooks -->
            <div ng-show="show_view=='notebooks'">
            <h2 class="mt-2">Your notebooks</h2>
            <div class="notebook_count">
              {{get_total().total_tasks}} tasks in {{get_total().total_notebooks}} notebooks
            </div>
              <ul class="notebooks reset_ul">
                  <li
                    ng-click="open_notebook(value)" 
                    ng-repeat="(key, value) in notebooks" 
                    class="notebooks_li">
                      <div class="list-panel-item" >
                          <div class="list-panel-item-title">
                              <!-- show when selected -->
                              <span
                              ng-show="select_notebooks"
                              class="material-symbols-outlined notebook_icon"
                              ng-bind="notebook_selected_state(key)"></span>
                              <!-- notebook icon -->
                              <span
                              class="material-symbols-outlined icon-btn teal"
                              ng-bind="get_notebook_icon(value)"
                              ng-hide="select_notebooks"></span>
                              
                              <article class="selected" ng-bind="value.title"></article>
                              
                              <span 
                              class="list-sub-text"
                              ng-bind="get_notebook_info(value)"></span>

                              <span ng-show="is_sortable" class="material-symbols-outlined handle p-1/2">drag_handle</span>
                          </div>
                      </div>
                  </li>
              </ul>                
            </div>


            <!-- notes -->
            <div ng-show="show_view=='notes'">
                <!-- normal tasks -->
                <div class="notebook_age">
                    <span class="material-symbols-outlined" style="font-size:20px;">schedule</span>&nbsp; {{notebook_age()}}
                </div>
                
                <div 
                    ng-hide="selectedListName.toLowerCase()=='system'" 
                    class="group_by_text">{{notes.length}} tasks
                </div>
                
                <ul
                    ng-hide="is_notebook_locked()"
                    class="tasks reset_ul">
                    <li 
                    data-index="{{$index}}" 
                    ng-repeat="note in notes | filter:{isTaskCompleted:false}">
                        <div
                        class="task" 
                        ng-class="{completed: note.isTaskCompleted}">
                            
                            <!-- note content -->
                            <div
                                ng-class="{selected:selected_note==note}"
                                class="task-content-div"
                                ng-bind-html="parse_markdown_to_html(note.title) | sanitize"
                                ng-dblclick="handle_dbl_tap_on_note(note);"
                                ng-click="handle_tap_on_note(note);"></div>
                            <!-- complete button -->
                            <span
                                ng-show="show_note_complete_button || selected_note==note" 
                                class="material-symbols-outlined" 
                                ng-bind="note.taskIcon"
                                ng-click="toggle_note_completed_state(note)"></span>
                            <!-- drag handle -->
                            <span ng-show="is_sortable" class="material-symbols-outlined handle p-1/2">drag_handle</span>
                        </div>
                    </li>
                </ul>
             
                <!-- show completed tasks if any -->
                <div 
                ng-show="notebook_has_completed_tasks()"
                class="group_by_text"
                >{{count_completed_notes()}} completed notes</div>
                <div ng-repeat="note in notes | filter:{isTaskCompleted:true}">
                    <div class="task" ng-class="{completed: note.isTaskCompleted}">
                        <span 
                            class="material-symbols-outlined" 
                            ng-bind="note.taskIcon"
                            ng-click="toggle_note_completed_state(note)"></span>
                        <div  
                            class="task-content-div"
                            ng-bind-html="parse_markdown_to_html(note.title) | sanitize"
                            ng-click="handle_tap_on_note(note);">
                        </div>
                    </div>
                </div>

                <!-- empty state empty list-->
                <div
                class="empty-notebook"
                ng-show="notes.length==0 && pageTitle.toLocaleLowerCase()!='system'">
                    <div>
                        <img src="img/empty.svg" class="empty_svg"/>
                    </div>
                    <h2 class="text-center">{{empty_notebook_msg}}</h2>
                </div>
                
                <!-- notebook is locked-->
                <div
                class="empty-notebook"
                ng-show="is_notebook_locked() && pageTitle.toLocaleLowerCase()!='system'">
                    <div>
                        <img src="img/lock.svg" class="empty_svg"/>
                    </div>
                    <h2 class="text-center">NoteBook is locked</h2>
                </div>
                


                <!-- show system vars here -->
                 <div
                 ng-show="pageTitle.toLocaleLowerCase()=='system'">
                 <div ng-repeat="(key,value) in get_system_vars()" ng-click="edit_var(key)">
                    <div class="system_var_item">
                        <span class="material-symbols-outlined icon-btn">deployed_code</span>
                        <div class="var_chip">{{key}} = {{evaluate_exp(value)}}</div>
                        <!-- <div class="var_chip">{{evaluate_exp(value)}}</div> -->
                    </div>
                 </div>
                 </div>
            </div>
            
            <!-- empty state no list-->
            <div style="text-align: center;" ng-show="notebooks.length==0">
                <h1>(>_<)</h1>
                <span>Nothing to see here.</span>
            </div>
        `
    }
}