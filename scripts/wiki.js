
  
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

function handle_charts(line) {
    // Check if the line starts with '_chart'
    if (line.startsWith('@chart')) {
        // Extract the content after '_chart'
        let content = line.replace('@chart', '').trim();

        // Create variables for labels, values, and type
        let labels = [];
        let values = [];
        let type = '';

        // Split the content by spaces, then by each parameter (Labels, Values, Type)
        let params = content.split(' ');
        params.forEach(param => {
            let [key, value] = param.split(':');
            key = key.toLowerCase();

            if (key === 'labels') {
                // Split labels by comma and trim each
                labels = value.split(',').map(label => label.trim());
            } else if (key === 'values') {
                // Split values by comma and convert to numbers
                values = value.split(',').map(val => parseFloat(val.trim()));
            } else if (key === 'type') {
                // Assign chart type
                type = value.trim();
            }
        });
        return `<canvas id="myChart"></canvas>`
    }
}



function parseWikiTextToHTML(wikiText) {
    var lines = wikiText.trim().split('\n');
    let html = '';
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
            } else if (line.startsWith('|')) {
                // Handle tables
                const cells = line.split('|').map(cell => cell.trim()).filter(Boolean);
                const tableRow = cells.map(cell => `<td>${cell}</td>`).join('');
                html += `<tr>${tableRow}</tr>`;
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
