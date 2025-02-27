function db_service() {
    //read from storage and return data
    this.read= function () {
        try {
            //read system vars
            let data = {
                system_vars: {},
                notebooks: setupDemoList(),
                selectedListIndex:-1,
                theme:"dark",
            }
            if (is_valid_json(localStorage.system_vars)) {
                data.system_vars = JSON.parse(localStorage.system_vars)
            }
            
            if (is_valid_json(localStorage.appData)) {
                data.notebooks = JSON.parse(localStorage.appData)
            }

            data.selectedListIndex = localStorage.selectedListIndex || -1;
            data.theme = localStorage.theme || "dark";
            
            //save notebook sort by
            data.notebook_sort_by = localStorage.notebook_sort_by || "date"
            return data;
        } catch (err) {
            console.log("Error while reading data", err)
        }
    }

    this.write = function(data,angular) {
        try {
            //save data about app in local
            let json = angular.toJson(data.notebooks);
            
            //appData is an array 
            localStorage.appData = json;
            
            //save selectedListIndex
            localStorage.selectedListIndex = data.selectedListIndex;
            
            //save theme
            localStorage.theme = data.theme

            //save system vars
            localStorage.system_vars = JSON.stringify(data.system_vars)

            //save notebook sort by
            localStorage.notebook_sort_by = data.notebook_sort_by

        } catch (error) {
            console.log("Error while writing data", err)
        }
    }
}