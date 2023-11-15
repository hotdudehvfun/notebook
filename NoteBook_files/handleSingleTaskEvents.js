let swipe =
{
    style: null,
    isTouched: false,
    startPosition: 0,
    max: 0,
    percent: 0,
    width: 0,
    height: 0
}
let oldClass;


//handl on click task
handleClickOnTask = (el) =>
{   
    openTaskMoreOptions(el);   
}

let currentSelectedTask=null;

function handleTaskStatusChange(el)
{
    //change menu text when more options are shown
    //if completed
    if(appObject.getTaskState(el.id)==true)
    {
        document.querySelector("#taskChangeStatus").innerHTML="Change to Uncomplete";
    }else if(appObject.getTaskState(el.id)==false)
    {
        document.querySelector("#taskChangeStatus").innerHTML="Set Completed";
    }
    
    //change text of set priority
    if(appObject.getTaskPriority(el.id)==true)
    {
        document.querySelector("#taskChangePriority").innerHTML="Remove Priority";
    }else if(appObject.getTaskPriority(el.id)==false)
    {
        document.querySelector("#taskChangePriority").innerHTML="Set Priority";
    }
}


function taskChangeStatus()
{
    if(currentSelectedTask!=null)
    {   
        let negateState=!appObject.getTaskState(currentSelectedTask.id);
        let changedState= appObject.updateTaskState(currentSelectedTask.id,negateState);
        if(changedState)
        {
            //task complete
            showToast("Task Completed");
        }else if(changedState==false)
        {
            //task still pending
            showToast("Task is still pending");
        }
       closeTaskMoreOptions();
    }
}

function taskChangePriority()
{
    if(currentSelectedTask!=null)
    {   
        let negateState=!appObject.getTaskPriority(currentSelectedTask.id);
        let changedState= appObject.updateTaskPriority(currentSelectedTask.id,negateState);
        if(changedState)
        {
            //task complete
            showToast("Task is on Priority");
        }else if(changedState==false)
        {
            //task still pending
            showToast("Task is not on Priority");
        }
       closeTaskMoreOptions();
    }
}



function taskRemove()
{
    if(currentSelectedTask!=null)
    {   
        appObject.removeTask(currentSelectedTask.id);
        showToast("Task Removed");
        closeTaskMoreOptions();
    }
}


function closeTaskMoreOptions()
{
    document.querySelector("#block-screen").className="hide-block-screen";
    document.querySelector(".taskMoreOptionsConatiner").className="taskMoreOptionsConatiner hide-task-more-options";    
}
