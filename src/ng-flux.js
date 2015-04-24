/*

 Flux library for your Angular 1.4 apps.

 Heavily influenced by Victor Savkin's great post showing how to use with Angular 2, but no reason
 we can't use it in our 1.x apps with great success!

 Victor's article:
 http://victorsavkin.com/post/99998937651/building-angular-apps-using-flux-architecture


 Strictly follows the FLUX pattern and instantiates only one dispatcher as a Singleton for the application.

 todo: auto instantiate stores in app by injecting them in the given module's run blocks

 - Justin Winthers


 Creating an action to send events to the dispatcher:

 .action('individualActions', function(dispatcher){

 return {
 individual: function(individual){
 dispatcher.emit({
 actionType: 'ADD_INDIVIDUAL',
 individual:individual
 })
 }
 }
 })




 How to instantiate a store in your Angular module:

 .store('itemStore',function(dispatcher){

 var _store = this;

 dispatcher.register(function(action){

 switch (action.actionType){
 case 'INITIALIZE':
 _store.init();
 _store.emitChange();
 break;
 case 'ADD_ITEM':
 _store.data = action.items;
 _store.emitChange();
 break;
 }
 });

 return {
 register:function(fn){_store.register(fn)},
 items:function(){return _store.data}
 }
 })

 Accessing the store in a controller, factory, service, or link function:

 itemStore.register(function(){
 $scope.items = individualStore.items();
 });



 Optional component semantics influenced by this blog post:
 http://blog.ninja-squad.com/2014/12/15/what-is-coming-in-angularjs-1.4/

 Writing Small directives as components

 With this library you can write: app.component ('component', template, scope, controller);

 as a shortcut for:

 app.directive ('component', function () {
 return {
 controllerAs: 'component',
 scope: scope,
 template: template,
 controller: controller
 };
 });

 */

(function(){
    var ngModule = angular.module

        ,storeInstances = []

        ,EventEmitter = function(prefix){
            this._prefix = prefix || 'dispatch';
            this._id = 0;
            this._callbacks = {};
        }

        ,Store = function(){
            this._id = 0;
            this._prefix = 'store';
            this._callbacks={};
            this.data={};
        }

        ,dispatcher;


    EventEmitter.prototype = {
        emit: function(event) {

            for (var prop in this._callbacks){
                if (this._callbacks.hasOwnProperty(prop)){
                    this._callbacks[prop](event);
                }
            }
        },
        register: function(listener) {

            var register = true;

            for (var prop in this._callbacks){
                if (this._callbacks.hasOwnProperty(prop)){
                    if (this._callbacks[prop].toString() === listener.toString()){
                        register = false;
                    }
                }
            }

            if (register) {
                ++this._id;
                this._callbacks[this._prefix + this._id] = listener;
            }

            return this._prefix + this._id;

        }
    };

    Store.prototype = EventEmitter.prototype;

    Store.prototype.emitChange = function(){
        this.emit("change")
    };

    Store.prototype.init = function(){
        this.data = {};
    };

    dispatcher = new EventEmitter('dispatcherSingleton');


    angular.module = function () {

        var ngModuleFn = ngModule.apply(angular, arguments);

        ngModuleFn.factory('depends',function($injector){
            //ensure instantiation of data persistence stores in app
            return function(dependency){

                try {
                    $injector.get(dependency, null);
                }
                catch (e) {
                    console.log ('caught circular dependency for', dependency);
                }
            }
        });

        ngModuleFn.factory('dispatcher',function(){
            return dispatcher;
        });


        ngModuleFn.action = function(key, factory){
            this.factory(key, factory);
            return this;
        };

        ngModuleFn.store = function(key, factory){

            var name = this.name, _store;
            var newInstance = true;

            // only instantiate one instance of a given store

            for (var i=0; i < storeInstances.length; i++) {
                if (key===storeInstances[i].key) {
                    newInstance=false;
                    _store = storeInstances[i].instance;
                }
            }

            if (newInstance) {
                _store = new Store;
                storeInstances.push({key:key,instance:_store});
            }

            this.factory(key, function(){
                return angular.injector([name]).invoke(factory, _store);
            });

            return this;
        };

        ngModuleFn.component = function (directiveName, template, scope, controller) {

            this.directive(directiveName,function(){

                var ddo = {};

                if (template) ddo.template = template;
                if (scope) ddo.scope = scope;
                if (controller) ddo.controller = controller, ddo.controllerAs = directiveName;

                return ddo;

            });
            return this;
        };

        return ngModuleFn;
    };

})();