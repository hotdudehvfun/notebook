function sidebar_controller($scope, notebook_service,shared_service,db_service) {
    //dialog flags
    $scope.show_dialog = false;
    $scope.items = []
    //turn on off with shared service
    $scope.$on('open_sidebar_changed', function (event, state) {
        console.log("side bar state changed")
        $scope.show_dialog = state
        if(state)
        {
            //prepare items to display
            $scope.init_items()
        }
    });

    $scope.greet_user = (username) => {
        return greet_user(username);
    }

    $scope.app_size = () => { return db_service.db_size() }
    $scope.init_items = ()=>{
        try {
            const primary_texts = [
                [`App Size:${$scope.app_size()}`,"size"],
                ["Manage Database","db"],
                ["Manage Tags","tags"],
                ["System Vars","system_vars"],
                ["Recyle bin","bin"],

            ];
            const secondary_texts = {
                size:"📚",
                db:"💾",
                tags:"🗃",
                system_vars:"⚙️",
                bin:"🗑️"
            }
    
            const actions = {
                size:()=>{},
                db:()=>{
                    shared_service.set("open_db_manager", true)
                },
                tags:()=>{
                    shared_service.set("show_view",shared_service.CONST.VIEW_TAG)
                },
                system_vars:()=>{
                    shared_service.set("show_view",shared_service.CONST.VIEW_SYSTEM)
                },
                bin:()=>{
                    shared_service.set("show_view",shared_service.CONST.VIEW_BIN)
                }
            }
    
            // [text,key] = item deconstruct
            const items = primary_texts.map(([text,key])=>{
                return{
                    p_t:text,
                    s_t:secondary_texts[key],
                    action:()=>{
                        $scope.show_dialog = false;
                        actions[key]();
                    }
                }
            })
            $scope.items = items;
        } catch (err) {
            console.log(err)
        }
    }


}