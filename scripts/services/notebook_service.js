function notebook_service($timeout,note_service, db_service) {
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
        db_service.write_notebook(notebook);
        return notebook;
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
        return new_list
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
        if (!task)
            throw "No note to paste"
        notebook.taskArray.push(task);
        //reset positions
        notebook.taskArray = note_service.set_positions(notebook.taskArray)
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

        //reset positions
        from_notebook.taskArray = note_service.set_positions(from_notebook.taskArray)
        //reset positions
        to_notebook.taskArray = note_service.set_positions(to_notebook.taskArray)

        db_service.write_notebook(from_notebook);
        db_service.write_notebook(to_notebook);

        return from_notebook;
    }


    this.delete_note = (notebook, note) => {
        if (!notebook) throw "No notebook selected";
        if (!note) throw "No note selected";

        // remove note from current notebook
        note.isDeleted = true;
        note.parent_id = notebook.id
        note.position = -1;
        //reset positions
        notebook.taskArray = note_service.set_positions(notebook.taskArray)
        const all_notebooks = db_service.write_notebook(notebook)
        // console.log(all_notebooks)
        return notebook;
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
            //reset positions
            from_notebook.taskArray = note_service.set_positions(from_notebook.taskArray)
            //reset positions
            to_notebook.taskArray = note_service.set_positions(to_notebook.taskArray)
            // save changes
            db_service.write_notebook(from_notebook);
            db_service.write_notebook(to_notebook);
            console.log(from_notebook)
            return from_notebook;
        } catch (err) {
            console.error("Error moving notes:", err);
        }
    };

    const is_valid_note_content = (content) => {
        if (content == null || content == undefined)
            return false
        if (content.length == 0)
            return false
        if (content.length > 999)
            return false

        return true
    }

    this.add_note = (notebook, content) => {
        try {
            if (!notebook) throw "Notebook not found"
            if (!is_valid_note_content(content)) throw "Note content is invalid"
            //create new note
            const new_task = new Task(content);
            new_task.parent_id = notebook.id
            new_task.set_is_component();
            new_task.set_component_type();
            notebook.taskArray.push(new_task)
            //reset positions
            notebook.taskArray = note_service.set_positions(notebook.taskArray)
            db_service.write_notebook(notebook)
            return notebook;
        } catch (error) {
            console.log(error)
        }
    }

    this.edit_note = (notebook, old_note, content) => {
        try {
            if (!notebook) throw "Notebook not found"
            if (!is_valid_note_content(content)) throw "Note content is invalid"
            if (!old_note) throw "Current note not found"

            const index = notebook.taskArray.findIndex(note => note.id == old_note.id)
            if (index == -1) throw "Unable to find note inside notebook"
            notebook.taskArray[index].title = content;
            db_service.write_notebook(notebook)
            return notebook;
        } catch (error) {
            console.log(error)
        }
    }

    this.get_notes_in_bin = () => {
        try {
            const all_notebooks = db_service.read_notebooks(); // array of notebooks
            let deleted_notes = [];
            all_notebooks.forEach(notebook => {
                if (notebook.taskArray && Array.isArray(notebook.taskArray)) {
                    deleted_notes = deleted_notes.concat(
                        notebook.taskArray.filter(note => note.isDeleted === true)
                    );
                }
            });

            return deleted_notes;
        } catch (error) {
            console.error("Error reading deleted notes:", error);
            return []; // return empty array for safety
        }
    }



    this.get_grouped_notebooks_date = (notebooks) => {
        try {
            let today = new Date();
            let groups = {
                'Recently Created': [],
                'This Month': [],
                'Older': {}
            };

            notebooks.forEach(notebook => {
                let created_date = new Date(notebook.dateCreated);
                let diff_days = Math.floor((today - created_date) / (1000 * 60 * 60 * 24));

                if (diff_days <= 7) {
                    groups['Recently Created'].push(notebook);
                } else if (created_date.getFullYear() === today.getFullYear() && created_date.getMonth() === today.getMonth()) {
                    groups['This Month'].push(notebook);
                } else {
                    let month_year = created_date.toLocaleString('default', {
                        month: 'long',
                        year: 'numeric'
                    });
                    if (!groups['Older'][month_year]) {
                        groups['Older'][month_year] = [];
                    }
                    groups['Older'][month_year].push(notebook);
                }
            }
            );
            return groups;
        } catch (err) {
            console.log(err)
        }
        return [];
    }


    // group notebooks by title
    this.get_grouped_notebooks_title = function (notebooks) {
        let grouped = {};
        // Iterate over notebooks and group them by first letter
        notebooks.forEach(notebook => {
            let firstChar = notebook.title.charAt(0).toUpperCase();
            if (!firstChar.match(/[A-Z]/)) {
                firstChar = "#";
                // Group non-alphabetic titles under "#"
            }
            if (!grouped[firstChar]) {
                grouped[firstChar] = [];
            }
            grouped[firstChar].push(notebook);
        });
        // Sort groups alphabetically
        let sortedGroups = Object.keys(grouped).sort((a, b) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)));

        let sortedGroupedNotebooks = {};
        sortedGroups.forEach(key => {
            sortedGroupedNotebooks[key] = grouped[key];
        });
        // console.log(sortedGroupedNotebooks)
        return sortedGroupedNotebooks;
    };


    this.get_grouped_notebooks_tag = function (notebooks) {
        let tags = db_service.read_tags() || {};
        let grouped = {};

        // Step 1: Create a map from dateCreated to notebook
        let notebook_map = {};
        notebooks.forEach(nb => {
            notebook_map[nb.id] = nb;
        });

        // Step 2: Group notebooks based on tags
        for (let tag in tags) {
            let arr = tags[tag];
            grouped[tag] = [];

            arr.forEach(id => {
                if (notebook_map[id]) {
                    grouped[tag].push(notebook_map[id]);
                }
            });
        }

        // Step 3: Handle notebooks not in any tag
        let all_tagged = new Set(Object.values(tags).flat());
        let ungrouped = notebooks.filter(nb => !all_tagged.has(nb.id));
        if (ungrouped.length > 0) {
            grouped["Ungrouped"] = ungrouped;
        }

        // Step 4: Sort tags alphabetically (Ungrouped always last)
        let sortedKeys = Object.keys(grouped).sort((a, b) =>
            a === "Ungrouped" ? 1 : b === "Ungrouped" ? -1 : a.localeCompare(b)
        );

        let sortedGrouped = {};
        sortedKeys.forEach(key => {
            sortedGrouped[key] = grouped[key];
        });

        // console.log(sortedGrouped);
        return sortedGrouped;
    };

}