function db_controller($scope, notebook_service, shared_service) {

    $scope.show_dialog = false;
    $scope.db_operation = null;
    $scope.db_textarea = ""
    $scope.CONST = {
            IMPORT: "import",
            EXPORT: "export"
    }
    // sending message to angular from outside world
    $scope.$on('file_onchange', function (event, newValue) {
        // console.log(newValue)
        $scope.db_textarea = newValue;
    });

    $scope.$on('open_db_manager_changed', function (event, state) {
        $scope.show_dialog = state;
    });


    $scope.export_data = () => {
        try {
            console.log($scope.password)
            if ($scope.password.length == 0) {
                alert("You must use password to lock this file")
                return "";
            }
            let data = JSON.stringify(localStorage)
            data = encrypt_data(data, $scope.password)
            $scope.password.value = ""
            const blob = new Blob([data], {
                type: "text/plain"
            });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = get_download_file_name()
            link.click();
            URL.revokeObjectURL(link.href);
            $scope.show_dialog = false
            $scope.db_operation = null
        } catch (err) {
            console.log("Error export db", err)
        }
    }

    $scope.import_data = () => {
        try {
            if ($scope.db_operation != $scope.CONST.IMPORT) {
                $scope.show_toast("Operation not selected")
                return ""
            }

            if ($scope.db_textarea.length == 0) {
                $scope.show_toast("Missing text")
                return ""
            }

            // console.log($scope.db_textarea)
            $scope.db_textarea = $scope.unlock_file()
            if (!is_valid_json($scope.db_textarea)) {
                $scope.show_toast("Invalid JSON code")
                return ""
            }

            if (confirm("Overwrite everything with new data?")) {
                let data = JSON.parse($scope.db_textarea)
                Object.keys(data).forEach(key => {
                    localStorage.setItem(key, data[key]);
                }
                );
                $scope.show_toast("Import Successful");
                $scope.db_textarea = "";
                $scope.db_operation = null;
                location.reload();

            }
        } catch (err) {
            $scope.show_toast("Failed to import data.");
            console.error("Failed to import data.", err);
        }
    }

    $scope.unlock_file = () => {
        try {
            if ($scope.password.length > 0) {
                const testDecryption = decrypt_data($scope.db_textarea, $scope.password);
                if (testDecryption !== null && testDecryption !== "") {
                    $scope.password = "";
                    return testDecryption
                }
            }
            return -1
        } catch (err) {
        }
    };


    $scope.init = () => {
        try {

        } catch (err) {
            console.log(err)
        }
    }

}