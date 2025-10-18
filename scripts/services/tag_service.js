// tag service
function tag_service(db_service) {
    // Create a new tag if not exists
    //tags = object
    //tag_title = string
    this.create_tag = function (tags, tag_title) {
        if (tags[tag_title])
            throw "Tag already exists";

        if (!tag_title || tag_title.trim().length == 0)
            throw ("Tag name cannot be empty")

        tags[tag_title] = [];
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
    this.get_notebooks_in_tag = function (tags, tag_title) {
        if (!tags[tag_title])
            throw "Tag does not exist";

        const notebook_ids = tags[tag_title];
        const all_notebooks = db_service.read_notebooks()
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
