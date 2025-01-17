function directive_create_notebook_layout() {
    return{
        scope:true,
        /*html*/
        template:`
        <div class="flex-col p-1/2">
        <!-- title -->
        <div class="botom_bar_title">
            Create notebook
        </div>
    
        <div class="flex-row gap-1 align-center">
            <!-- icon -->
            <span class="material-symbols-outlined button-icon">auto_stories</span>
            <!-- notebook name input -->
            <input
                type="text"
                name="notebook_name"
                ng-keyup="handle_input_on_notebook($event)"
                class="add-new-list-title"
                ng-model="new_list_name" 
                ng-attr-placeholder="New NoteBook name..."
                placeholder="New NoteBook name..."
                autofocus/>
        </div>
        <div class="flex-row gap-1">
            <div 
                ng-click="show_create_notebook_layout = false"
                class="button rounded-full gap-1">
                <span class="material-symbols-outlined button-icon">cancel</span>
                <span>Cancel</span>
            </div>
            <div ng-click="create_notebook()" class="button rounded-full gap-1">
                <span class="material-symbols-outlined button-icon">add</span>
                <span>Create</span>
            </div>
        </div>
    </div>
        `
    }
}