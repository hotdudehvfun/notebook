function create_note_menu_service(shared_service) {

        this.convert_heading_with_bullets = function () {
        try {
            let textarea = document.getElementById("note_content");
            if (!textarea)
                return;

            let lines = textarea.value.trim().split("\n");
            if (lines.length === 0)
                return;

            // Convert first line to H2
            lines[0] = "### " + lines[0];

            // Convert remaining lines to bullet points
            for (let i = 1; i < lines.length; i++) {
                lines[i] = "- " + lines[i];
            }
            return lines.join("\n");
        } catch (err) {
            console.log(er)
        }
    };

    this.convert_to_bullets = function (symbol) {
        try {
            let textarea = document.getElementById("note_content");
            if (!textarea)
                return;
            let lines = textarea.value.trim().split("\n");
            if (lines.length === 0)
                return;
            for (let i = 0; i < lines.length; i++) {
                lines[i] = `${symbol} ${lines[i]}`
            }
            return lines.join("\n");
        } catch (err) {
            console.log(er)
        }
    }
        ;

    this.add_symbol_to_selected_text = function (symbol) {
        let textarea = document.getElementById("note_content");
        if (!textarea)
            return;

        let start = textarea.selectionStart;
        let end = textarea.selectionEnd;
        let text = textarea.value;

        if (start === end)
            return;
        // No selection

        let selected_text = text.substring(start, end);
        let modified_text = selected_text.split("\n").map(line => symbol + " " + line).join("\n");

        // Replace selected text with modified text
        let new_text = text.substring(0, start) + modified_text + text.substring(end);

        // Update textarea
        textarea.value = new_text;
        textarea.setSelectionRange(start, start + modified_text.length);

        return new_text;
    }
        ;

    // add 1. 2. 3. ...
    this.add_numbers_to_selected_text = function () {
        let textarea = document.getElementById("note_content");
        if (!textarea)
            return;

        let start = textarea.selectionStart;
        let end = textarea.selectionEnd;
        let text = textarea.value;

        if (start === end)
            return;
        // No selection

        let selected_text = text.substring(start, end);
        let modified_text = selected_text.split("\n").map((line, index) => (index + 1) + ". " + line).join("\n");

        // Replace selected text with modified text
        let new_text = text.substring(0, start) + modified_text + text.substring(end);

        // Update textarea
        textarea.value = new_text;
        textarea.setSelectionRange(start, start + modified_text.length);

        return new_text;
    }
        ;
    // add diary entry, date, time and all lines as bullet
    this.convert_to_diary_entry = function () {
        try {
            let textarea = document.getElementById("note_content");
            // first make all line bullet points
            $scope.convert_to_bullets("-");
            // then add date and time at the top
            let date = formatDate(new Date());
            let time = formatTime(new Date());
            let new_content = `### ${date} ${time}\n` + $scope.note_content;
            textarea.value = new_content;
            return new_content;
        } catch (error) {
            console.log(error)
        }
    }




    //bottom bar menu
    this.get_create_note_main_menu = () => {
        // call this function when you want to open create note popup
        return[
            {
                text: "Format",
                icon: "square.and.pencil",
                class: "chip2",
                show: true,
                action: (item) => {
                    console.log("edit menu clicked")
                    $scope.current_edit_note_more_options = $scope.prepare_format_menu_items()
                    $scope.dialog_flags.show_edit_note_more_options = true

                }
            },
            {
                text: "Insert",
                icon: "plus.circle",
                class: "chip2",
                show: true,
                action: (item) => {
                    console.log("insert menu clicked")
                    $scope.current_edit_note_more_options = $scope.prepare_insert_menu_items()
                    $scope.dialog_flags.show_edit_note_more_options = true

                }
            },
            {
                text: "List mode",
                icon: "list.bullet.rectangle",
                class: "chip2",
                show: true,
                action: (item) => {
                    $scope.toggle_bottom_bar_active_menu(item.text)
                    $scope.current_bottom_bar_active_menu = null;
                    $scope.is_list_mode_on = ($scope.bottom_bar_active_menu == item.text)
                    $scope.show_toast(`List mode ${bool_to_on_off($scope.is_list_mode_on)} | ${$scope.current_list_symbol}`)
                }
            },
        ]
    }

    //prepare insert menu items and return
    this.get_insert_menu = function () {
        try {
            return [{
                text: "📆 Today",
                action: ()=>{
                    this.insertTextAtCursor('note_content', formatDate(new Date()))
                }
            }, {
                text: "📆 Day",
                action: function(){
                    this.insertTextAtCursor('note_content', formatDay(new Date()))
                }
            }, {
                text: "📆 Now",
                action: function(){
                    this.insertTextAtCursor('note_content', formatTime(new Date()))
                }
            }, {
                text: "📝 Heading",
                action: function(){
                    this.insertTextAtCursor('note_content', "## H2")
                }
            }, {
                text: "✏️ Highlight",
                action: function(){
                    this.insertTextAtCursor('note_content', "!important!")
                }
            },
            {
                text: "✅ List",
                action: function(){
                    this.insertTextAtCursor('note_content', "* Item")
                }
            }, {
                text: "📈 Progress bar",
                action: function(){
                    this.insertTextAtCursor('note_content', "#50%")
                }
            }, {
                text: "🧩 Split notes",
                action: function(){
                    this.insertTextAtCursor('note_content', "$ ")
                }
            }, {
                text: "🗄️ Table",
                action: function(){
                    this.insertTextAtCursor('note_content', "@table\n||a,b\n|c,d")
                }
            }, {
                text: "🍕 Chart",
                action: function(){
                    //open chart dialog
                    this.new_chart.show = true;
                }
            }, {
                text: "📖 Circular Progress",
                action: function(){
                    this.insertTextAtCursor('note_content', `@circular_bars\nA, B, C\n50, 50, 50`)
                }
            }, {
                text: "💰 Transactions",
                action: function(){
                    this.insertTextAtCursor('note_content', `@transcations\nDesc, category, cash or credit, account, amount, date`)
                    // $scope.new_transaction.show = true
                }
            }]
        } catch (error) {
            console.log(error)
        }
    }

    //component menu
    this.get_format_menu = () => {
        try {
            return[{
                text: "📊 Edit chart",
                action: () => {
                    if (this.is_valid_chart_code(this.note_content)) {
                        this.new_chart.show = true;
                    } else {
                        alert("Invalid chart code!");
                    }
                }
            }, {
                text: "✅ Selection to bullets",
                action: () => {
                    this.add_symbol_to_selected_text("-");
                }
            }, {
                text: "✅ All lines to bullets",
                action: () => {
                    this.note_content = note_menu_service.convert_all_to_bullets("-")
                }
            }, {
                text: "🔠 Heading with bullets",
                action: () => {
                    this.convert_heading_with_bullets();
                }
            }, {
                text: "🔢 Selection to numbered list",
                action: () => {
                    this.add_numbers_to_selected_text();
                }
            }, {
                text: "📆 Convert to Diary entry(date,time,all lines bullet)",
                action: () => {
                    this.convert_to_diary_entry();
                }
            },
            ];
        } catch (error) {
            console.log(error);
        }
    }
   
}