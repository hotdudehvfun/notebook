function note_service($timeout)
{
    
    // get notebook age
    this.get_completed_notes_length = function(notes) {
        if (!notes) return 0;
        return notes.filter(note => note.isTaskCompleted).length;
    };

    // get notebook icon
    this.get_notebook_icon = function(notebook){
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
    this.merge_completed_notes = function(notes, notebook) {
        if (!notes || notes.length === 0)
            throw "No notes to merge";
        const completedNotes = notes.filter(note => note.isTaskCompleted);
        const mergedNote = new Task(completedNotes.map(note => note.content).join("\n"))
        //remove completed notes from the original list
        notes = notes.filter(note => !note.isTaskCompleted);
        notes.push(mergedNote);
        notebook.taskArray.push(mergedNote);
        return notebook;
    };

  
    
}