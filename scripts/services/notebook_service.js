function notebook_service($timeout, db_service) {
    //lazy load quick notebooks
    this.load_quick_notebooks = function (notebooks, callback) {
        $timeout(() => {
            const sorted = [...notebooks].sort((a, b) =>
                a.title.toLowerCase().localeCompare(b.title.toLowerCase())
            );
            callback(sorted);
        });
    };


    // get notebook age
    this.get_notebook_age = function (notebook) {
        return notebook?.dateCreated ? timeSince(notebook.dateCreated) : "Notebook is very old";
    };

    // get notebook icon
    this.get_notebook_icon = function (notebook) {
        try {
            if (notebook?.is_locked)
                return "🔐";
            return notebook?.icon || "📜";
        } catch (err) {
            console.log(err);
            return "📜";
        }
    }

    // rename notebook
    this.rename_notebook = function (notebook, new_title, new_icon) {
        if (!notebook) throw "No notebook selected";

        const newName = new_title?.trim();
        if (!newName) throw "Input required";

        const reserved = ["system", "trash"];
        if (reserved.includes(newName.toLowerCase()))
            throw `${newName} is a reserved title`;

        if (reserved.includes(notebook.title.toLowerCase()))
            throw `${notebook.title} cannot be renamed, it is a reserved notebook`;

        let all_notebooks = db_service.read_notebooks();
        const exists = all_notebooks.some(n => n !== notebook && n.title.toLowerCase() === newName.toLowerCase());
        if (exists)
            throw `${newName} notebook already exists`;

        notebook.title = newName;
        notebook.icon = new_icon || "📜";

        return db_service.write_notebook(notebook);
    }



    // create notebook
    this.create_notebook = function (title, icon) {
        //get all notebooks
        const all_notebooks = db_service.read_notebooks();

        //validations    
        const is_valid_notebook_name = (title) => title.length > 1 && title.length <= 30;
        if (!is_valid_notebook_name(title))
            throw "Notebook name must be between 2 and 30 characters";

        const reserved = ["system", "trash"];
        if (reserved.includes(title.toLowerCase()))
            throw `${title} is a reserved title`;

        const exists = all_notebooks.some(n => n.title.toLowerCase() === title.toLowerCase());
        if (exists)
            throw `${title} notebook already exists`;

        let new_list = new List(title, icon || "📜");
        all_notebooks.push(new_list);
        db_service.write_notebooks(all_notebooks);
        return all_notebooks;
    }

    // Helper function to get or create the "quick notes" notebook
    this.get_quick_notes_notebook = function () {
        const notebooks = db_service.read_notebooks();
        const quickNotes = notebooks.find(n => n.title.toLowerCase() === "quick notes");
        if (quickNotes) return quickNotes;

        const quick_notebook = new List("Quick Notes", "🗒️");
        db_service.write_notebooks([...notebooks, quick_notebook]);
        return quick_notebook;
    }

    // delete notebook
    this.delete_notebook = function (notebook, all_notebooks) {

        // cannot delete reserved notebooks
        const reserved = ["system", "trash"];
        if (reserved.includes(notebook.title.toLowerCase())) throw `${notebook.title} cannot delete reserved notebook`;

        if (!notebook) throw "No notebook selected";

        const index = all_notebooks.indexOf(notebook);
        if (index === -1) throw "Notebook not found";

        all_notebooks.splice(index, 1);
        return true;
    }

    // delete all notebooks
    this.delete_all_notebooks = function (all_notebooks) {
        if (!all_notebooks || all_notebooks.length === 0) throw "No notebooks to delete";

        all_notebooks.length = 0;
        return true;
    }

    // paste task inside notebook
    this.paste_task_inside_notebook = (notebook, task) => {
        if (!notebook)
            throw "No notebook selected";
        if(!task)
            throw "No note to paste"
        notebook.taskArray.push(task);
        db_service.write_notebook(notebook);
        return notebook;
    }


    this.lock_data = (password, notebook) => {
        try {
            if (notebook.taskArray.length == 0) {
                throw ("No need to lock empty notebook")
            }
            if (notebook.is_locked) {
                throw ("Notebook is already locked")
            }

            if (password.length == 0) {
                throw ("Password is required to lock notebook")
            }

            notebook.taskArray.forEach((data, index) => {
                data.title = encrypt_data(data.title, password)
            });
            password = ""
            notebook.is_locked = true;
            db_service.write_notebook(notebook);
            return notebook;
        } catch (err) {
            console.log("Lock data error:", err);
        }
    }

    this.unlock_data = (password, notebook) => {
        try {
            if (notebook.taskArray.length == 0) {
                throw ("Notebook is empty")
            }
            if (password.length == 0) {
                throw ("Password is required to lock notebook")
            }

            if (notebook.is_locked) {
                // Test password by decrypting one field without modifying it
                let notes = notebook.taskArray
                const testDecryption = decrypt_data(notes[0].title, password);

                if (testDecryption !== null && testDecryption !== "") {
                    // Password is valid, proceed to unlock all notes
                    notebook.taskArray.forEach((data) => {
                        data.title = decrypt_data(data.title, password);
                    });
                    password = "";
                    notebook.is_locked = false;
                    db_service.write_notebook(notebook);
                    return notebook;
                } else {
                    throw ("Invalid password, Try again");
                }
            } else {
                throw ("Notebook is already unlocked");
            }
        } catch (err) {
            console.log("Unlock data error:", err);
        }
    };


    this.notebook_has_completed_tasks = (notebook) => {
        if (!notebook) return false
        if (notebook)
            return notebook?.taskArray.some(note => note?.isTaskCompleted === true)
        return false
    };


    this.move_completed_notes = (from_notebook, to_notebook) => {
        if (!from_notebook) throw "Source notebook not found";
        if (!to_notebook) throw "Destination notebook not found";
        if (from_notebook === to_notebook) throw "Source and destination notebooks cannot be the same";

        const completedTasks = from_notebook.taskArray.filter(note => note.isTaskCompleted === true);
        if (completedTasks.length === 0) throw "No completed notes to move";

        // Move completed tasks to the destination notebook
        to_notebook.taskArray.push(...completedTasks);

        // Remove completed tasks from the source notebook
        from_notebook.taskArray = from_notebook.taskArray.filter(note => note.isTaskCompleted !== true);

        db_service.write_notebook(from_notebook);
        db_service.write_notebook(to_notebook);

        return from_notebook;
    }

    this.ensure_single_trash_notebook = (all_notebooks)=> {
    // Find all trash notebooks (case-insensitive)
    let trash_notebooks = all_notebooks.filter(n => 
        n.title && n.title.toLowerCase() === "trash"
    );

    if (trash_notebooks.length === 0) {
        return -1; // or create a trash notebook here if required
    }

    // If multiple trash notebooks exist: remove all except the first
    if (trash_notebooks.length > 1) {
        let first_trash_id = trash_notebooks[0].id;
        // Keep only first trash notebook, filter out others
        all_notebooks = all_notebooks.filter(n => 
            !(n.title && n.title.toLowerCase() === "trash" && n.id !== first_trash_id)
        );
    }

    // Return the index of the remaining/first trash notebook
    return all_notebooks.findIndex(n => 
        n.title && n.title.toLowerCase() === "trash"
    );
}


    this.get_trash_index = () => {
        let all_notebooks = db_service.read_notebooks();
        let index = this.ensure_single_trash_notebook(all_notebooks)
        if (index === -1) {
            let trash = new List("Trash", "🗑️");
            all_notebooks.push(trash);
            db_service.write_notebooks(all_notebooks);
            return all_notebooks.length - 1; // new trash index
        }
        return index;
    };


    this.delete_note = (notebook, note) => {
        if (!notebook) throw "No notebook selected";
        if (!note) throw "No note selected";

        // remove note from current notebook
        notebook.taskArray = notebook.taskArray.filter(n => n.id !== note.id);
        db_service.write_notebook(notebook)

        const all_notebooks = db_service.read_notebooks();
        const trash_index = this.get_trash_index();
        // move to trash if not already there
        if (notebook.title.toLowerCase() !== "trash") {
            let trash = all_notebooks[trash_index];
            trash.taskArray = trash.taskArray || [];
            trash.taskArray.push(note);
        }
        db_service.write_notebooks(all_notebooks)
        return notebook;
    };

    this.restore_note = (notebook, note) => {
        if (!notebook) throw "No notebook selected";
        if (!note) throw "No note selected";

        const all_notebooks = db_service.read_notebooks();
        const parent_notebook = all_notebooks.filter(n => n.id==note.parent_id)

        if(parent_notebook.length==0)
            throw "Parent notebook not found"

        const p_n = parent_notebook[0]

        // remove note from current notebook
        notebook.taskArray = notebook.taskArray.filter(n => n.id !== note.id);
        db_service.write_notebook(notebook)
        //move it to parent
        p_n.taskArray.push(note)
        db_service.write_notebook(p_n)
        console.log(db_service.read_notebooks())
        return [notebook,p_n];
    };

    this.move_notes_to_notebook = (from_notebook, to_notebook) => {
        try {
            if (!from_notebook || !to_notebook) throw "Invalid notebooks";
            // get selected notes
            const selected_notes = from_notebook.taskArray.filter(note => note.isSelected);
            if (selected_notes.length === 0) return from_notebook;

            // keep only unselected notes in source
            from_notebook.taskArray = from_notebook.taskArray.filter(note => !note.isSelected);

            // deselect moved notes
            selected_notes.forEach(note => note.isSelected = false);
            
            // move selected notes
            to_notebook.taskArray.push(...selected_notes);
            // save changes
            db_service.write_notebook(from_notebook);
            db_service.write_notebook(to_notebook);
            console.log(from_notebook)
            return from_notebook;
        } catch (err) {
            console.error("Error moving notes:", err);
        }
    };





}