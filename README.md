# ng-flux
Flux library for your Angular 1.4 apps

Heavily influenced by Victor Savkin's great post showing how to use with Angular 2, but no reason
we can't use it in our 1.x apps with great success!

Victor's article:
    http://victorsavkin.com/post/99998937651/building-angular-apps-using-flux-architecture


 Strictly follows the FLUX pattern and instantiates only one dispatcher as a Singleton for the application.

 todo: auto instantiate stores in app by injecting them in the given module's run blocks



How can I install it?
============
1) Get the library:

**Download from Github**

        git clone git@github.com:JustinWinthers/ng-flux.git


**Using Bower**

        bower install ng-flux



#Creating an action to send events to the dispatcher:

````javascript

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

````


#How to instantiate a store in your Angular module:

````javascript

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
````


#Accessing the store in a controller, factory, service, or link function:

````javascript

     itemStore.register(function(){
        $scope.items = individualStore.items();
     });

````

#Optional component semantics influenced by this blog post:
 http://blog.ninja-squad.com/2014/12/15/what-is-coming-in-angularjs-1.4/

 Writing Small directives as components

 With this library you can write:

 ````javascript

    app.component ('component', template, scope, controller);

````

 as a shortcut for:

````javascript
     app.directive ('component', function () {
         return {
            controllerAs: 'component',
            scope: scope,
            template: template,
            controller: controller
         };
     });
 ````

 */