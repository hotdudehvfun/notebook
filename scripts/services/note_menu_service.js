function note_menu_service() {

    // convert all lines in a textarea to bullets
    this.convert_all_to_bullets = function (symbol) {
        try {
            let textarea = document.getElementById("note_content");
            if (!textarea) return;
            let lines = textarea.value.trim().split("\n");
            if (lines.length === 0) return;
            for (let i = 0; i < lines.length; i++) {
                lines[i] = `${symbol} ${lines[i]}`
            }
            return lines.join("\n");
        } catch (err) {
            console.log(er)
        }
    };

}