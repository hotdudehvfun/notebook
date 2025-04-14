function notebook_service($timeout)
{
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
    this.get_notebook_age = function(notebook) {
        return notebook?.dateCreated ? timeSince(notebook.dateCreated) : "Notebook is very old";
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
    // create notebook
    this.create_notebook = function (title, icon, all_notebooks) {
        
        const is_valid_notebook_name = (title) => title.length > 1 && title.length <= 30;
        if (!is_valid_notebook_name(title)) throw "Notebook name must be between 2 and 30 characters";

        const newName = title?.trim();
        if (!newName) throw "Input required";

        const reserved = ["system", "trash"];
        if (reserved.includes(newName.toLowerCase())) throw `${newName} is a reserved title`;

        const exists = all_notebooks.some(n => n.title.toLowerCase() === newName.toLowerCase());
        if (exists) throw `${newName} notebook already exists`;

        return new List(title, icon || "folder");

    }

    // Helper function to get or create the "quick notes" notebook
    this.get_quick_notes_notebook = function (notebooks) {
        const quickNotes = notebooks.find(n => n.title.toLowerCase() === "quick notes");
        if (quickNotes) return quickNotes;

        const newNotebook = new List("Quick Notes", "folder");
        notebooks.push(newNotebook);
        return newNotebook;
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

  
    
}