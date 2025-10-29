function wiki_service($rootScope, db_service, shared_service) {
    this.chart_instances = this.chart_instances || {};

    // if no data is found create demo files
    this.setupDemoList = () => {
        //demo list
        let list = new List("First Notebook");
        let task = new Task("We have added first note!");
        list.taskArray.push(task);
        return [list];
    }

    this.format_currency = (result) => {
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0
        }).format(result);
    }


    this.handle_currency = (text) => {
        if (typeof text !== "string") return text;
        return text.replace(/(\d+(\.\d+)?):c\b/g, (match, number) => {
            try {
                // Convert the number to currency format using Intl API
                // console.log(`checking currency ${match}`)
                return this.format_currency(number)
            } catch (err) {
                console.error("Currency formatting error:", err);
                return number; // fallback to original number if any error
            }
        });
    };


    //find text between {}
    //and solve it safely
    this.handle_math = (text) => {
        if (typeof text !== "string") return text;
        return text.replace(/\{([^{}]+)\}/g, (match, expr) => {
            // Pass only the expression inside {} to evaluate_exp
            let result = this.evaluate_exp(expr.trim());
            // console.log(`checking ${match} and result = ${result}`)

            return result !== undefined ? result : match; // fallback to original if invalid
        });
    };


    //replace heading globally in a text
    this.handle_headings = (text) => {
        // Replace from largest headings (######) to smallest (#)
        for (let i = 6; i >= 1; i--) {
            const regex = new RegExp(`(^|\\n)#{${i}}\\s*(.+)`, 'g');
            text = text.replace(regex, (match, p1, headingText) => {
                // Capitalize heading text
                let formattedText = headingText.trim();
                formattedText = formattedText.charAt(0).toUpperCase() + formattedText.slice(1);
                return `${p1}<div class='h${i} bold capitalize'>${formattedText}</div>`;
            });
        }
        return text;
    };


    this.handle_list_item = (text) => {
        return text.replace(/^(?:-|\*)\s*(.+)$/gm, (match, content) => {
            // Capitalize first letter for consistency (optional)
            let formatted = content.trim();
            formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
            return `<li class='note-list-item'>${formatted}</li>`;
        });
    };

    this.bold = (line) => {
        return line.replace(/:([^:]+):/g, '<b>$1</b>');
    };


    this.handle_highlight = (line) => {
        return line.replace(/!([^!]+)!/g, '<div class="highlight">$1</div>');
    };

    this.italic = (line) => {
        return line.replace(/_([^_]+)_/g, '<i>$1</i>');
    };

    this.sup = (line) => {
        return line.replace(/\^([^^]+)\^/g, '<sup>$1</sup>');
    };

    this.sub = (line) => {
        return line.replace(/~([^~]+)~/g, '<sub>$1</sub>');
    };


    this.progress_bar = (text) => {
        try {
            if (typeof text !== "string") return text;

            return text.replace(/#\s*(\d{1,3})\s*(?:,\s*([a-zA-Z]+))?\s*%/g, (match, num, color) => {
                console.log(`Progress match found: ${match}`);
                let percentage = parseFloat(num);
                percentage = Math.max(0, Math.min(100, percentage)); // clamp between 0-100
                color = color ? color.trim() : "green";

                return `
                    <div class="progress-bar-container">
                        <div class="progress-bar bg-${color}" style="width: ${percentage}%;">
                            <span class="progress-text">${percentage}%</span>
                        </div>
                    </div>`;
            });

        } catch (err) {
            console.error("Error in progress_bar:", err);
            return text;
        }
    };



    this.check_for_line = (text) => {
        if (typeof text !== "string") return text;

        // Replace ONLY lines that start with exactly "---" (no more, no less)
        return text.replace(/^(---)\s*$/gm, `<div class="line"></div>`);
    };




    // solve anything 2+2 or a+b
    this.evaluate_exp = function (value) {
        const system_vars = db_service.read_vars()

        function evaluateVariables(str) {
            // Replace variables with their values recursively
            // console.log(`checking exp ${str}`)
            return str.replace(/\b[a-zA-Z_]\w*\b/g, function (match) {
                if (system_vars.hasOwnProperty(match)) {
                    let expr = system_vars[match];
                    if (typeof expr === 'string') {
                        return evaluateVariables(expr); // recursive for nested expressions
                    } else {
                        return expr;
                    }
                }
                return match; // unknown variable, leave as is
            });
        }

        function safeMath(expr) {
            // Only allow digits, operators, parentheses, and decimals
            if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
                return "Invalid expression";
            }
            try {
                // Use Function constructor in strict mode sandbox
                let result = Function('"use strict"; return (' + expr + ')')();
                if (isNaN(result)) return "Invalid expression";
                result = result % 1 === 0 ? result : result.toFixed(2);
                return result;
            } catch {
                return "Invalid expression";
            }
        }
        // Step 1: replace variable names with their actual values/expressions
        let replaced = evaluateVariables(value);
        // Step 2: safely evaluate
        return safeMath(replaced);
    };

    //_class1_class2_class3 becomes
    //<div class="class1 class2 class3"></div>
    this.handle_custom_style = (text) => {
        if (typeof text !== "string") return text;

        const lines = text.split('\n'); // split into lines

        const processedLines = lines.map(line => {
            // Trim only for checking, but keep original spacing if needed
            const trimmed = line.trim();

            if (trimmed.startsWith('_')) {
                // Extract class names until first space or end
                const parts = trimmed.split(' ');
                const classNames = parts[0].substring(1).split('_').join(' ');
                const content = parts.slice(1).join(' ').trim();

                // If no content, return empty div with class
                return `<div class="${classNames}">${content || ''}</div>`;
            }

            return line; // not a custom style line
        });

        return processedLines.join('\n');
    };




    this.handle_charts = (text) => {
        /*
        @chart
        pie
        Title
        chart2
        a,b
        1,2
        */
        const lines = text.split("\n")
        const type = lines[1].trim()
        const title = lines[2].trim()
        const id = lines[3].trim()
        //console.log(id)
        let theme = "red"
        if (id.indexOf("#") != -1)
            theme = id.split("#")[1]

        const labels = lines[4].split(",")
        const values = lines[5].split(',').map(v => this.evaluate_exp(v.trim()));

        setTimeout(() => {
            this.update_chart(labels, values, id, type, title, theme)
        }, 50)
        return `<canvas style="width:100%" id="${id}"></canvas>`
    }

    this.update_chart = (_labels, values, id, _type, title, theme) => {
        try {
            // If a chart exists on this id, destroy it first
            if (this.chart_instances[id]) {
                this.chart_instances[id].destroy();
            }

            let chart = new Chart(id, {
                type: _type,
                data: {
                    tension: 0.5,
                    labels: _labels,
                    datasets: [{
                        backgroundColor: util_get_transparent_color(CHART_COLORS[theme], 0.5),
                        borderColor: CHART_COLORS[theme],
                        borderWidth: 2,
                        fill: false,
                        data: values,
                        label: title,
                        tension: 0.5,
                        borderRadius: 5
                    }]
                },
                options: {
                    animation: false,
                    title: {
                        display: false,
                        text: title
                    },
                    aspectRation: 1,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                display: true,
                                maxTicksLimit: 2,
                            }
                        }
                    }
                }
            });
            this.chart_instances[id] = chart;
        } catch (err) {
            console.log(err)
        }
    }

    this.table_code_to_data = (text) => {
        try {
            // CODE
            // @table
            // @S. no, Product, =qty, =price
            // apple, 2, 50
            // orange, 3, 30
            // grape, 5, 20


            // OUTPUT
            // S.No  | Product | Qty | Price
            // ------+---------+-----+------
            // 1     | Apple   | 2   | 50
            // 2     | Orange  | 3   | 30
            // 3     | Grapes  | 5   | 20
            // 	Total          | 10  | 100
            let table = []
            let lines = text.split("\n");
            let headers = lines[1]
                .split(",")
                .map(item => item.trim())

            let auto_num = headers[0].startsWith("@")
            let sum_pos = headers
                .map((item, index) => item.trim().startsWith("=") ? index : null)
                .filter(index => index !== null);
            //create sums array with 0
            let sums = Array(sum_pos.length).fill(0)
            let has_sum_row = false
            //clean headers
            headers = headers
                .map(item => clean_string(item))

            table.push(headers)
            //read code line by line
            for (var i = 2; i < lines.length; i++) {
                let line = lines[i];
                if (auto_num)
                    line = `${i - 1}.,${line}`
                line = line.split(",").map(item => item.trim())

                //sum numbers using sum_pos 
                sum_pos.forEach((pos, index) => {
                    sums[index] += parseInt(line[pos])
                })
                table.push(line)
            }
            if (sum_pos.length != 0) {
                sums = sums.map(s=> this.format_currency(s))
                sums = ["Total", ...sums]
                table.push(sums)
                has_sum_row = true;
            }
            return [table, has_sum_row];
        } catch (err) {
            console.error(err);
            return null
        }
    }

    this.table_data_to_grid = (table, has_sum_row) => {
        if (!Array.isArray(table) || table.length === 0) return "";
        //S.No  | Product | Qty | Price
        // ------+---------+-----+------
        // 1     | Apple   | 2   | 50
        // 2     | Orange  | 3   | 30
        // 3     | Grapes  | 5   | 20
        // 	Total          | 10  | 100
        let m = table.length
        let n = table[0].length
        let html = `<div
        class="table"
        style="
            grid-template-rows: repeat(${m},1fr);
            grid-template-columns: repeat(${n},1fr);
            "
        >`;

        let total = ""
        const end = n - (table[m - 1].length - 1 - 1);
        table.forEach((row, index) => {
            const header = index == 0 ? "heading" : "";
            let row_mid = row.map((item, pos) => {
                if (index == m - 1 && pos == 0 && has_sum_row) {
                    total = `
                        grid-column:1/${end};
                        text-align: center;
                        color:orange;
                        `
                } else {
                    total = ""
                }
                return `
                    <div
                        style='${total}'
                        class='cell ${header}'>
                        ${item}
                    </div>
                    `;
            }).join("\n");
            html += `${row_mid}`
        })
        return html;
    };

    this.table_data_to_ascii = (table, has_sum_row) => {
        if (!Array.isArray(table) || table.length === 0) return "";
        /*
        - Apple     10
        - Cat       10
        - Fruits    10
        - Total =   30

        */
        // console.log(table)
        let m = table.length
        let n = table[0].length
        let html = `<table class="simple_table">`;
        let total = ""
        const end = n - (table[m - 1].length - 1);
        table.forEach((row, index) => {
            const header = index == 0 ? "heading" : "";
            const total_row = (index == m - 1 && has_sum_row) ? "total_row" : "";

            let row_mid = row.map((item, pos) => {
                if (index == m - 1 && pos == 0 && has_sum_row) {
                    total = `
                        colspan = '${end}'
                        class = 'simple_cell total'
                        `
                } else {
                    total = `class='simple_cell'`
                }
                return `
                    <td ${total}>${item}</td>
                    `;
            }).join("\n");
            html += `<tr class='simple_row  ${header} ${total_row}'>
                        ${row_mid}
                    </tr>
            `
        })
        html += "</table>"
        return html;
    };


    this.handle_table_component = (text) => {
        try {
            //table is 2D array
            let [table, has_sum_row] = this.table_code_to_data(text)
            let html = this.table_data_to_ascii(table, has_sum_row)
            // console.log(html)
            return html
        } catch (error) {
            console.log(error)
            return "Invalid Table Code"
        }

    }

    this.circum = (r) => {
        return Math.PI * 2 * r;
    }

    this.calculate_dashoffset = (r, p) => {
        return circum(r) * (1 - (p / 100));
    }

    this.show_progress = (p, that) => {
        try {
            that.parentElement.querySelector(".circular_bar_text").innerHTML = `${p}`;
            // console.log(that.parentElement.querySelector(".circular_bar_text"))
        } catch (err) {
            console.log("Failed to show progress inside text", err)
        }
    }

    this.handle_circular_bars = (text) => {
        try {
            let lines = text.split("\n")
            let texts = lines[1].split(",").map(v => this.evaluate_exp(v.trim()));
            let p = lines[2].split(",").map(v => this.evaluate_exp(v.trim()));
            let text_pos = "LEFT" //by default text is on left side
            if (lines.length == 4) {
                text_pos = lines[3].trim()
            }

            let radius = 70
            let r_gap = 20
            let size = 180
            let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg)">`
            let colors = ["#ff4967", "#f4b424", "#49dc6b", "#9a66ff"]
            for (let i = 0; i < p.length; i++) {
                svg += `
            <!-- back circle -->
            <circle class="back_circle" r="${radius - r_gap * i}" cx="${size / 2}" cy="${size / 2}" fill="transparent" 
              stroke="${colors[i]}" stroke-linecap="round" stroke-width="12">
              </circle>
    
            <!-- progress circle -->
            <circle onclick="show_progress(${p[i]},this)" r="${radius - r_gap * i}" cx="${size / 2}" cy="${size / 2}" fill="transparent" 
              stroke="${colors[i]}" stroke-linecap="round" stroke-width="12"
              stroke-dasharray="${circum(radius - r_gap * i)}" stroke-dashoffset="${calculate_dashoffset(radius - r_gap * i, p[i])}">
              </circle>
            `
            }

            svg += `</svg>`
            let text_html = ``
            texts.forEach((item, index) => {
                text_html += `<div style="color:${colors[index]};" class='circular_bar_text_container_item'>${item}</div>`
            })

            //determine text pos
            let flex_class = "flex-row"
            if (text_pos == "RIGHT") {
                flex_class = "flex-row-reverse"
            }

            let html = `
        <div class="${flex_class} align-center justify-center">
            <div class='circular_bar_text_container'>
                ${text_html}
            </div>
                            ${svg}

        </div>
        `
            return html;
        } catch (err) {
            console.log("Error");
        }
        return "Error while handling circular progress"
    }

    this.contains_html = (text) => {
        const regex = /<[^>]+>/;
        return regex.test(text);
    }

    this.handle_plain_text = (text) => {
        if (!text)
            return "Text not found!";
        if (text.length == 0)
            return "Text is empty!"
        if (this.contains_html(text))
            return text
        return `<div class='plain_text'> ${text} </div>`;
    }

    this.clean_whitespace = (text) => {
        if (typeof text !== 'string') return text;
        return text
            .replace(/\r\n/g, '\n')       // Normalize line endings
            .replace(/\t+/g, '\t')        // Normalize multiple tabs
            .replace(/[ ]{2,}/g, ' ')     // Convert multiple spaces to single space
            .replace(/\n{3,}/g, '\n\n')   // Limit blank lines to maximum 1 empty line between content
            .trim();                      // Remove leading and trailing whitespace
    };

    this.convert_newlines = (text) => {
        if (typeof text !== "string") return text;
        return text.replace(/\n/g, "<br>");
    };



    this.parseWikiTextToHTML = (text) => {
        if (!text)
            return "Text not found!!!"

        let html = text;
        // 0. Trim unnecessary spaces (optional cleanup)
        html = this.clean_whitespace(html);
        // 1. **Math expressions FIRST (pure text only, before HTML tags appear)**
        html = this.handle_math(html);

        //handle components
        if (html.startsWith("@table")) {
            html = this.handle_table_component(html)
            html = this.handle_currency(html);
            return html;

        }
        if (html.startsWith("@chart")) {
            return this.handle_charts(html)
        }
        if (html.startsWith("@circular_bars")) {
            html = this.handle_circular_bars(html)
            html = this.handle_currency(html);
            return html;
        }

        // 2. **Block-level elements (entire line transforms)**
        html = this.progress_bar(html);

        html = this.handle_headings(html);

        html = this.check_for_line(html);

        html = this.handle_list_item(html);

        html = this.handle_custom_style(html); // custom classes like _purple_center

        // 3. **Component-level (starts with @)**
        // html = this.handle_components(html); // charts, tables, etc.

        // 4. **Inline-level formatting**
        html = this.handle_highlight(html);
        html = this.bold(html);
        // html = this.italic(html);
        html = this.sup(html);
        html = this.sub(html);

        // 5. **Final plain text fallback**
        html = this.handle_currency(html);
        html = this.handle_plain_text(html);
        // html = this.convert_newlines(html);
        return html
    }

}