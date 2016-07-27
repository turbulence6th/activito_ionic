angular.module('starter', ['ionic', 'ionic.service.core', 'starter.controllers', 'starter.services', 'ngCordovaOauth', 'ngCordova', 'jett.ionic.content.banner', 'ionic-datepicker', 'ionic-timepicker'
    ,'google.places', 'jrCrop'])

.run(function($ionicPlatform, $state, $rootScope, $stateParams, $cordovaPush, $cordovaNetwork, $ionicHistory, $ionicPopup,
              $ionicScrollDelegate, $timeout){
    $ionicPlatform.ready(function() {
        
        if(navigator.splashscreen) {
            navigator.splashscreen.hide();
        }
        
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
            cordova.plugins.Keyboard.disableScroll(true);
        }
      
        if (window.StatusBar) {
            StatusBar.styleLightContent();
        }


        if(window.localStorage['myColor'] != 'undefined') {
            $rootScope.myColor = window.localStorage['myColor'];
        } else {
            $rootScope.myColor = '#46C7F3';
        }

    }).then(function(){
        if(navigator.splashscreen) {
            navigator.splashscreen.hide();
        }
    });
    
    var lang = navigator.language || navigator.userLanguage;
    
    if(lang == 'tr-TR')
        $rootScope.lang = 'tr';
    else
        $rootScope.lang= 'en';
    
    $rootScope.translate = function(string) {
      return i18n[$rootScope.lang][string];
    };
    
    $rootScope.getDate = function(date) {
        date = new Date(date);
        var yyyy = date.getFullYear().toString();
        var mm = date.getMonth();
        var dd  = date.getDate().toString();
        var hh = date.getHours().toString();
        var MM = date.getMinutes().toString();
        var monthNames = $rootScope.translate('months');
        return (dd[1]?dd:"0"+dd[0]) + " " + monthNames[mm] +
            " " + yyyy + " - " + (hh[1]?hh:"0"+hh[0]) + ":" + (MM[1]?MM:"0"+MM[0]);
    };
    
    if(ionic.Platform.isIOS()) {
        var iosConfig = {
            "badge": true,
            "sound": true,
            "alert": true
        };

        document.addEventListener("deviceready", function(){
            $cordovaPush.register(iosConfig).then(function(deviceToken) {
                // Success -- send deviceToken to server, and store for future use
                localStorage['pushToken'] = deviceToken;
            }, function(err) {
              alert("Registration error: " + err)
            });

            $rootScope.$on('$cordovaPush:notificationReceived', function(event, notification) {
                if(notification.foreground){
                    if(notification.user_message){
                        var message = JSON.parse(notification.user_message);
                        if(message.to_type=='User' && $state.href($state.current) == '#/tab/messages/User/' + message.from_id){
                            $rootScope.$broadcast('newMessage', { message: message });
                        }

                        else if(message.to_type=='Event' && $state.href($state.current) == '#/tab/messages/Event/' + message.to_id){
                            $rootScope.$broadcast('newMessage', { message: message });
                        }
                    }

                    else if(notification.follow_request){
                        $rootScope.$broadcast('newFollowRequest', { });
                    }

                    else if(notification.event_request){
                        $rootScope.$broadcast('newEventRequest', { });
                    }
                }

                else {
                    if (notification.alert) {
                        navigator.notification.alert(notification.alert);
                    }

                    if (notification.sound) {
                        var snd = new Media(event.sound);
                        snd.play();
                    }

                    if (notification.badge) {
                        $cordovaPush.setBadgeNumber(notification.badge).then(function(result) {
                        // Success!
                        }, function(err) {
                        // An error occurred. Show a message to the user
                        });
                    }
                }
                
            });

           

        });
    }
    
    else if(ionic.Platform.isAndroid()) {
        var androidConfig = {
            "senderID": "1040942338593"
        };

        document.addEventListener("deviceready", function(){
            $cordovaPush.register(androidConfig).then(function(result) {
                console.log('GCM registeration status : ' + result);
            }, function(err) {
                console.log('GCM registeration status : ' + err);
            });

            $rootScope.$on('$cordovaPush:notificationReceived', function(event, notification) {
                switch(notification.event) {
                    case 'registered':
                        if (notification.regid.length > 0 ) {
                            localStorage['pushToken'] = notification.regid;
                        }
                        break;
                    case 'message':
                        if(notification.foreground){
                            if(notification.payload.user_message){
                                var message = notification.payload.user_message;
                                if(message.to_type=='User' && $state.href($state.current) == '#/tab/messages/User/' + message.from_id){
                                    $rootScope.$broadcast('newMessage', { message: message });
                                }

                                else if(message.to_type=='Event' && $state.href($state.current) == '#/tab/messages/Event/' + message.to_id){
                                    $rootScope.$broadcast('newMessage', { message: message });
                                }
                            }

                            else if(notification.payload.follow_request){
                                $rootScope.$broadcast('newFollowRequest', { });
                            }

                            else if(notification.payload.event_request){
                                $rootScope.$broadcast('newEventRequest', { });
                            }
                        }
                        
                        else {
                            if(notification.payload.user_message){
                                var message = notification.payload.user_message;
                                if(message.to_type=='User'){
                                    $state.go('tab.message-detail', {type: 'User', id: message.from_id});
                                }

                                else if(message.to_type=='Event'){
                                    $state.go('tab.message-detail', {type: 'Event', id: message.to_id});
                                }
                            }
                            
                            else if(notification.payload.follow_request){
                                $rootScope.$broadcast('openFollowRequest', { });
                            }
                            
                            else if(notification.payload.event_request){
                                $rootScope.$broadcast('openEventRequest', { });
                            }
                        }

                        break;
              }
            });
        });
    }
    
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;

    $ionicPlatform.registerBackButtonAction(function() {
        var backView =  $ionicHistory.viewHistory().backView;
        if(backView)
            $ionicHistory.viewHistory().backView.go();
        else{
            var confirmPopup = $ionicPopup.confirm({
                title: 'Çıkış',
                template: 'Çıkmak istediğinizden emin misiniz?',
                cancelText: 'Hayır',
                okText: 'Evet'
            });

            confirmPopup.then(function(res) {
                if(res) {
                    navigator.app.exitApp();
                }
            });
        }
    }, 100);
    
    document.addEventListener("deviceready", function(){
        
        if(localStorage['auth_token'])
            $rootScope.$broadcast('loggedIn', { });
        
        var type = $cordovaNetwork.getNetwork();
        var isOnline = $cordovaNetwork.isOnline();
        var isOffline = $cordovaNetwork.isOffline();

        // listen for Online event
        $rootScope.$on('$cordovaNetwork:online', function(event, networkState){
            var onlineState = networkState;
            if(localStorage['auth_token'])
                $rootScope.$broadcast('loggedIn', { });
        });

        // listen for Offline event
        $rootScope.$on('$cordovaNetwork:offline', function(event, networkState){
            var offlineState = networkState;
        });
        
    });
    
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        if(toState.name == "tab.messages"){
            $timeout(function(){
                 $ionicScrollDelegate.scrollTop();
             }, 100);
        }
    });

})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
    
    var isAndroid = ionic.Platform.isAndroid();
    if (isAndroid) {
        $ionicConfigProvider.tabs.position('bottom');
        $ionicConfigProvider.tabs.style('standard');
    }
    $ionicConfigProvider.navBar.alignTitle('center');
    $stateProvider.state('login', {
        url: "/login",
        templateUrl: "templates/login.html",
        controller: 'LoginCtrl'
    })

    // setup an abstract state for the tabs directive
    .state('tab', {
        url: "/tab",
        abstract: true,
        templateUrl: "templates/tabs.html",
        controller: 'BaseCtrl'
    })

    // Each tab has its own nav history stack:
    .state('tab.dash', {
        url: '/dash',
        views: {
            'tab-dash': {
                templateUrl: 'templates/tab-dash.html'
            }
        }
    })
  
    .state('tab.messages', {
        url: '/messages',
        views: {
            'tab-messages': {
                templateUrl: 'templates/tab-messages.html',
                controller: 'MessageListCtrl'
            }
        }
    })
    
    .state('tab.events', {
        url: '/events',
        views: {
            'tab-events': {
                templateUrl: 'templates/tab-events.html',
                controller: 'EventListCtrl'
            }
        }
    })
    
    .state('tab.message-detail', {
        url: '/messages/:type/:id',
        views: {
            'tab-messages': {
                templateUrl: 'templates/message-detail.html',
                controller: 'MessageCtrl'
            }
        }
    })
    
    .state('tab.account', {
        url: '/account/:userId',
        views: {
            'tab-account': {
                templateUrl: 'templates/tab-account.html',
                controller: 'UserCtrl'
            }
        }
    })
    
    .state('tab.settings', {
        url: '/settings',
        views: {
            'tab-settings': {
                templateUrl: 'templates/settings.html',
                controller: 'SettingsCtrl'
            }
        }
    })
    
    .state('tab.event', {
        url: '/event/:id',
        views: {
            'tab-events': {
                templateUrl: 'templates/event.html',
                controller: 'EventCtrl'
            }
        }
    })

    .state('intro', {
        url: '/',
        templateUrl: 'templates/intro.html',
        controller: 'IntroCtrl'
    })

    .state('tab.addevent', {
        url: '/addevent',
        views: {
            'tab-events': {
                templateUrl: 'templates/addevent.html',
                controller: 'CreateEventCtrl'
            }
        }
    })

    .state('tab.addevent2', {
        url: '/addevent2',
        views: {
            'tab-events': {
                templateUrl: 'templates/addevent2.html',
                controller: 'CreateEventCtrl'
            }
        }
    })

    .state('tab.userevents', {
        url: '/account/:userId/events',
        views: {
            'tab-account': {
                templateUrl: 'templates/userevents.html',
                controller: 'UserEventsCtrl' 
            }
        }
    })

    .state('tab.usercomments', {
        url: '/usercomments',
        views: {
            'tab-account': {
                templateUrl: 'templates/usercomments.html',
                controller: 'UserCtrl' 
            }
        }
    });

    if(window.localStorage['auth_token']) {
        $urlRouterProvider.otherwise('/tab/events');
    }
    
    else if(window.localStorage['introPassed'] != 'true')  {
        $urlRouterProvider.otherwise('/');
    }
    
    else {
        $urlRouterProvider.otherwise('/login');
    }
  
});