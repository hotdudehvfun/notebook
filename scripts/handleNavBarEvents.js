addEventListeners = () => {
    handleShowHideCreateNewListDialog();
    handleShowHideCreateTaskDialog();
    viewMoreOptions();
    handleRemoveCompletedTasks();
    handleRemoveAllTasks();
    handleDeleteList();
}


function handleShowHideCreateNewListDialog()
{

    let id = "#add-new-task-with-new-list";
    //open
    $("#open-add-new-list-panel").click(function ()
    {
        $("#add-new-task-with-new-list").toggleClass("visible");
        $("#open-add-new-list-panel").toggleClass("rotate");
        
    });

    //close
    $(id + " .close-button").click(() =>
    {
        $("#add-new-task-with-new-list").toggleClass("visible");
        $("#open-add-new-list-panel").toggleClass("rotate");
    });
}

function handleShowHideCreateTaskDialog()
{

    let id = "#add-task-panel-with-selected-list";
    //open
    $("body").on("click","#open-add-new-task-panel, #openAddNoteFromEmptyState, #editTaskButton", function ()
    {   
        $("#open-add-new-task-panel").toggleClass("rotate");
        $("#add-task-panel-with-selected-list").toggleClass("visible");
    });

    //close
    $(id + " .close-button").click(() =>
    {
        $("#open-add-new-task-panel").toggleClass("rotate");
        $("#add-task-panel-with-selected-list").toggleClass("visible");
    });
}






//--------------------------

//same function for new and current list

handleRemoveCompletedTasks = () => {
    document.querySelector("#remove-completed-tasks-button").onclick = () => {
        appObject.removeCompletedTasks();
    }
}

handleRemoveAllTasks = () => {

    document.querySelector("#remove-all-tasks-button").onclick = () => {
        appObject.purgeList();
    }
}

function handleDeleteList()
{
    
}



