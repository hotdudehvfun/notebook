function sidebar_controller($scope, notebook_service,shared_service,db_service) {
    //dialog flags
    $scope.show_dialog = false;
    $scope.items = []
    //turn on off with shared service
    $scope.$on('open_sidebar_changed', function (event, state) {
        console.log("open side bar")
        $scope.show_dialog = state
        if(state)
        {
            //prepare items to display
            $scope.init_items()
        }
    });

    $scope.app_size = () => { return db_service.db_size() }
    $scope.init_items = ()=>{
        try {
            const primary_texts = [
                ["App Size","size"],
                ["Manage Database","db"],
                ["Manage Tags","tags"],
                ["Total notebooks","notebooks"],
            ];
            const secondary_texts = {
                size:$scope.app_size(),
                db:"Open",
                tags:"Open",
                notebooks:db_service.read_notebooks().length,
            }
    
            const actions = {
                size:()=>{},
                db:()=>{
                    $scope.show_dialog = false;
                    shared_service.set("open_db_manager", true)
                },
                tags:()=>{
                    shared_service.set("show_view",shared_service.CONST.VIEW_TAG)
                },
                notebooks:()=>{}
            }
    
            // [text,key] = item deconstruct
            const items = primary_texts.map(([text,key])=>{
                return{
                    p_t:text,
                    s_t:secondary_texts[key],
                    action:()=>{
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