
  
  // if no data is found create demo files
  function setupDemoList() {
    //demo list
    let list = new List("First Notebook");
    let task = new Task("We have added first note!");
    list.taskArray.push(task);
    return [list];
  }

function bold(line)
{
    return line.replace(/:(.*?)(:)/g, '<b>$1</b>')
}
function italic(line)
{
    return line.replace(/_(.*?)(_)/g, '<i>$1</i>')
}
function sup(line)
{
    return line.replace(/\^(.*?)(\^)/g, '<sup>$1</sup>')
}
function sub(line)
{
    return line.replace(/\~(.*?)(\~)/g, '<sub>$1</sub>')
}

function progress_bar(text) {
    if(text.includes(","))
    {
        return multi_progress_bar(text)
    }
    const regex = /#((100|0|[1-9]?\d)(\.\d+)?|100(\.0+)?|0(\.0+)?|0)%/g;
    return text.replace(regex, (match, p1) => {
        return `
        <div class="progress_bar">
            <div class="progress progress_rounded bg-green" style="width:${p1}%;">${p1}%</div>
        </div>`;
    });
}


function multi_progress_bar(text) {
    const regex = /#((\d{1,3}(,\d{1,3})*)%)/g;
    return text.replace(regex, (match, p1) => {
        const percentages = p1.split(',').map(value => value.trim().replace("%",""));
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



function check_for_system_vars(value)
{
    // Recursive function to evaluate expressions
    function evaluate(value) {
        return value.replace(/\b[a-zA-Z_]\w*\b/g, function(match) {
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
            console.error(`Error evaluating expression: ${expression}`, e);
            return match; // Return the original match if there's an error
        }
    });
}


function handle_list(line)
{
    // Handle lists
    // if a single line contains many * it will be converted to list items
    // it means * cannot be used in text if a line starts with *
    let html=""
    line.split("*").forEach((item)=>{
        let text = item.replace(/[\*\-]/g, '').trim();
        if(text.length>0)
            html += `<li>${text}</li>`
    })
    return html
}

function center_aligned(text) {
    const centerAlignedRegex = /::(.*?)::/g;
    const htmlText = text.replace(centerAlignedRegex, '<div class="text-center">$1</div>');
    return htmlText;
}

function box(line)
{
    return `<div class="box">${parseWikiTextToHTML(line.trim())}</div>`
}

function insert_tag(line)
{
    var html=""
    try {
        // start tag len = 2
        // end tag len = 3
        // .ol ..ol
        var arr = line.split(".")
        var tag = arr[arr.length-1]
        if(arr.length==2)
            html = `<${tag}>`
        else
            html = `</${tag}>`
    } catch (error)
    {
        html="ERROR"
    }
    return html
}

//_class1_class2_class3
function handle_insert_class(input) {
    // Regular expression to match lines starting with _class1_class2_... followed by text
    return input.replace(/^_([\w_]+)\s(.+)/gm, function(match, classes, text) {
        // Replace underscores with spaces to separate class names
        const classList = classes.replace(/_/g, ' ');
        return `<span class="${classList}">${text}</span>`;
    });
}

function handle_charts(text)
{
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
    setTimeout(()=>{
        update_chart(labels,values,id,type,title)
    },50)
    return `<canvas id="${id}"></canvas>`
}
function update_chart(_labels,values,id,_type,title)
{
    new Chart(id, {
        type: _type,
        data: {
          labels: _labels,
          datasets: [{
            backgroundColor: COLORS.ALL,
            data: values
          }]
        },
        options: {
          title: {
            display: true,
            text: title
          }
        }
      });
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
        for(var i=0;i<sumRow.length;i++)
            tableHtml += `<td>${sumRow[i] !== undefined ? sumRow[i] : 'Total'}</td>`;

        tableHtml += '</tr>';
    }

    tableHtml += '</tbody></table>';

    return tableHtml; // Return the generated table HTML
}


function parseWikiTextToHTML(wikiText) {

    wikiText = wikiText.trim()
    if(wikiText.startsWith("@table"))
    {
        return handle_table_component(wikiText)
    }
    if(wikiText.startsWith("@chart"))
    {
        return handle_charts(wikiText)
    }
    let html = '';
    let lines = wikiText.split("\n")
    lines.forEach(line => {
        line = line.trim()
        if(line.length>0)
        {
            //::text center::
            line = center_aligned(line)
            //:bold:
            line = bold(line)
            // _italic_
            //line = italic(line)
            // x^y^
            line = sup(line)
            // x~y~
            line = sub(line)
            // handle {2+2} eval expression
            line = handle_calculations(line)

            // progress bar #20%
            line = progress_bar(line)

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
            } else if(line.startsWith("~"))
            {
                const text = line.replace(/~/g,'').trim()
                if(text.length>0)
                    html += box(text) 
            }
            else if (line.startsWith('*')||line.startsWith('-')) {
                html += handle_list(line)
            }
            else if(line.startsWith("{{") && line.endsWith("}}"))
            {
                //handle custom template
                var text = line.replace(/\{\{|\}\}/g, '').trim()
                var args = text.split("#")
                console.log(args)
                switch(args[0])
                {
                    case "flex":
                        html+= flex(args[1],args[2])
                        break;
                    case "img":
                        html+= place_img(args[1],args[2])
                        break;
                }
            } else if(line.startsWith("."))
            {
                html+= insert_tag(line)
            }
            else {
                // Handle regular text
                if(line.length>0)
                {
                    html += `<p>${line}</p>`;
                }
            } 
        }
    });
    return `${html}`;
}
