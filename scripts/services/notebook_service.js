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

  
    
}