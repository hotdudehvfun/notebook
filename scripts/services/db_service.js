function db_service() {

    this.read_notebooks = function () {
        try {
            const data = localStorage.getItem('appData');
            return is_valid_json(data) ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading notebooks:', e);
            return [];
        }
    };

    this.remove_notebook = function (notebook) {
        let all_notebooks = this.read_notebooks();
        if (!all_notebooks || all_notebooks.length === 0) throw "No notebooks to delete";
        if (!notebook) throw "No notebook selected";

        const index = all_notebooks.findIndex(n => n.id === notebook.id);
        if (index === -1) throw "Notebook not found";

        all_notebooks.splice(index, 1);
        this.write_notebooks(all_notebooks);
        return all_notebooks;
    }

    this.write_note = function (notebook, note) {
        let all_notebooks = this.read_notebooks();
        let nb_index = all_notebooks.findIndex(n => n.id === notebook.id);

        if (nb_index === -1) throw ("Notebook not found in database");

        let current_notebook = all_notebooks[nb_index];
        let note_index = current_notebook.taskArray.findIndex(t => t.id === note.id);

        if (note_index !== -1) {
            current_notebook.taskArray[note_index] = note;
        } else {
            throw ("Note not found in notebook");
        }

        all_notebooks[nb_index] = current_notebook;
        this.write_notebooks(all_notebooks);
        return current_notebook;
    };


    this.write_notebook = function (notebook) {
        let all_notebooks = this.read_notebooks();
        let idx = all_notebooks.findIndex(n => n.id === notebook.id);
        if (idx !== -1) {
            all_notebooks[idx] = notebook;
            this.write_notebooks(all_notebooks);
        } else {
            throw ("Failed to write database")
        }
        return all_notebooks;
    }

    //return true and false
    this.write_notebooks = function (notebooks) {
        if (!Array.isArray(notebooks)) {
            console.error('write_notebooks failed: Expected an array, got', typeof notebooks);
            return false; // prevent writing invalid data
        }
        try {
            localStorage.setItem('appData', angular.toJson(notebooks));
            return true;
        } catch (e) {
            console.error('Error saving notebooks:', e);
            return false;
        }
    };


    //read from storage and return data
    this.read = function () {
        try {
            //read system vars
            let data = {
                system_vars: {},
                notebooks: setupDemoList(),
                selectedListIndex: -1,
                theme: "dark",
                tags: {}
            }
            if (is_valid_json(localStorage.system_vars)) {
                data.system_vars = JSON.parse(localStorage.system_vars)
            }

            if (is_valid_json(localStorage.appData)) {
                data.notebooks = JSON.parse(localStorage.appData)
                // console.log(data.notebooks)
                //make sure all have unique ids
                data.notebooks = this.ensure_all_ids(data.notebooks)
            }

            data.selectedListIndex = localStorage.selectedListIndex || -1;
            data.theme = localStorage.theme || "dark";

            //save notebook sort by
            data.notebook_sort_by = localStorage.notebook_sort_by || "date"

            // handle tags
            //if not found return empty object
            // init tags uses json strong from local storage
            data.tags = localStorage.notebook_tags || "{}"

            return data;
        } catch (err) {
            console.log("Error while reading data", err)
        }
    }

    this.write = function (data, angular) {
        try {
            //save data about app in local
            let json = angular.toJson(data.notebooks);

            //appData is an array 
            localStorage.appData = json;

            //save selectedListIndex
            localStorage.selectedListIndex = data.selectedListIndex;

            //save theme
            localStorage.theme = data.theme

            //save system vars
            localStorage.system_vars = JSON.stringify(data.system_vars)

            //save notebook sort by
            localStorage.notebook_sort_by = data.notebook_sort_by

            //save tags to group notebooks
            //object containing tags and id of notebook
            /*
            {
                "work":[1,2,3],
                "finance":[6,7]
            }
            */
            localStorage.notebook_tags = angular.toJson(data.tags)

        } catch (error) {
            console.log("Error while writing data", err)
        }
    }

    this.ensure_all_ids = (all_notebooks) => {
        all_notebooks.forEach(notebook => {
            if (!notebook.id) {
                notebook.id = generate_id();
            }
            // Ensure each note has id
            if (Array.isArray(notebook.taskArray)) {
                notebook.taskArray.forEach(note => {
                    if (!note.id) {
                        note.id = generate_id();
                    }
                    note.isSelected = false;
                });
            }
        });
        return all_notebooks;
    };


    this.db_size = () => {
        try {
            let totalSize = 0;
            for (let i = 0; i < localStorage.length; i++) {
                let key = localStorage.key(i);
                let value = localStorage.getItem(key);
                totalSize += key.length + value.length;
            }
            return `${(totalSize / 1024).toFixed(2)} kb`
        } catch (err) {
            console.log("App size error", err)
        }
    }


    this.read_tags = () => {
        try {
            //{"tag":[],"tag 2":[]}
            if (is_valid_json(localStorage.notebook_tags)) {
                const tags_obj = JSON.parse(localStorage.notebook_tags);
                return tags_obj;
            } else {
                return {}
            }
        } catch (err) {
            console.log("error file reading tags", err)
            return {}
        }
    }

    this.write_tags = (tags) => {
        try {
            localStorage.notebook_tags = angular.toJson(tags)
        } catch (err) {
            console.log("Failed to write tags", err)
        }
    }

    //return {}
    this.read_vars = () => {
        try {
            let vars = JSON.parse(localStorage.system_vars || "{}");
            let sorted_keys = Object.keys(vars).sort();
            let sorted_obj = {};
            sorted_keys.forEach(key => {
                sorted_obj[key] = vars[key];
            });
            return sorted_obj;
        } catch (err) {
            console.log("Error while reading system vars")
            return {}
        }
    }

    this.write_vars = (vars) => {
        try {
            localStorage.system_vars = JSON.stringify(vars)
        } catch (err) {
            console.log("Failed to write var", err)
        }
    }



}