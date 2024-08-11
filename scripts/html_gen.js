// document.addEventListener('DOMContentLoaded', function ()
// {
//   addEventListeners();
// });

handleNoListState=()=>
{
  document.querySelector("#selectedList").style.display="none";
  document.querySelector("list-age").style.display="none";
  
  document.querySelector("#open-view-lists-panel").setAttribute("class","nav-bar-item disabled");
  document.querySelector("#open-more-panel").setAttribute("class","nav-bar-item disabled");
  document.querySelector("#open-add-new-task-panel").setAttribute("class","nav-bar-item disabled");
  
  let html="";
  html+=SVGS.DESERT;
  html+="<no-list-msg>You have no task list!</no-list-msg>";
  html+="<no-list-msg>Lets Create One</no-list-msg>";
  html+=`<no-list-msg onclick="openCreateListFromEmptyState()">Tap to Create</no-list-msg>`;
  document.querySelector("#tasks-container").innerHTML=html;
}

handleNoTasksState=()=>
{
  let html="";
  html+="<h1>You have no tasks in this list!</h1>";
  // console.log(html);
  return html;
}