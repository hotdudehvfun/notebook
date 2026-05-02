function bin_controller($scope, notebook_service, shared_service, db_service,wiki_service) {
    const set_shared = (k, v) => shared_service.set(k, v);
    const emit_toast = msg => $scope.$emit("show_toast", msg);

    $scope.show_dialog = false;
    $scope.selected_note = null;
    $scope.notes = []

    $scope.tap = (note) => {
        $scope.selected_note = note;
        console.log(note)
    }

    $scope.empty_bin = () => {
        $scope.notes.forEach((note) => {
            $scope.delete_note(note)
        })
    }

    $scope.delete_note = (note) => {
        const p_id = note.parent_id;
        const all_notebooks = db_service.read_notebooks();
        const notebook = all_notebooks.find(n => n.id == p_id);

        if (!notebook || !notebook.taskArray) {
            emit_toast("Error: Notebook not found");
            return;
        }

        const before_count = notebook.taskArray.length;
        notebook.taskArray = notebook.taskArray.filter(n => n.id != note.id);

        if (notebook.taskArray.length < before_count) {
            db_service.write_notebook(notebook);
            emit_toast("Note permanently deleted");
        } else {
            emit_toast("Note not found");
        }
        $scope.notes = notebook_service.get_notes_in_bin()

    };


    $scope.restore_note = (note) => {
        try {
            const p_id = note.parent_id;
            const all_notebooks = db_service.read_notebooks()
            const parent_notebook = all_notebooks.find(n => n.id == p_id)
            if (parent_notebook) {
                let _note = parent_notebook.taskArray.find(n => n.id == note.id)
                if (_note) {
                    _note.isDeleted = false;
                    emit_toast(`Note restored in ${parent_notebook.title}`)
                    db_service.write_notebook(parent_notebook)
                    $scope.notes = notebook_service.get_notes_in_bin()
                } else {
                    emit_toast(`Note not found`)
                }
            } else {
                emit_toast("Parent notebook not found")
            }
        } catch (err) {
            console.log(err)
            emit_toast("Restore note failed")
        }
    }

    //tag list view is opened
    $scope.$on("show_bin_changed", function (e, state) {
        if($scope.show_dialog==state)
            return
        console.log("show tag list changed", state)
        $scope.show_dialog = state;
        if (state) {
            $scope.notes = notebook_service.get_notes_in_bin()
            console.log($scope.notes)
        }
    })

    // custom code of note is parsed to output html content
    $scope.parse_markdown_to_html = function (text) {
        return wiki_service.parseWikiTextToHTML(text)
    }

}