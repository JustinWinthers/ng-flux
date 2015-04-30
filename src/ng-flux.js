/*

 Flux library for your Angular 1.4 apps.

 Heavily influenced by Victor Savkin's great post showing how to use with Angular 2, but no reason
 we can't use it in our 1.x apps with great success!

 Victor's article:
 http://victorsavkin.com/post/99998937651/building-angular-apps-using-flux-architecture

 Strictly follows the FLUX pattern and instantiates only one dispatcher as a Singleton for the application.

 - Justin Winthers

 */

(function(){
    var ngModule = angular.module

        ,storeInstances = []

        ,EventEmitter = function(prefix){
            this._prefix = prefix + 'Callback' || 'dispatchCallback';
            this._id = 0;
            this._callbacks = {};
        }

        ,Store = function(prefix){
            this._id = 0;
            this._prefix = prefix + 'Callback' || 'storeCallback';
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

    Store.prototype.emit = EventEmitter.prototype.emit;

    Store.prototype.emitChange = function(e){

        this.emit(e || "change");

        setTimeout(function(){angular.element('body').scope().$digest()},0);
    };

    Store.prototype.init = function(){
        this.data = {};
    };

    Store.prototype.register = function(fn){

        var _store = this;

        angular.element('body').scope().$watch(function(){
                return _store.data;
            },
            function(newVal, oldVal){
                if (newVal !== oldVal) fn();
            }
        );

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
                _store = new Store(key);
                storeInstances.push({key:key,instance:_store});
            }

            this.factory(key, function(){
                return instantiateStore();
            });

            setTimeout(instantiateStore,0);  // immediately invoke store for app startup

            function instantiateStore(){return angular.injector([name]).invoke(factory, _store)}

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