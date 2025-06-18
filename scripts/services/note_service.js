function note_service($timeout) {

    // get notebook age
    this.get_completed_notes_length = function (notes) {
        if (!notes) return 0;
        return notes.filter(note => note.isTaskCompleted).length;
    };

    // get notebook icon
    this.get_notebook_icon = function (notebook) {
        try {
            if (notebook?.is_locked)
                return "lock";
            return notebook?.icon || "folder";
        } catch (err) {
            console.log(err);
            return "folder";
        }
    }

    // rename notebook
    this.rename_notebook = function (notebook, new_title, new_icon, all_notebooks) {
        if (!notebook) throw "No notebook selected";

        const newName = new_title?.trim();
        if (!newName) throw "Input required";

        const reserved = ["system", "trash"];
        if (reserved.includes(newName.toLowerCase())) throw `${newName} is a reserved title`;

        const exists = all_notebooks.some(n => n !== notebook && n.title.toLowerCase() === newName.toLowerCase());
        if (exists) throw `${newName} notebook already exists`;

        notebook.title = newName;
        notebook.icon = new_icon || "folder";

        return notebook;
    }

    // merge completed notes
    this.merge_completed_notes = function (notebook) {
        let notes = notebook.taskArray;
        if (!notes || notes.length === 0)
            throw "No notes to merge";
        let mergedContent = notes.filter(note => note.isTaskCompleted).map(note => note.title).join("\n");
        if (mergedContent.trim() === "") {
            throw "No completed notes to merge";
        }
        const mergedNote = new Task(mergedContent.trim());
        notes = notes.filter(note => !note.isTaskCompleted);
        notes.push(mergedNote);
        notebook.taskArray.push(mergedNote);
        return notebook;
    };


    // split notes
    this.split_note = (delimiter, selected_note, notes) => {
        try {
            const noteIndex = notes.indexOf(selected_note);
            if (noteIndex === -1) throw new Error("Selected note not found in taskArray");

            let taskContent = selected_note.title.trim();
            delimiter = delimiter === "new line" ? "\n" : delimiter;

            if (taskContent.length === 0) throw new Error("Note content is empty");

            // Split the text
            let tasks = split_text_into_tasks(taskContent, delimiter);
            tasks = tasks.length > 0 ? tasks : [taskContent];

            const newTasks = tasks.map(text => {
                let newTask = new Task(text);
                newTask.taskIcon = "radio_button_unchecked";
                newTask.set_is_component();
                newTask.set_component_type();
                return newTask;
            });

            // Insert new tasks below original note
            notes.splice(noteIndex + 1, 0, ...newTasks);
            // Remove the original note
            notes.splice(noteIndex, 1);
            return notes;
        } catch (err) {
            console.error(err);
        }
    };

    //remove completed notes
    this.remove_completed_notes = function (notebook) {
        if (!notebook || !notebook.taskArray) return;
        notebook.taskArray = notebook.taskArray.filter(note => !note.isTaskCompleted);
        return notebook;
    };

    

}