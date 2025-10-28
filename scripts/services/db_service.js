function db_service() {

    this.setupDemoList = () => {
        //demo list
        let list = new List("First Notebook");
        let task = new Task("We have added first note!");
        list.taskArray.push(task);
        return [list];
    }

    this.read_notebooks = function () {
        try {
            const data = localStorage.getItem('appData') || "[]";
            let all_notebooks = is_valid_json(data) ? JSON.parse(data) : [];
            if(all_notebooks.length==0)
                all_notebooks = this.setupDemoList()
            return this.ensure_all_ids(all_notebooks)
        } catch (e) {
            console.error('Error reading notebooks:', e);
            return [];
        }
    };

    this.remove_notebook = function (notebook) {
        let all_notebooks = this.read_notebooks();
        if (!all_notebooks || all_notebooks.length === 0) throw "No notebooks to delete";
        if (!notebook) throw "No notebook selected";

        const index = all_notebooks.findIndex(n => n.id == notebook.id);
        console.log(notebook.id,index,all_notebooks)
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

    //ensure important props
    //id is required
    //position is required
    this.ensure_all_ids = (all_notebooks) => {
        all_notebooks.forEach(notebook => {
            if (!notebook.id) {
                console.log("notebook id not found,generating new one")
                notebook.id = generate_id();
            }
            // Ensure each note has id
            if (Array.isArray(notebook.taskArray)) {
                notebook.taskArray.forEach((note,index) => {
                    if (!note.id) {
                        note.id = generate_id();
                    }
                    if(!note.position)
                    {
                        note.position = index     
                    }
                    note.isSelected = false;
                    note.parent_id = notebook.id
                    if (!note.hasOwnProperty("isDeleted"))
                        note.isDeleted = false;
                });
            }
        });
        this.write_notebooks(all_notebooks)
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


    //returns object {}
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

    this.create_tag = function (tag_title) {
        let tags = this.read_tags()
        console.log(tag_title)
        if (tags[tag_title])
            throw "Tag already exists";

        if (!tag_title || tag_title.trim().length == 0)
            throw ("Tag name cannot be empty")

        tags[tag_title] = [];
        this.write_tags(tags)
        return tags;
    };

    // Remove a tag completely
    this.remove_tag = function (tags, tag_title) {
        if (tags[tag_title]) {
            delete tags[tag_title];
        }
        return tags;
    };

    // Update notebooks array inside a tag
    this.update_notebooks_in_tag = function (tags, tag_title, arr) {
        if (tags[tag_title]) {
            tags[tag_title] = arr;
        }
        return tags;
    };

    // add notebook id to tag
    this.add_notebook_to_tag = function (tags, tag_title, notebook_id) {
        if (!tags[tag_title])
            throw "Tag does not exist"

        if (tags[tag_title].includes(notebook_id))
            throw "Notebook already in tag"

        tags[tag_title].push(notebook_id);
        return tags;
    }
    //remove notebook id from tag
    this.remove_notebook_from_tag = function (tags, tag_title, notebook_id) {
        if (tags[tag_title]) {
            const index = tags[tag_title].indexOf(notebook_id);
            if (index > -1) {
                tags[tag_title].splice(index, 1);
            }
        }
        return tags;
    }

    //get notebooks id using tag title
    this.get_notebooks_in_tag = function (notebook_ids) {
        if (!notebook_ids)
            throw "Tag does not exist";

        const all_notebooks = this.read_notebooks()
        if (notebook_ids.length > 0) {
            return all_notebooks.filter(nb => notebook_ids.includes(nb.id));
        }
        return [];
    }

    // Return all tag titles as an array
    this.get_tags_arr = function (tags) {
        return Object.keys(tags);
    };

    // Optional: get tags as JSON for saving to localStorage
    this.export_tags = function () {
        return JSON.stringify(this.tags);
    };



}