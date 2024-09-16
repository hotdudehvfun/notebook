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
            return data;
        } catch (err) {
            showToast("Error while reading data")
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
        } catch (error) {
            showToast("Error while writing data")
            console.log("Error while writing data", err)
        }

    }
}