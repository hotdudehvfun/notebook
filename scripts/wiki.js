

// if no data is found create demo files
function setupDemoList() {
    //demo list
    let list = new List("First Notebook");
    let task = new Task("We have added first note!");
    list.taskArray.push(task);
    return [list];
}

function bold(line) {
    return line.replace(/:(.*?)(:)/g, '<b>$1</b>')
}
function handle_highlight(line)
{
    return line.replace(/!(.*?)(!)/g, '<div class="highlight">$1</div>')
}
function italic(line) {
    return line.replace(/_(.*?)(_)/g, '<i>$1</i>')
}
function sup(line) {
    return line.replace(/\^(.*?)(\^)/g, '<sup>$1</sup>')
}
function sub(line) {
    return line.replace(/\~(.*?)(\~)/g, '<sub>$1</sub>')
}

function progress_bar(text) {
    // #80% default color = green
    // #90,red% color = red
    try {
        text = text.trim()
        if (text.startsWith("#") && text.endsWith("%")) {
            text = text.replace(/[ #%]/g, '').trim().split(",")
            let p1 = clamp(0, parseFloat(text[0]), 100);
            let color = text.length == 2 ? text[1] : "green";
            return `
            <div class="progress-bar-container">
                <div class="progress-bar bg-${color}" style="width: ${p1}%;">
                    <span class="progress-text">${p1}%</span>
                </div>
            </div>`;
        }
        return text;
    } catch (err) {
        console.log("Error in progress bar component", err)
        return text
    }
}

function check_for_line(text) {
    if (text.trim().startsWith("---")) {
        return `<div class="line"></div>`
    }
    return text
}



function multi_progress_bar(text) {
    const regex = /#((\d{1,3}(,\d{1,3})*)%)/g;
    return text.replace(regex, (match, p1) => {
        const percentages = p1.split(',').map(value => value.trim().replace("%", ""));
        const progressBars = percentages.map(percentage => {
            return `
                <div class="progress" style="width:${percentage}%;">
                    ${percentage}%
                </div>`;
        }).join('');
        return `
        <div class="progress_bar">
            ${progressBars}
        </div>`;
    });
}



function check_for_system_vars(value) {
    // Recursive function to evaluate expressions
    function evaluate(value) {
        return value.replace(/\b[a-zA-Z_]\w*\b/g, function (match) {
            if (system_vars.hasOwnProperty(match)) {
                // If the match is an expression, evaluate it recursively
                let expr = system_vars[match];
                if (typeof expr === 'string') {
                    return evaluate(expr);
                } else {
                    return expr;
                }
            }
            return match;
        });
    }

    try {
        // Evaluate the expression and return the result
        return eval(evaluate(value));
    } catch (error) {
        console.error("Invalid expression: ", error);
        return "Invalid expression";
    }
}

function format_currency(result) {
    let formattedResult = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(result);
    return formattedResult;
}


function handle_calculations(text) {
    // Create a regex to match {expression} and optionally detect the ":c" flag
    const regex = /{([^}:]+)(:c)?}/g;

    // Use replace with a callback to dynamically insert the match
    return text.replace(regex, (match, expression, isCurrency) => {
        try {
            // Replace variable names with values if needed
            expression = check_for_system_vars(expression);

            // Evaluate the expression
            let result = eval(expression);

            // If result is a floating-point number, round it to 1 decimal place
            result = result % 1 === 0 ? result : result.toFixed(1);

            // If ":c" flag is present, format the result as currency
            if (isCurrency) {
                result = format_currency(result)
            }
            return result;
        } catch (e) {
            console.log(`Error evaluating expression:`, e);
            return "INVALID EXPRESSION"; // Return the original match if there's an error
        }
    });
}


function handle_list(line) {
    // Handle lists
    // if a single line contains many * it will be converted to list items
    // it means * cannot be used in text if a line starts with *
    let html = ""
    line.split("*").forEach((item) => {
        let text = item.replace(/[\*\-]/g, '').trim();
        if (text.length > 0)
            html += `<li>${text}</li>`
    })
    return html
}

function center_aligned(text) {
    const centerAlignedRegex = /::(.*?)::/g;
    const htmlText = text.replace(centerAlignedRegex, '<div class="text-center">$1</div>');
    return htmlText;
}

function box(line) {
    return `<div class="box">${parseWikiTextToHTML(line.trim())}</div>`
}

function insert_tag(line) {
    var html = ""
    try {
        // start tag len = 2
        // end tag len = 3
        // .ol ..ol
        var arr = line.split(".")
        var tag = arr[arr.length - 1]
        if (arr.length == 2)
            html = `<${tag}>`
        else
            html = `</${tag}>`
    } catch (error) {
        html = "ERROR"
    }
    return html
}

//_class1_class2_class3
function handle_insert_class(input) {
    // Regular expression to match lines starting with _class1_class2_... followed by text
    if (input.startsWith("_")) {
        return input.replace(/^_([\w_]+)\s(.+)/gm, function (match, classes, text) {
            // Replace underscores with spaces to separate class names
            const classList = classes.replace(/_/g, ' ');
            return `<span class="${classList}">${text}</span>`;
        });
    }
    return input

}

function handle_charts(text) {
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
    const labels = lines[4].split(",")
    const values = lines[5].split(',').map(v => handle_calculations(v.trim()));
    setTimeout(() => {
        update_chart(labels, values, id, type, title)
    }, 50)
    return `<canvas style="width:100%" id="${id}"></canvas>`
}

function update_chart(_labels, values, id, _type, title) {
    var colors = [
        'rgba(255, 99, 132)',
        'rgba(255, 159, 64)',
        'rgba(255, 205, 86)',
        'rgba(75, 192, 192)',
        'rgba(54, 162, 235)',
        'rgba(153, 102, 255)',
        'rgba(201, 203, 207)'
    ]

    try {
        let chart = new Chart(id, {
            type: _type,
            data: {
                labels: _labels,
                tension: 0.5,
                datasets: [{
                    backgroundColor: colors,
                    borderColor: ["white"],
                    fill: false,
                    data: values,
                    label: title,

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
                        ticks: {
                            display: false,
                            maxTicksLimit: 2,
                        }
                    }
                }
            }
        });
    } catch (err) {
        console.log(err)
    }
}



function handle_returns(text) {
    /*
    @returns
    3 //how many lines
    Title1,Title2,Title3 //3 lines
    label1,lable2 //common labels
    20, 30
    10, 40
    20, 40 // 3 lines with two data points
    chartid
    */
    try {
        const lines = text.split("\n");
        let total_lines = parseInt(lines[1].trim())
        let titles = lines[2].split(",")
        let labels = lines[3].split(",")
        let line1_points = lines[4].split(",").map(v => handle_calculations(v.trim()));
        let line2_points = lines[5].split(",").map(v => handle_calculations(v.trim()));
        let line3_points = lines[6].split(",").map(v => handle_calculations(v.trim()));
        let id = lines[7].trim()
        setTimeout(() => {
            update_chart_returns(titles,labels,line1_points,line2_points,line3_points,id)
        }, 50)
        return `<canvas style="width:100%" id="${id}"></canvas>`
    } catch (err) {
        console.log("Error while handling returns charts",err)
    }
}

function update_chart_returns(_titles,_labels,_line1_points,_line2_points,_line3_points,id) {
    try {
        let chart = new Chart(id, {
            type: "line",
            data: {
                labels: _labels,
                tension: 0.5,
                datasets: [
                    {
                        label:_titles[0],
                        data:_line1_points,
                        borderColor: ["#ff4967"],
                        fill:false,
                    },
                    {
                        label:_titles[1],
                        data:_line2_points,
                        borderColor: ["#164ea6"],
                        fill:false,
                    },
                    {
                        label:_titles[2],
                        data:_line3_points,
                        borderColor: ["#4cd964"],
                        fill:false,
                    },
                ]
            },
            options: {
                animation: false,
                title: {display: false,},
                aspectRation: 1,
                scales: {
                    y: {
                        ticks: {
                            display: false,
                            maxTicksLimit: 2,
                        }
                    }
                }
            }
        });
    } catch (err) {
        console.log(err)
    }
}


function handle_table_component(text) {
    const lines = text.split('\n'); // Split the text by new lines
    let headers = [];
    let rows = [];
    let sumCols = [];
    let sumRow = [];

    lines.forEach(line => {
        line = line.trim();

        // Check for the _sum_col option
        if (line.startsWith('_sum_col')) {
            const [, cols] = line.split('=');
            sumCols = cols.split(',').map(col => parseInt(col.trim()) - 1); // Convert to zero-based indices
        }

        // Check for header row (||)
        else if (line.startsWith('||')) {
            headers = line.replace('||', '').split(',').map(cell => cell.trim());
        }

        // Check for regular row (|)
        else if (line.startsWith('|')) {
            const row = line.replace('|', '').split(',').map(cell => handle_calculations(cell.trim()));
            rows.push(row);

            // Keep track of sums for the columns specified in _sum_col
            sumCols.forEach(col => {
                sumRow[col] = (sumRow[col] || 0) + parseFloat(row[col] || 0);
            });
        }
    });

    // Create the table element (or HTML string)
    let tableHtml = '<table>';

    // Add header row
    if (headers.length > 0) {
        tableHtml += '<thead><tr>';
        headers.forEach(header => {
            tableHtml += `<th>${header}</th>`;
        });
        tableHtml += '</tr></thead>';
    }

    // Add body rows
    tableHtml += '<tbody>';
    rows.forEach(row => {
        tableHtml += '<tr>';
        row.forEach(cell => {
            tableHtml += `<td>${cell}</td>`;
        });
        tableHtml += '</tr>';
    });

    // Add sum row if needed
    if (sumCols.length > 0) {
        tableHtml += '<tr>';
        for (var i = 0; i < sumRow.length; i++)
            tableHtml += `<td>${sumRow[i] !== undefined ? sumRow[i] : 'Total'}</td>`;

        tableHtml += '</tr>';
    }

    tableHtml += '</tbody></table>';

    return tableHtml; // Return the generated table HTML
}

function circum(r)
{
    return Math.PI*2*r;
}

function calculate_dashoffset(r,p)
{
    return circum(r)*(1-(p/100));
}

function show_progress(p,that)
{
    try {
        that.parentElement.querySelector(".circular_bar_text").innerHTML=`${p}`;
        // console.log(that.parentElement.querySelector(".circular_bar_text"))
    } catch (err) {
        console.log("Failed to show progress inside text",err)
    }
}

function handle_circular_bars(text)
{
    try {
        let lines = text.split("\n")
        let texts = lines[1].split(",").map(v => handle_calculations(v.trim()));
        let p = lines[2].split(",").map(v => handle_calculations(v.trim()));
        let text_pos = "LEFT" //by default text is on left side
        if(lines.length==4)
        {
            text_pos = lines[3].trim()
        }
    
        let radius = 70
        let r_gap = 20
        let size = 180
        let svg=`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform: rotate(-90deg)">`
        let colors = ["#ff4967","#f4b424","#49dc6b","#9a66ff"]
        for(let i=0;i<p.length;i++)
        {
            svg+=`
            <!-- back circle -->
            <circle class="back_circle" r="${radius-r_gap*i}" cx="${size/2}" cy="${size/2}" fill="transparent" 
              stroke="${colors[i]}" stroke-linecap="round" stroke-width="12">
              </circle>
    
            <!-- progress circle -->
            <circle onclick="show_progress(${p[i]},this)" r="${radius-r_gap*i}" cx="${size/2}" cy="${size/2}" fill="transparent" 
              stroke="${colors[i]}" stroke-linecap="round" stroke-width="12"
              stroke-dasharray="${circum(radius-r_gap*i)}" stroke-dashoffset="${calculate_dashoffset(radius-r_gap*i,p[i])}">
              </circle>
            `
        }

        svg+=`</svg>`
        let text_html = ``
        texts.forEach((item,index)=>{
            text_html+=`<div style="color:${colors[index]};" class='circular_bar_text_container_item'>${item}</div>`
        })

        //determine text pos
        let flex_class="flex-row"
        if(text_pos=="RIGHT")
        {
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


function parseWikiTextToHTML(wikiText) {

    wikiText = wikiText.trim()
    if (wikiText.startsWith("@table")) {
        return handle_table_component(wikiText)
    }
    if (wikiText.startsWith("@chart")) {
        return handle_charts(wikiText)
    }
    if (wikiText.startsWith("@returns")) {
        return handle_returns(wikiText)
    }
    
    if (wikiText.startsWith("@circular_bars")) {
        return handle_circular_bars(wikiText)
    }
    

    let html = '';
    let lines = wikiText.split("\n")
    lines.forEach(line => {
        line = line.trim()
        //if(line.length>0)
        {
            //::text center::
            //line = center_aligned(line)
            
            //:bold:
            //line = bold(line)
            
            // _italic_
            //line = italic(line)
            
            // !highlight!
            line = handle_highlight(line)
            
            // x^y^
            line = sup(line)
            // x~y~
            line = sub(line)

            // handle {2+2} eval expression
            line = handle_calculations(line)

            // progress bar #20%
            line = progress_bar(line)

            //--- means a line
            line = check_for_line(line)

            //handle custom class
            line = handle_insert_class(line)


            //handle charts
            // line = handle_charts(line)
            // console.log(line)

            if (line.startsWith('#')) {
                // Handle headings
                const level = line.match(/^(#+)/)[0].length;
                const text = line.replace(/#+/g, '').trim().toLocaleLowerCase();
                html += `<h${level}>${text}</h${level}>`;
            } else if (line.startsWith("~")) {
                const text = line.replace(/~/g, '').trim()
                if (text.length > 0)
                    html += box(text)
            }
            else if (line.startsWith('*') || line.startsWith('-')) {
                html += handle_list(line)
            }
            else if (line.startsWith("{{") && line.endsWith("}}")) {
                //handle custom template
                var text = line.replace(/\{\{|\}\}/g, '').trim()
                var args = text.split("#")
                console.log(args)
                switch (args[0]) {
                    case "flex":
                        html += flex(args[1], args[2])
                        break;
                    case "img":
                        html += place_img(args[1], args[2])
                        break;
                }
            } else if (line.startsWith(".")) {
                html += insert_tag(line)
            }
            else {
                // Handle regular text
                if (line.length > 0) {
                    html += `<div>${line}</div>`;
                    // console.log(html)
                }
            }
        }
    });
    return `${html}`;
}
