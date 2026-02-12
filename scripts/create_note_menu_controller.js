function create_note_menu_controller($scope, shared_service) {
    // create_note_menu_controller
    // note main menu dialog is handled by this controller
    $scope.sub_menu = [];
    $scope.show_dialog = false;
    $scope.$on("show_sub_menu", function (event, menu_type) {
        if (menu_type == "format") {
            $scope.sub_menu = $scope.get_format_menu();
        } else if (menu_type == "insert") {
            $scope.sub_menu = $scope.get_insert_menu();
        }
        $scope.show_dialog = true;
    });

    
    $scope.insertTextAtCursor = (id, content) => {
        insertTextAtCursor(id, content);
        $scope.show_dialog = false;
    }

    $scope.get_insert_menu = function () {
        const inserts = {
            today: () => formatDate(new Date()),
            day: () => formatDay(new Date()),
            now: () => formatTime(new Date()),
            heading: "## H2",
            highlight: "!important!",
            list: "- Item",
            progress: "#50%",
            table: "@table\n@S.no, A, =B\n99,100",
            circular: "@circular_bars\nA, B, C\n50, 50, 50",
        };
        const menu_items = [
            ["📆 Today", "today"],
            ["📆 Day", "day"],
            ["📆 Now", "now"],
            ["📝 Heading", "heading"],
            ["✏️ Highlight", "highlight"],
            ["✅ List", "list"],
            ["📈 Progress bar", "progress"],
            ["🗄️ Table", "table"],
            ["📖 Circular Progress", "circular"],
        ];

        return menu_items.map(([text, key]) => ({
            text: text,
            action: () => {
                const value = typeof inserts[key] === "function" ? inserts[key]() : inserts[key];
                $scope.insertTextAtCursor("note_content", value);
                $scope.note_content = document.getElementById("note_content").value

                // console.log("note content",$scope.note_content)
                // console.log("textarea",document.getElementById("note_content").value)


            }
        }));
    };



    $scope.convert_heading_with_bullets = function () {
        try {
            let textarea = document.getElementById("note_content");
            if (!textarea)
                return;

            //first add bullets to all lines
            let new_content = $scope.add_bullets("-");
            // then convert first line to H2
            // split content into lines
            let lines = new_content.trim().split("\n");
            if (lines.length === 0)
                return;
            // convert first line to H2
            lines[0] = "### " + lines[0].replace(/^[#*\-\s]+/, "");
            // join lines back
            new_content = lines.join("\n");
            // update textarea
            textarea.value = new_content;
            return new_content;
        } catch (err) {
            console.log(er)
        }
    };


    $scope.add_bullets = function (symbol) {
        try {
            const textarea = document.getElementById("note_content");
            if (!textarea) return;

            let { value, selectionStart, selectionEnd } = textarea;
            const has_selection = selectionStart !== selectionEnd;

            // Determine target text (selected or all)
            let target_text = has_selection
                ? value.substring(selectionStart, selectionEnd)
                : value;

            // Remove existing bullet symbols or numbered prefixes like "1. ", "2) ", "- ", "* "
            target_text = target_text
                .split("\n")
                .map(line => line.replace(/^\s*([\*\-\+]|\d+[.)])\s*/, "")) // strip bullet or number
                .map(line => line.trim() ? `${symbol} ${line.trim()}` : "") // re-add new symbol
                .join("\n");

            // Merge back into full text
            let new_text = has_selection
                ? value.substring(0, selectionStart) + target_text + value.substring(selectionEnd)
                : target_text;

            // Update textarea value and selection
            textarea.value = new_text;
            if (has_selection) {
                textarea.setSelectionRange(selectionStart, selectionStart + target_text.length);
            }

            return new_text;
        } catch (err) {
            console.log(err);
        }
    };

    $scope.add_num_bullets = function () {
        try {
            const textarea = document.getElementById("note_content");
            if (!textarea) return;

            const { value, selectionStart, selectionEnd } = textarea;
            const has_selection = selectionStart !== selectionEnd;

            // Determine target text (selected or all)
            let target_text = has_selection
                ? value.substring(selectionStart, selectionEnd)
                : value;

            // Clean bullets/numbers and add new numbered list
            const modified_text = target_text
                .split("\n")
                .map((line, i) => {
                    const clean_line = line.replace(/^\s*([*\-+.]|\d+[.)])\s*/, "").trim();
                    return clean_line ? `${i + 1}. ${clean_line}` : "";
                })
                .join("\n");

            // Merge back into full text
            const new_text = has_selection
                ? value.substring(0, selectionStart) + modified_text + value.substring(selectionEnd)
                : modified_text;

            // Update textarea and selection
            textarea.value = new_text;
            if (has_selection) {
                textarea.setSelectionRange(selectionStart, selectionStart + modified_text.length);
            }

            return new_text;
        } catch (err) {
            console.log(err);
        }
    };

    // add diary entry, date, time and all lines as bullet
    $scope.convert_to_diary_entry = function () {
        try {
            let text = $scope.add_bullets("-");
            // then add date and time at the top
            let date = formatDate(new Date());
            let time = formatTime(new Date());
            text = `### ${date} ${time}\n` + text
            let textarea = document.getElementById("note_content");
            if (!textarea)
                return;
            textarea.value = text;
            $scope.note_content = textarea.value;
            return textarea.value;
        } catch (error) {
            console.log(error)
        }
    }

    $scope.edit_chart = ()=>{
        shared_service.set("open_chart_edit_window",true)
    }

    //component menu
    $scope.get_format_menu = () => {
        try {
            const actions = {
                edit_chart: () => $scope.edit_chart(),
                add_bullets: () => $scope.add_bullets("-"),
                add_num_bullets: () => $scope.add_num_bullets(),
                heading_with_bullets: () => $scope.convert_heading_with_bullets(),
                diary_entry: () => $scope.convert_to_diary_entry()
            };

            const menu_items = [
                ["📊 Edit chart", "edit_chart"],
                ["✅ Add bullets", "add_bullets"],
                ["🔢 Add numbers", "add_num_bullets"],
                ["🔠 Heading with bullets", "heading_with_bullets"],
                ["📆 Diary entry", "diary_entry"]
            ];

            return menu_items.map(([text, key]) => ({
                text: text,
                action: () => {
                    actions[key]();
                    $scope.show_dialog = false;
                }
            }));
        } catch (error) {
            console.log(error);
        }
    };



}