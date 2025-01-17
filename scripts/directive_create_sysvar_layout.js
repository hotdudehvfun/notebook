function directive_create_sysvar_layout() {
    return{
        scope:false,
        /*html*/
        template:`
            <!-- title -->
            <div class="botom_bar_title">
                Custmom variables
            </div>

            <!-- create system var -->
            <div class="system_var_container">
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
        `
    }
}