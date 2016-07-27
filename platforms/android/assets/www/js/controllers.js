angular.module('starter.controllers', [])

.controller('LoginCtrl', function($scope, $state, $cordovaOauth, $http, $rootScope, $cordovaDevice, AppSettings) {
   
	$scope.loginFacebook = function() {
        $cordovaOauth.facebook('1059660204090198', ["public_profile", "user_friends","user_education_history", "user_likes"], {redirect_uri: AppSettings.url + "/callback"}).then(function(result){
            $http.post(AppSettings.url + '/loginFacebook', {
                access_token: result.access_token,
                pushToken: localStorage['pushToken'],
                deviceId: $cordovaDevice.getUUID(),
                deviceType: ionic.Platform.platform()
            }).then(function(response) {
                if(response.data.auth_token) {
                    window.localStorage['auth_token'] = response.data.auth_token;
                    $state.go('tab.events');
                    $rootScope.$broadcast('loggedIn', { });
                }
            }, AppSettings.connectionError);
        });   
	};
    
    $scope.loginGoogle = function() {
        $cordovaOauth.google('1040942338593-l4iirvnj5p4l4hv3jp71pakust9vb4ka.apps.googleusercontent.com', ["profile", "email"], {redirect_uri: AppSettings.url + "/callback"}).then(function(result){
            $http.post(AppSettings.url + '/loginGoogle', {
                access_token: result.access_token,
                pushToken: localStorage['pushToken'],
                deviceId: $cordovaDevice.getUUID(),
                deviceType: ionic.Platform.platform()
            }).then(function(response) {
                if(response.data.auth_token) {
                    window.localStorage['auth_token'] = response.data.auth_token;
                    $state.go('tab.events');
                    $rootScope.$broadcast('loggedIn', { });
                }
            }, AppSettings.connectionError);
        });
    };
    
})

.controller('EventListCtrl', function($scope, $state, $q, $cordovaGeolocation, $http, AppSettings, $ionicSideMenuDelegate, $ionicModal, $ionicLoading, $timeout, $ionicPopup, $rootScope){
    $scope.canBeLoaded = true;
    $scope.events = [];
    $scope.search = {
        eventTypesList: []
    };

    if(!localStorage['eventName']){
        localStorage['eventName'] = '';
    }
    
    if(!localStorage['distance']){
        localStorage['distance'] = 25;
    }
    
    $scope.search.eventName = localStorage['eventName'];
    $scope.search.distance = localStorage['distance'];
    
    var eventTypes = $rootScope.translate('eventTypes');
    
    for(var i=0; i<eventTypes.length; i++){
        if(localStorage['eventType' + i] == undefined){
            localStorage['eventType' + i] = true;
        }
        
        $scope.search.eventTypesList.push({
            value: eventTypes[i],
            checked: localStorage['eventType' + i] === "true",
            key: i
        });
    }

    $scope.searchEvent = function(){
        localStorage['eventName'] = $scope.search.eventName;
        localStorage['distance'] = $scope.search.distance;
        for(var i=0; i<$scope.search.eventTypesList.length; i++){
            localStorage['eventType' + i] = $scope.search.eventTypesList[i].checked;
        }
        $scope.modal.hide();
        $scope.refreshEvents();
    };

    //Açılır modal kısmı
    $ionicModal.fromTemplateUrl('eventdetails.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal = modal;
    });
    
    $scope.openModal = function() {
        $scope.modal.show();
    };
    
    $scope.closeModal = function() {
        $scope.modal.hide();
    };
    
    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });
    
    // Execute action on hide modal
    $scope.$on('modal.hidden', function() {
        // Execute action
    });
    
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
        // Execute action
    });

    function getEvents(len, loc) {
        var deferred = $q.defer();
        var posOptions = {timeout: 10000, enableHighAccuracy: true};
        var helperGetEvents = function(){
            $http.post(AppSettings.url + '/getEvents',{
                lat: localStorage['lat'],
                long: localStorage['long'],
                len: len,
                eventName: $scope.search.eventName,
                distance: $scope.search.distance,
                eventTypes: $scope.search.eventTypesList,
                auth_token: window.localStorage['auth_token']
            }).then(function(response){
                if(response.data.events == ""){
                    $scope.canBeLoaded = false;
                }

                deferred.resolve(response.data.events);
            }, AppSettings.connectionError);
        };
        
        if(loc || !localStorage['lat']){
            $cordovaGeolocation.getCurrentPosition(posOptions)
            .then(function (position) {
                localStorage['lat']  = position.coords.latitude;
                localStorage['long'] = position.coords.longitude;
                helperGetEvents();
            }, function(err) {
                deferred.reject($rootScope.translate('activateGps'));
                $scope.showAlert = function() {
                    var alertPopup = $ionicPopup.alert({
                        title: $rootScope.translate('error'),
                        template: $rootScope.translate('activateGps')
                    });
                    
                    alertPopup.then(function(res) {
                            
                    });
                };

                $scope.showAlert();
                $scope.$broadcast('scroll.refreshComplete');
            });
        }
        
        else{
            helperGetEvents();
        }
        
        return deferred.promise;   
    }
    
    var promise = getEvents(0, false);
    promise.then(function(events) {
        $scope.events = $scope.events.concat(events);
    }, function(err){
        
    });

    $scope.loadMoreEvents = function(){ 
        if($scope.canBeLoaded){
            var promise = getEvents($scope.events.length, false);
            promise.then(function(events) {
                $scope.events = $scope.events.concat(events);
                $scope.$broadcast('scroll.infiniteScrollComplete');
            }, AppSettings.connectionError); 
        }
    };

    $scope.refreshEvents = function() {
        var promise = getEvents(0, true);
        promise.then(function(events) {
            $scope.events = events;
            $scope.canBeLoaded = true;
            $scope.$broadcast('scroll.refreshComplete');
        }, AppSettings.connectionError);  
    };
    
})


.controller('IntroCtrl', function($scope, $state, $ionicSlideBoxDelegate) {
 
    // Called to navigate to the main app
    $scope.startApp = function() {
        window.localStorage['introPassed'] = true;
        $state.go('login');
    };
    
    $scope.next = function() {
        $ionicSlideBoxDelegate.next();
    };
    
    $scope.previous = function() {
        $ionicSlideBoxDelegate.previous();
    };

    // Called each time the slide changes
    $scope.slideChanged = function(index) {
        $scope.slideIndex = index;
    };
})

.controller('MainCtrl', function($scope, $state) {
  $scope.toIntro = function(){
    $state.go('intro');
  }
})
    
.controller('CreateEventCtrl', function($scope, $state, $http, AppSettings, $cordovaDatePicker, $compile, createEventVars, $ionicPopup, ionicDatePicker, ionicTimePicker, $ionicModal, $ionicHistory,
                                        $rootScope){
    $scope.event = {};
    $scope.event.startDate = $rootScope.translate('date');
    $scope.eventTypes = $rootScope.translate('eventTypes');
        
    //Açılır modal kısmı    
    $ionicModal.fromTemplateUrl('googlemaps.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal = modal;
    });

    $scope.openModal = function() {
        $scope.modal.show();
        initMap();
    };

    $scope.closeModal = function() {
        $scope.modal.hide();
    };

    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });

    // Execute action on hide modal
    $scope.$on('modal.hidden', function() {
        // Execute action
    });

    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
        // Execute action
    });

    $scope.disableTap = function() {
        document.querySelector('.pac-container').setAttribute('data-tap-disabled', 'true')
    };

    $scope.step1 = function(){
        createEventVars.setEvent($scope.event);
    };

   //Map Kısmı
    function initMap() {
        var map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: parseFloat(localStorage['lat']), lng: parseFloat(localStorage['long'])},
            zoom: 13
        });
        var input = (document.getElementById('eventAddress'));

        var autocomplete = new google.maps.places.Autocomplete(input);
        autocomplete.bindTo('bounds', map);

        var infowindow = new google.maps.InfoWindow();
        var marker = new google.maps.Marker({
            map: map,
            anchorPoint: new google.maps.Point(0, -29)
        });

        autocomplete.addListener('place_changed', function() {

            infowindow.close();
            marker.setVisible(false);
            var place = autocomplete.getPlace();
            if (!place.geometry) {
                return;
            }

            // If the place has a geometry, then present it on a map.
            if (place.geometry.viewport) {
                map.fitBounds(place.geometry.viewport);
            } else {
                map.setCenter(place.geometry.location);
                map.setZoom(17);  // Why 17? Because it looks good.
            }
            
            marker.setIcon(/** @type {google.maps.Icon} */({
                url: place.icon,
                size: new google.maps.Size(71, 71),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(17, 34),
                scaledSize: new google.maps.Size(35, 35)
            }));
            
            $scope.event.longitude = place.geometry.location.lng();
            $scope.event.latitude = place.geometry.location.lat();
            
            marker.setPosition(place.geometry.location);
            marker.setVisible(true);

            marker.addListener('click', function() {
                map.setZoom(8);
                map.setCenter(marker.getPosition());
            });

            var address = '';
            if (place.address_components) {
                address = [
                    (place.address_components[0] && place.address_components[0].short_name || ''),
                    (place.address_components[1] && place.address_components[1].short_name || ''),
                    (place.address_components[2] && place.address_components[2].short_name || '')
                ].join(' ');
            }

            infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
            infowindow.open(map, marker);
            $scope.event.address = document.getElementById("eventAddress").value;
            $scope.closeModal();
            
        });
    }

    if($state.is('tab.addevent2')) {
        initMap();
        $scope.event = createEventVars.getEvent();
        $scope.event.longitude = localStorage['long'];
        $scope.event.latitude = localStorage['lat'];
    }

   //Map Kısmı sonu
    $scope.createEventButton = function(){
        $http.post(AppSettings.url + '/createEvent', {
            event: $scope.event,
            auth_token: window.localStorage['auth_token']
        }).then(function(response){
            var errors = response.data.errors;
            for(var key in errors) {
                var value = errors[key];
                $scope.showAlert = function() {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Hata',
                        template: value
                    });
                    alertPopup.then(function(res) {
                    
                    });
                };
                $scope.showAlert();
            }
            if(response.data.success){
                $scope.showAlert = function() {
                    var alertPopup = $ionicPopup.alert({
                        title: $rootScope.translate('success'),
                        template: $rootScope.translate('successCreate')
                    });

                    alertPopup.then(function(res) {
                        $ionicHistory.nextViewOptions({
                            historyRoot: true
                        });
                        $state.go('tab.events', {});
                    });
                 };

                 $scope.showAlert();

            }
        }, AppSettings.connectionError);
    }

    var options1 = {
        date: new Date(),
        mode: 'date', 
        minDate: new Date() - 10000,
        doneButtonLabel: $rootScope.translate('ok'),
        cancelButtonLabel: $rootScope.translate('cancel')
    };

    var options2 = {
        date: new Date(),
        mode: 'time', 
        doneButtonLabel: $rootScope.translate('ok'),
        cancelButtonLabel: $rootScope.translate('cancel')
    };


    if(ionic.Platform.isAndroid()) {

        $scope.showdatepicker = function() {
            $cordovaDatePicker.show(options1).then(function(date){
                $cordovaDatePicker.show(options2).then(function(time){
                    var utc = time.getTime() + (time.getTimezoneOffset() * 60000);
                    time= new Date(utc + (3600000*(+3)));
                    var hh = time.getHours().toString();
                    var mm = time.getMinutes().toString();
                    var datetime = date.getFullYear() + "-" +  (date.getMonth() + 1)  + "-" + date.getDate() + 
                    " " + (hh[1]?hh:"0"+hh[0]) + ":" + (mm[1]?mm:"0"+mm[0]);
                    $scope.event.startDate = datetime;
                });
            });
        };

    }

    //ios datepicker
    else{
        var ipObj1 = {
            callback: function (val) { 
                $scope.date = new Date(val);
                ionicTimePicker.openTimePicker(ipObj2);
            },
            mondayFirst: true,
            closeOnSelect: false,
            templateType: 'popup',
            setLabel: $rootScope.translate('ok'),
            closeLabel: $rootScope.translate('iptal'),
            weeksList: $rootScope.translate('days'),
            monthsList: $rootScope.translate('months')
        };

        var ipObj2 = {
            callback: function (val) {
                $scope.time = new Date(val * 1000);
                var utc = $scope.time.getTime() + ($scope.time.getTimezoneOffset() * 60000);
                $scope.time= new Date(utc + (3600000*0));
                var hh = $scope.time.getHours().toString();
                var mm = $scope.time.getMinutes().toString();
                var datetime = $scope.date.getFullYear() + "-" +  ($scope.date.getMonth() + 1)  + "-" + $scope.date.getDate() + 
                    " " + (hh[1]?hh:"0"+hh[0]) + ":" + (mm[1]?mm:"0"+mm[0]);
                $scope.event.startDate = datetime;
            },
            format: 24,
            step: 1,
            setLabel: $rootScope.translate('ok'),
            closeLabel: $rootScope.translate('cancel')
        };

        $scope.showdatepicker = function(){
            ionicDatePicker.openDatePicker(ipObj1);
        };
    }

})

.controller('MessageListCtrl', function($scope, $q, $http, AppSettings, $state, $ionicModal){

    $scope.notificationData = {};
    
    $scope.reply = function(userId){
        $state.go('tab.message-detail', {userId: userId});
    };
    
    $scope.canBeLoaded = true;
    $scope.messages = [];
    var messageText;
    var otheruserName;
    
    $scope.getMessages = function (len){
        return $http.post(AppSettings.url + '/getmessages',{
            len: len,
            auth_token: window.localStorage['auth_token']
        });
    };
        
    $scope.loadMoreMessages = function(){ 
        if($scope.canBeLoaded){
            $scope.getMessages($scope.messages.length).then(function(response){
                if(response.data.messages == ""){
                    $scope.canBeLoaded = false;
                }
                $scope.messages = $scope.messages.concat(response.data.messages);
                $scope.$broadcast('scroll.infiniteScrollComplete');
            }, AppSettings.connectionError);
        }
    };
    
    $scope.refreshMessages = function() {
        $scope.getMessages(0).then(function(response){
            $scope.canBeLoaded = true;
            $scope.messages = response.data.messages;
            $scope.$broadcast('scroll.refreshComplete');
        }, AppSettings.connectionError);
    };
    
    $ionicModal.fromTemplateUrl('notification.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.notificationModal = modal;
    });
    
    $scope.openNotificationModal = function() {
        $scope.notificationModal.show();
    };
    
    $scope.closeNotificationModal = function() {
        $scope.notificationModal.hide();
    };
    
    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
        $scope.notificationModal.remove();
    });
    
    // Execute action on hide modal
    $scope.$on('modal.hidden', function() {
        // Execute action
    });
    
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
        // Execute action
    });
    
     $scope.sendNotification = function() {
        $http.post(AppSettings.url + '/sendNotification',{
            title: $scope.notificationData.title,
            message: $scope.notificationData.message,
            auth_token: window.localStorage['auth_token']
        }).then(function(response){
            if(response.data.success){
                alert("Mesaj Gönderildi");
                $scope.closeNotificationModal();
            }
        }, AppSettings.connectionError);
    };
    
})

.controller('MessageCtrl',function($scope, $state, $http, $ionicScrollDelegate, AppSettings, DateCalculate, $ionicHistory){
    $scope.messageList = [];
    $scope.type = $state.params.type;

    if(ionic.Platform.isIOS()) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
        cordova.plugins.Keyboard.disableScroll(true);
    }

    function getMessages(len){
        $http.post(AppSettings.url + '/showMessage', {
            id: $state.params.id,
            type: $scope.type,
            len: len,
            auth_token: window.localStorage['auth_token']
        }).then(function(response){
            $scope.user = response.data.user;
            $scope.messageList = response.data.messageList.reverse().concat($scope.messageList);
            if(len==0){
                $ionicScrollDelegate.scrollBottom();
            }
        }, AppSettings.connectionError);
    }
    
    getMessages(0);
    
    window.addEventListener('native.keyboardshow', function(){
        $ionicScrollDelegate.scrollBottom();
    });
    
    $scope.DateCalculate = function(date) {
        return DateCalculate.DateCalculate(new Date(date));
    };
   
    $scope.loadMoreMessages = function(){ 
        getMessages($scope.messageList.length);
        $scope.$broadcast('scroll.refreshComplete');
    }

    $scope.getClassName = function(message){
        if(message.from_id != $scope.user.id) {
            return 'other';
        }
        else {
            return 'self';
        }
    };

    $scope.sendMessage = function(){

        if(!$scope.text || $scope.text == ''){
            return;
        }
        var tempText = $scope.text;
        $scope.text = '';
        $http.post(AppSettings.url + '/send_message', {
            id: $state.params.id,
            type: $scope.type,
            auth_token: window.localStorage['auth_token'],
            text: tempText
        }).then(function(response){
            $scope.messageList =  $scope.messageList.concat([response.data.message]);
            $ionicScrollDelegate.scrollBottom();
        }, AppSettings.connectionError);
    };
    
    $scope.$on('newMessage', function(event, params) {
        $scope.messageList =  $scope.messageList.concat([params.message]);
        $scope.$apply();
        $ionicScrollDelegate.scrollBottom();
    });
})


.controller('EventCtrl', function($scope, $state, $http, $ionicPopup, AppSettings, $rootScope){

    $scope.event_id = $state.params.id;
    
    $scope.eventTypes = $rootScope.translate('eventTypes');
    
    $scope.eventInfo = function() {
        $http.post(AppSettings.url + '/showEvent', {
            id: $scope.event_id,
            auth_token: window.localStorage['auth_token']
        }).then(function(response){
            $scope.event_user = response.data.user;
            $scope.event = response.data.event;
            $scope.joinUsers = response.data.joinUsers;
            $scope.joinStatus = response.data.joinStatus;
        }, AppSettings.connectionError);  
    };
    
    $scope.eventInfo();
    
    $scope.refresh = function() {
        $scope.eventInfo();
        $scope.$broadcast('scroll.refreshComplete');
    };
    
    $scope.deleteEvent = function() {
        var confirmPopup = $ionicPopup.confirm({
            title: $rootScope.translate('needPermission'),
            template: $rootScope.translate('activityCancel'),
            cancelText: $rootScope.translate('no'),
            okText: $rootScope.translate('yes')
        });

        confirmPopup.then(function(res) {
            if(res) {
                $http.post(AppSettings.url + '/deleteEvent', {
                    id: $scope.event_id,
                    auth_token: window.localStorage['auth_token']
                }).then(function(response){
                    if(response.data.success){
                        var alertPopup = $ionicPopup.alert({
                            title: $rootScope.translate('success'),
                            template: $rootScope.translate('activityCanceled')
                       });

                       alertPopup.then(function(res) {
                            $state.go('tab.events')
                       });
                    }
                }, AppSettings.connectionError);  
            }
        });
    };
    
    $scope.joinEvent = function(){
        $http.post(AppSettings.url + '/joinEvent', {
            event_id: $scope.event_id,
            auth_token: window.localStorage['auth_token']
        }).then(function(response){
            if(response.data.success){
                $scope.joinStatus = 2;
            }
        }, AppSettings.connectionError);
    };
    
    $scope.withdrawRequest = function() {
         $http.post(AppSettings.url + '/withdrawRequest', {
            event_id: $scope.event_id,
            auth_token: window.localStorage['auth_token']
        }).then(function(response){
            if(response.data.success){
                $scope.joinStatus = 1;
            }
        }, AppSettings.connectionError);
    };
})

.controller('UserCtrl', function($scope, $state, DateCalculate, $http,AppSettings, $ionicModal, $ionicLoading,$ionicPopup, $timeout, $cordovaCamera, $jrCrop, $rootScope){

    $scope.formData = {};
    $scope.userId = $state.params.userId;
    
    $scope.userInfo = function() {
        $http.post(AppSettings.url + '/getUserInfo',{
            user_id: $scope.userId,
            auth_token: window.localStorage['auth_token']
        }).then(function(response){
            $scope.user = response.data.user;
            $scope.eventsofuser = response.data.events;
            $scope.references = response.data.references;
            $scope.follows = response.data.follows;
            $scope.image = response.data.image;
            $scope.cover = response.data.cover;
            $scope.followStatus = response.data.followStatus;
            $scope.referenced = response.data.referenced;
        }, AppSettings.connectionError);  
    };
    
    $scope.userInfo();
    
    $scope.refresh = function() {
        $scope.userInfo();
        $scope.$broadcast('scroll.refreshComplete');
    };
    
    $scope.followUser = function() {
        $http.post(AppSettings.url + '/followUser',{
            user_id: $scope.userId,
            auth_token: window.localStorage['auth_token']
        }).then(function(response){
            if(response.data.success){
                $scope.followStatus = 2;
            }
        }, AppSettings.connectionError);
    };

    $scope.cancelRequest = function() {
        $http.post(AppSettings.url + '/cancelRequest',{
            user_id: $scope.userId,
            auth_token: window.localStorage['auth_token']
        }).then(function(response){
            if(response.data.success){
                $scope.followStatus = 1;
            }
        }, AppSettings.connectionError);
    };
    
    $scope.deleteFollow = function() {
        $http.post(AppSettings.url + '/deleteFollow',{
            user_id: $scope.userId,
            auth_token: window.localStorage['auth_token']
        }).then(function(response){
            if(response.data.success){
                $scope.followStatus = 1;
            }
        }, AppSettings.connectionError);
    };
    
    $scope.sendMessage = function() {
        $state.go('tab.message-detail', {id: $scope.userId, type: 'User'});
    };

    $scope.DateCalculate = function(date) {
        return DateCalculate.DateCalculate(new Date(date));
    };
    
    $scope.updateProfile = function() {
        $http.post(AppSettings.url + '/updateUser',{
            user: $scope.user,
            auth_token: window.localStorage['auth_token']
        }).then(function(response){
            $scope.modal2.hide();
        }, AppSettings.connectionError);
    };

    $scope.takePicture = function () {
        var options = {
            destinationType: Camera.DestinationType.DATA_URL,
            correctOrientation: true,
            encodingType: Camera.EncodingType.JPEG
        };
            
        $cordovaCamera.getPicture(options).then(function(data){
            $scope.pictureUrl = 'data:image/jpeg;base64,' + data;
            $scope.myPopup.close();
            $scope.cropImage();
        }, function(error) {
            console.log(angular.toJson(error));
        });
    };

     $scope.fromGallery = function () {
        var options = {
            destinationType: Camera.DestinationType.DATA_URL,
            correctOrientation: true,
            encodingType: Camera.EncodingType.JPEG,
            sourceType: Camera.PictureSourceType.PHOTOLIBRARY
        };
            
        $cordovaCamera.getPicture(options).then(function(data){
            $scope.pictureUrl = 'data:image/jpeg;base64,' + data;
            $scope.myPopup.close();
            $scope.cropImage();
        }, function(error) {
            console.log(angular.toJson(error));
        });
    };
    
    $scope.cropImage = function() {
        if($scope.image_type == 'profile'){
            var width = 400;
            var height = 400;
        }
        else if($scope.image_type == 'cover'){
            var width = 851;
            var height = 315;
        }
        $jrCrop.crop({
            url: $scope.pictureUrl,
            width: width,
            height: height
        }).then(function(canvas) {
            $scope.pictureUrl = canvas.toDataURL();
            $scope.openModal3();
        }, function() {
            // User canceled or couldn't load image.
        });  
    };
    
    $scope.uploadPicture = function() {
        
        $ionicLoading.show({
          template: 'Loading...'
        });
        
        if($scope.image_type == 'profile'){
            $http.post(AppSettings.url + '/updateProfilePicture',{
                image: $scope.pictureUrl,
                auth_token: window.localStorage['auth_token']
            }).then(function(response){
                $scope.modal3.hide();
                $scope.modal2.hide();
                $ionicLoading.hide();
                $scope.refresh();
            }, AppSettings.connectionError);
        }
        
        else if($scope.image_type == 'cover'){
            $http.post(AppSettings.url + '/updateCoverPicture',{
                image: $scope.pictureUrl,
                auth_token: window.localStorage['auth_token']
            }).then(function(response){
                $scope.modal3.hide();
                $scope.modal2.hide();
                $ionicLoading.hide();
                $scope.refresh();
            }, AppSettings.connectionError);
        }
        
    };

    // An elaborate, custom popup
    $scope.openPopup = function(image_type){
        $scope.image_type = image_type;
        $scope.myPopup = $ionicPopup.show({
            template: '<button ng-click="takePicture()" class="button button-block button-positive">' + $rootScope.translate('useCamera') + '</button><button ng-click="fromGallery()" class="button button-block button-positive">' + $rootScope.translate('gotoGallery') + '</button>',
            title: $rootScope.translate('chooseMethod'),
            subTitle: $rootScope.translate('chooseMethodText'),
            scope: $scope,
            buttons: [
                { text: $rootScope.translate('cancel') }
            ]
        });
    };     
    
    //Açılır modal kısmı    
    $ionicModal.fromTemplateUrl('my-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal = modal;
    });
    
    $scope.openModal = function() {
        $scope.modal.show();
    };
    
    $scope.closeModal = function() {
        $scope.modal.hide();
    };
    
    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });
    
    // Execute action on hide modal
    $scope.$on('modal.hidden', function() {
        // Execute action
    });
    
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
        // Execute action
    });

    //Açılır modal kısmı    
    $ionicModal.fromTemplateUrl('editprofile.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal2 = modal;
    });
    
    $scope.openModal2 = function() {
        $scope.modal2.show();
    };
    
    $scope.closeModal2 = function() {
        $scope.modal2.hide();
    };
    
    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
        $scope.modal2.remove();
    });
    
    // Execute action on hide modal
    $scope.$on('modal.hidden', function() {
        // Execute action
    });
    
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
        // Execute action
    });

    //Açılır modal kısmı    
    $ionicModal.fromTemplateUrl('uploadprofilepicture.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal3 = modal;
    });
    
    $scope.openModal3 = function() {
        $scope.modal3.show();
    };
    
    $scope.closeModal3 = function() {
        $scope.modal3.hide();
    };
    
    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
        $scope.modal3.remove();
    });
    
    // Execute action on hide modal
    $scope.$on('modal.hidden', function() {
        // Execute action
    });
    
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
        // Execute action
    });

    //Açılır modal kısmı    
    $ionicModal.fromTemplateUrl('reportuser.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal5 = modal;
    });
    
    $scope.openModal5 = function() {
        $scope.modal5.show();
    };
    
    $scope.closeModal5 = function() {
        $scope.modal5.hide();
    };
    
    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
        $scope.modal5.remove();
    });
    
    // Execute action on hide modal
    $scope.$on('modal.hidden', function() {
        // Execute action
    });
    
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
        // Execute action
    });

    $scope.be_reference = function() {
        $http.post(AppSettings.url + '/beReference',{
            text: $scope.formData.text,
            user_id: $scope.userId,
            auth_token: window.localStorage['auth_token']
        }).then(function(response){
            if(response.data.success){
         

                $scope.showAlert = function() {
                   var alertPopup = $ionicPopup.alert({
                     title: $rootScope.translate('success'),
                     template: $rootScope.translate('referenceAdded')
                   });

                   alertPopup.then(function(res) {
                    
                   });
                 };

                 $scope.showAlert();

                $scope.referenced = true;
                $scope.modal.hide();
            }
        }, AppSettings.connectionError);
    };  
})

.controller('SettingsCtrl', function($scope, $rootScope, $state, $http, AppSettings, $ionicPopup, $ionicModal ){
    
    $scope.settings = {};
    $scope.logout = function(){
    window.localStorage['introPassed'] = 'true';
        $http.post(AppSettings.url + '/logout',{
            auth_token: window.localStorage['auth_token']
        }).then(function(response){
            var pushToken = localStorage['pushToken'];
            localStorage.clear();
            localStorage['pushToken'] = pushToken;
            $state.go('login');
        }, AppSettings.connectionError);
    };

    $scope.aboutUs = function() {
        var alertPopup = $ionicPopup.alert({
            title: $rootScope.translate('whoWeAre'),
            template: '<p>' + $rootScope.translate('whoWeAre') + '</p><br><p>&copy; 2016 Activityo Team </p><p>' + $rootScope.translate('contact') + ': <a href="mailto:iletisim@activityo.com">iletisim@activityo.com</a></p>'
        });

        alertPopup.then(function(res) {
           
        });
    };
    
    $scope.contact = function() {
        var alertPopup = $ionicPopup.alert({
            title: 'İletişime Geçin',
            template: '<p>E-posta: <a href="mailto:iletisim@activityo.com">iletisim@activityo.com</a></p>'
        });

        alertPopup.then(function(res) {
           
        });
    };

    $scope.help = function() {
        var alertPopup = $ionicPopup.alert({
            title: 'Yardıma mı ihtiyacınız var?',
            template: '<p>Şimdilik sadece e-posta aracılığıyla yardım edebiliyoruz. Size en kısa sürede döneceğimizden şüpheniz olmasın.</p><p>E-posta: <a href="mailto:iletisim@activityo.com">iletisim@activityo.com</a></p>'
        });
        
        alertPopup.then(function(res) {
            
        });
    };

      //Açılır modal kısmı    
    $ionicModal.fromTemplateUrl('choosecolor.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal = modal;
    });
    
    $scope.openModal = function() {
        $scope.modal.show();
    };
    
    $scope.closeModal = function() {
        $scope.modal.hide();
    };
    
    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });
    
    // Execute action on hide modal
    $scope.$on('modal.hidden', function() {
        // Execute action
    });
    
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
        // Execute action
    });


    $scope.makered = function() {

             $rootScope.myColor = '#ff704d';
            window.localStorage['myColor'] = '#ff704d';
            $scope.closeModal();

    }

    $scope.makeyellow = function() {

         $rootScope.myColor = '#cccc00';
         window.localStorage['myColor'] = '#cccc00';
          $scope.closeModal();

    }

    $scope.makegreen = function() {

             $rootScope.myColor = '#00cc66';
            window.localStorage['myColor'] = '#00cc66';
             $scope.closeModal();

    }

    $scope.makedarkblue = function() {

             $rootScope.myColor = '#0066ff';
            window.localStorage['myColor'] = '#0066ff';
             $scope.closeModal();

    }

    $scope.makedefault = function() {

            $rootScope.myColor = '#46C7F3';
            window.localStorage['myColor'] = '#46C7F3';
             $scope.closeModal();

    }

    $scope.makeorange = function() {

            $rootScope.myColor = '#ffc266';
            window.localStorage['myColor'] = '#ffc266';
             $scope.closeModal();

    }





})

.controller('BaseCtrl',function($scope, $ionicSideMenuDelegate, $state, $ionicModal, $http, AppSettings){

    $scope.formData = {};
    $scope.formData.users = [];
    
    $scope.url = AppSettings.url;
    
    $scope.gotoprofile = function(){
        $state.go('tab.account', {userId: $scope.me.id});
    };

    $scope.gotomyevents = function(){
        $state.go('tab.userevents', {userId: $scope.me.id});
    };

    $scope.gotosettings = function(){
        $state.go('tab.settings');
    };

    $scope.findUser = function(){
        $http.post(AppSettings.url + '/finduser',{
            name: $scope.formData.text,
            auth_token: window.localStorage['auth_token']
        }).then(function(response){
            $scope.formData.users = response.data.users;
        }, AppSettings.connectionError);
    };
    
    $scope.sendMessage = function(user_id) {
        $state.go('tab.message-detail', {id: user_id, type:'User'});
        $scope.modal.hide();
    };
    
    $scope.goProfile = function(userId){
        $state.go('tab.account', {userId: userId});
        $scope.modal.hide();
        $scope.modal2.hide();
        $scope.modal3.hide();
    }

     //Açılır modal kısmı
    $ionicModal.fromTemplateUrl('finduser.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal = modal;
    });
    
    $scope.openModal = function() {
        $scope.modal.show();
    };
    
    $scope.closeModal = function() {
        $scope.modal.hide();
    };
    
    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });
    
    // Execute action on hide modal
    $scope.$on('modal.hidden', function() {
        // Execute action
    });
    
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
        // Execute action
    });

    //Açılır modal kısmı
    $ionicModal.fromTemplateUrl('acceptuser.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal2 = modal;
    });
    
    $scope.openModal2 = function() {
        $scope.eventRequestUsers();
        $scope.modal2.show();
    };
    
    $scope.eventRequestUsers = function() {
        $http.post(AppSettings.url + '/eventRequestUsers',{
            auth_token: window.localStorage['auth_token']
        }).then(function(response){
            $scope.formData.eventRequestUsers = response.data.eventRequestUsers;
            $scope.eventRequestCount = $scope.formData.eventRequestUsers.length;
        }, AppSettings.connectionError);
    };
    
    $scope.eventRequestUsers();
    
    $scope.acceptEventRequest = function(user_id, event_id, index) {
        $http.post(AppSettings.url + '/acceptEventRequest',{
            user_id: user_id,
            event_id: event_id,
            auth_token: window.localStorage['auth_token']
        }).then(function(response){
            if(response.data.success){
                $scope.formData.eventRequestUsers =  AppSettings.removeByAttr($scope.formData.eventRequestUsers, 'index', index);
                $scope.eventRequestCount = $scope.formData.eventRequestUsers.length;
            }
        }, AppSettings.connectionError);
    };
    
    $scope.rejectEventRequest = function(user_id, event_id, index) {
        $http.post(AppSettings.url + '/rejectEventRequest',{
            user_id: user_id,
            event_id: event_id,
            auth_token: window.localStorage['auth_token']
        }).then(function(response){
            if(response.data.success){
                $scope.formData.eventRequestUsers =  AppSettings.removeByAttr($scope.formData.eventRequestUsers, 'index', index);
                $scope.eventRequestCount = $scope.formData.eventRequestUsers.length;
            }
        }, AppSettings.connectionError);
    };
    
    $scope.$on('newEventRequest', function(event, params) {
        $scope.eventRequestUsers();
    });
    
    $scope.$on('openEventRequest', function(event, params) {
        $scope.openModal2();
    });
    
    $scope.closeModal2 = function() {
        $scope.modal2.hide();
    };
    
    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
        $scope.modal2.remove();
    });
    
    // Execute action on hide modal
    $scope.$on('modal.hidden', function() {
        // Execute action
    });
    
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
        // Execute action
    });
    
    //Açılır modal kısmı
    $ionicModal.fromTemplateUrl('followrequests.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal3 = modal;
    });
    
    $scope.openModal3 = function() {
         $scope.followRequestUsers();
        $scope.modal3.show();
    };
    
    $scope.followRequestUsers = function() {
        $http.post(AppSettings.url + '/followRequestUsers',{
            auth_token: window.localStorage['auth_token']
        }).then(function(response){
            $scope.formData.followRequestUsers = response.data.followRequestUsers;
            $scope.followRequestCount = $scope.formData.followRequestUsers.length;
        }, AppSettings.connectionError);  
    };
    
    $scope.followRequestUsers();
    
    $scope.acceptFollowRequest = function(user_id) {
        $http.post(AppSettings.url + '/acceptRequest',{
            user_id: user_id,
            auth_token: window.localStorage['auth_token']
        }).then(function(response){
            if(response.data.success){
                $scope.formData.followRequestUsers =  AppSettings.removeByAttr($scope.formData.followRequestUsers, 'id', user_id);
                $scope.followRequestCount = $scope.formData.followRequestUsers.length;
            }
        }, AppSettings.connectionError);
    };
    
    $scope.rejectFollowRequest = function(user_id) {
        $http.post(AppSettings.url + '/deleteRequest',{
            user_id: user_id,
            auth_token: window.localStorage['auth_token']
        }).then(function(response){
            if(response.data.success){
                $scope.formData.followRequestUsers =  AppSettings.removeByAttr($scope.formData.followRequestUsers, 'id', user_id);
                $scope.followRequestCount = $scope.formData.followRequestUsers.length;
            }
        }, AppSettings.connectionError);
    };
    
    $scope.$on('newFollowRequest', function(event, params) {
        $scope.followRequestUsers();
    });
    
    $scope.$on('openFollowRequest', function(event, params) {
        $scope.openModal3();
    });
    
    $scope.closeModal3 = function() {
        $scope.modal3.hide();
    };
    
    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
        $scope.modal3.remove();
    });
    
    // Execute action on hide modal
    $scope.$on('modal.hidden', function() {
        // Execute action
    });
    
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
        // Execute action
    });
})

.directive('hideTabs', function($rootScope) {
  return {
      restrict: 'A',
      link: function($scope, $el) {
          $rootScope.hideTabs = 'tabs-item-hide';
          $scope.$on('$destroy', function() {
              $rootScope.hideTabs = '';
          });
      }
  };
})

.controller('UserEventsCtrl', function($scope, $state, $http, AppSettings, DateCalculate) {
    $scope.userId = $state.params.userId;
    $scope.getUserEvents = function() {
        $http.post(AppSettings.url + '/getUserEvents',{
            user_id: $scope.userId,
            auth_token: window.localStorage['auth_token']
        }).then(function(response){
            $scope.events = response.data.events;
            $scope.user = response.data.user;
        }, AppSettings.connectionError);  
    };
    
    $scope.DateCalculate = function(date) {
        return DateCalculate.DateCalculate(new Date(date));
    };
    
    $scope.getUserEvents();
})

.controller('MainCtrl',function($scope, $state, $http, AppSettings, $ionicHistory, $ionicPopup, $ionicConfig, $ionicTabsDelegate, $ionicSideMenuDelegate, $ionicScrollDelegate, $rootScope){
    $scope.newObject = {};
    /*var deploy = new Ionic.Deploy();
    // Check Ionic Deploy for new code
     $scope.checkForUpdates = function() {
        console.log('Ionic Deploy: Checking for updates');
        deploy.check().then(function(hasUpdate) {
            console.log('Ionic Deploy: Update available: ' + hasUpdate); 
            if(hasUpdate) {
                $ionicPopup.alert({
                    title: 'Updating',
                    template: 'We are updating your application. Please don\'t  close it!!'
                });
                $scope.doUpdate();
            }
        }, function(err) {
          console.error('Ionic Deploy: Unable to check for updates', err);
        });
    };

    // Update app code with new release from Ionic Deploy
    $scope.doUpdate = function() {
        deploy.update().then(function(res) {
            console.log('Ionic Deploy: Update Success! ', res);
        }, function(err) {
          console.log('Ionic Deploy: Update error! ', err);
        }, function(prog) {
          console.log('Ionic Deploy: Progress... ', prog);
        });
    };

    //$scope.checkForUpdates(); */

    

   //    $cordovaProgress.showBarWithLabel(false, 100000, "Application is updating to the latest version");

    $scope.getBasicInfo = function() {
        $http.post(AppSettings.url + '/getBasicInfo',{
            auth_token: window.localStorage['auth_token']
        }).then(function(response){
            $scope.me = response.data.user;
            $scope.myImage = response.data.image;
            $scope.androidVersion = response.data.androidVersion;
            $scope.iosVersion = response.data.iosVersion;
            
            if(ionic.Platform.isAndroid() && AppSettings.version < $scope.androidVersion){
                var confirmPopup = $ionicPopup.confirm({
                    title: 'Yeni Sürüm',
                    template: "Aktivityo'nun yeni sürümü mevcut. Güncellemek istiyor musun?" ,
                    cancelText: 'Hayır',
                    okText: 'Evet'
                });

                confirmPopup.then(function(res) {
                    if(res) {
                        window.location = AppSettings.googlePlay; 
                    }
                });   
            }
            
            else if(ionic.Platform.isIOS() && AppSettings.version < $scope.iosVersion){
                var confirmPopup = $ionicPopup.confirm({
                    title: 'Yeni Sürüm',
                    template: "Aktivityo'nun yeni sürümü mevcut. Güncellemek istiyor musun?" ,
                    cancelText: 'Hayır',
                    okText: 'Evet'
                });

                confirmPopup.then(function(res) {
                    if(res) {
                        window.location = AppSettings.appStore; 
                    }
                });   
            }
        }, AppSettings.connectionError);  
    };
    
    $scope.$on('loggedIn', function(event, params) {
        $scope.getBasicInfo();
    });
       
    $ionicConfig.backButton.text($rootScope.translate('back'));

    this.onTabSelected = function(_scope, user_id){
        
        if ( _scope.title === 'events') {
            
            if($state.current.views['tab-events']){
                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });
                $state.go('tab.events', {});
            }
            else
                $ionicTabsDelegate.select(0);  
        }

        else if ( _scope.title === 'account') {
            
            $ionicTabsDelegate.select(1);
            if($state.current.views['tab-account']){
                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });
            }
            $state.go('tab.account', {userId: user_id});
               
        }

        else if ( _scope.title === 'messages') {
            
            $ionicTabsDelegate.select(2);
            if($state.current.views['tab-messages']){
                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });
            }
            $state.go('tab.messages', {});
            
        }

        else if ( _scope.title === 'settings') {
            
            $ionicTabsDelegate.select(3);
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            
            $state.go('tab.settings', {});
        }
    };
    
    this.onTabDeselected = function(){
        $ionicHistory.clearCache();
    };
    
    $scope.$watch(function () {
        return $ionicSideMenuDelegate.getOpenRatio();
    }, function(ratio){
        if (ratio == 1){
            $ionicScrollDelegate.$getByHandle('side-menu').scrollTop();
        }
    });
  

});