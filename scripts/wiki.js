
  
  // if no data is found create demo files
  function setupDemoList() {
    let list = new List("Your First Notebook");
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
    // Create a regex to match #XX% where XX is any number from 0 to 100
    //const regex = /#(\d{1,2}|100)%/g;
    const regex = /#((100|0|[1-9]?\d)(\.\d+)?|100(\.0+)?|0(\.0+)?|0)%/g;
    
    // Use replace with a callback to dynamically insert the matched percentage
    return text.replace(regex, (match, p1) => {
        return `<div
        class="progress_bar" 
        data-value="${p1}"
        style="background: linear-gradient(
          to right, 
          var(--progress-a),
          var(--progress-a) ${p1}%,
          var(--progress-b) ${p1}%,
          var(--progress-b)
        );"
        >
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


function handle_calculations(text) {
    // Create a regex to match {2+2} and evaluate expression
    const regex = /{([^}]+)}/g;
    // Use replace with a callback to dynamically insert the match
    return text.replace(regex, (match, expression) => {
        try {
            //replace var name with value here.
            expression = check_for_system_vars(expression)
            let result = eval(expression)
            result = result % 1 === 0 ? result : result.toFixed(1)
            return result 
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
