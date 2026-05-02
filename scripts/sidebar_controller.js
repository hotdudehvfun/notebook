function sidebar_controller($scope, notebook_service, shared_service, db_service) {
    //dialog flags
    $scope.show_dialog = false;
    $scope.items = []
    //turn on off with shared service
    $scope.$on('open_sidebar_changed', function (event, state) {
        console.log("side bar state changed")
        $scope.show_dialog = state
        if (state) {
            //prepare items to display
            $scope.init_items()
        }
    });

    $scope.greet_user = (username) => {
        return greet_user(username);
    }

    $scope.app_size = () => { return db_service.db_size() }
    $scope.init_items = () => {
        try {
            const primary_texts = [
                [`Version: 4.0.1`, "version"],
                [`Size: ${$scope.app_size()}`, "size"],
                ["Database", "db"],
                ["Tags", "tags"],
                ["Vars", "system_vars"],
                ["Bin", "bin"],
            ];

            const secondary_texts = {
                version: "leaf.svg",
                size: "box.svg",
                db: "database.svg",
                tags: "tag.svg",
                system_vars: "settings.svg",
                bin: "bin.svg",
            };

            const accent_colors = {
                version: "#6366f1",      // indigo (info/version)
                size: "#06b6d4",         // cyan (storage/space)
                db: "#10b981",           // green (data/safe)
                tags: "#f59e0b",         // amber (labels/categories)
                system_vars: "#8b5cf6", // purple (system/settings)
                bin: "#ef4444",          // red (delete/danger)
            };

            const actions = {
                size: () => { },
                db: () => {
                    shared_service.set("open_db_manager", true);
                },
                tags: () => {
                    shared_service.set("show_view", shared_service.CONST.VIEW_TAG);
                },
                system_vars: () => {
                    shared_service.set("show_view", shared_service.CONST.VIEW_SYSTEM);
                },
                bin: () => {
                    shared_service.set("show_view", shared_service.CONST.VIEW_BIN);
                }
            };

            $scope.items = primary_texts.map(([text, key]) => ({
                p_t: text,
                s_t: secondary_texts[key],
                accent_color: accent_colors[key],
                action: () => {
                    $scope.show_dialog = false;
                    actions[key]?.();
                }
            }));

        } catch (err) {
            console.log(err);
        }
    };
}