viewMoreOptions = () => {
}

openCreateListFromEmptyState = () => {
    let id = "#add-new-task-with-new-list";
    togglePanelState(id, true, document.querySelector("#open-add-new-list-panel"), () => {
        $("#new-list-title").html("");
        document.querySelector(id + " .toggle-priority-task-button").innerHTML = "favorite_border";
        $(id + " .new-task-content").html("");
        document.querySelector("#st2-message").setAttribute("data-isapplied", "false");
        document.querySelector("#st2-message").style.display = "none";
        document.querySelector("#st2").innerHTML = "";
    })
}




//@state:true false
toggleMoreOptionsState = (state) => {
    //open options
    open = () => {
        let dist = 70;
        document.querySelectorAll(".more-options-item").forEach(element => {
            if (!element.classList.contains("skip")) {
                element.style.bottom = dist;
                dist += 60;
            }
        });
        // hide block screen
        document.querySelector("#block-screen").setAttribute("class", "");
        //change button
        document.querySelector("#open-more-panel").innerHTML="close"
        //get size storage
        getStorageSize();
    }

    close = () => {
        //change button
        document.querySelector("#open-more-panel").innerHTML="more_vert"
        document.querySelector("#block-screen").setAttribute("class", "hide-block-screen");
        document.querySelectorAll(".more-options-item").forEach(element => {
            element.style.bottom = "-50px";
        });
    }

    dialogStates.moreOptions = !dialogStates.moreOptions;
    if (state == undefined) {
        state = dialogStates.moreOptions;
    }
    state == true ? open() : close();
}

//same function for three panels
togglePanelState = (id, state, trigger, whatToDO) => {
    open = () => {
        document.querySelector(id).style.display = "flex";
        trigger.setAttribute("class", "nav-bar-item selected")
        $(id).css(
            {
                bottom: "48px",
                opacity: 1
            });

        //execute call back
        whatToDO();


        //also close other  panels
        others.forEach(item => {
            if (id != item.id) {
                document.querySelector(item.id).style.display = "none";
                item.trigger.setAttribute("class", "nav-bar-item");
            }
        });
        //hide search dialog
        $("#search-dialog").css({ display: "none" });

        toggleMoreOptionsState(false);
        document.querySelector("#block-screen").setAttribute("class", "");
    }

    close = () => {
        document.querySelector("#block-screen").setAttribute("class", "hide-block-screen");
        if (trigger.classList.contains("disabled"))
            trigger.setAttribute("class", "nav-bar-item disabled");
        else
            trigger.setAttribute("class", "nav-bar-item");

        $(id).css(
            {
                bottom: "60px",
                opacity: 0,
                display: "none"
            });
        document.querySelector(id).style.display = "none";
    }

    if (document.querySelector(id).style.display == "flex")
        close();
    else
        open();
}
