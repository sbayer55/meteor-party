var Parties = new Mongo.Collection("parties");

Parties.allow({
    insert: function (userId, party) {
        return userId && party.owner === userId;
    },
    update: function (userId, party, fields, modifier) {
        return userId && party.owner === userId;
    },
    remove: function (userId, party) {
        return userId && party.owner === userId;
    }
});

// Client side code:
if (Meteor.isClient) {
    app = angular.module('comet', ['angular-meteor', 'ui.router']);

    app.config(['$urlRouterProvider', '$stateProvider', '$locationProvider',
        function($urlRouterProvider, $stateProvider, $locationProvider){

            $locationProvider.html5Mode(true);

            $stateProvider
                .state('parties', {
                    url: '/parties',
                    templateUrl: 'parties-list.ng.html',
                    controller: 'chatController'
                })
                .state('partyDetails', {
                    url: '/parties/:partyId',
                    templateUrl: 'party-details.ng.html',
                    controller: 'PartyDetailsCtrl',
                    resolve: {
                        "currentUser": ["$meteor", function($meteor){
                            return $meteor.requireUser();
                        }]
                    }
                });

            $urlRouterProvider.otherwise("/parties");
        }]);

    app.run(["$rootScope", "$location", function($rootScope, $state) {
        $rootScope.$on("$stateChangeError", function(event, next, previous, error) {
            // We can catch the error thrown when the $requireUser promise is rejected
            // and redirect the user back to the main page
            if (error === "AUTH_REQUIRED") {
                $state.go("/parties");
            }
        });
    }]);

    app.controller('chatController', ['$scope', '$meteor', function($scope, $meteor) {
        $scope.parties = $meteor.collection(Parties);

        $scope.remove = function(party) {
            $scope.parties.remove(party);
        }
        $scope.removeAll = function(){
            $scope.parties.remove();
        };
    }]);

    app.controller("PartyDetailsCtrl", ['$scope', '$stateParams', '$meteor',
        function($scope, $stateParams, $meteor){
            $scope.party = $meteor.object(Parties, $stateParams.partyId, false);

            $scope.save = function() {
                $scope.party.save().then(function(numberOfDocs){
                    console.log('save success doc affected ', numberOfDocs);
                }, function(error){
                    console.log('save error', error);
                });
            };

            $scope.reset = function() {
                $scope.party.reset();
            };
        }]);
}

// Server side code:
if (Meteor.isServer) {
    Meteor.startup(function () {
        if (Parties.find().count() === 0) {
            var parties = [
                {'name': 'Dubstep-Free Zone',
                    'description': 'Fast just got faster with Nexus S.'},
                {'name': 'All dubstep all the time',
                    'description': 'Get it on!'},
                {'name': 'Savage lounging',
                    'description': 'Leisure suit required. And only fiercest manners.'}
            ];
            for (var i = 0; i < parties.length; i++)
                Parties.insert(parties[i]);
            console.log("Injected parties into the database!");
        }
        else {
            console.log("There are parties already?");
        }
    });
}
