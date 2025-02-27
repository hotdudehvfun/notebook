function notebook_service($timeout)
{
    //lazy load quick notebooks
    this.load_quick_notebooks = function (notebooks,callback) {
        $timeout(() => {
            callback(notebooks);
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

  
    
}