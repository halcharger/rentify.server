﻿(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('authService', AuthService);

    AuthService.$inject = ['$q', '$injector', '$location', 'localStorageService', 'environment'];

    function AuthService($q, $injector, $location, localStorageService, environment) {

        var serviceBase = environment.serverBaseUri;
        var clientId = environment.clientId;
        var $http;
        var authServiceFactory = {};

        var _authentication = {
            isAuth: false,
            userName: '',
            useRefreshTokens: false
        };

        var _externalAuthData = {
            provider: '',
            userName: '',
            email: '',
            externalAccessToken: ''
        };

        var _saveRegistration = function (registration) {

            _logOut();

            $http = $http || $injector.get('$http');
            return $http.post(serviceBase + 'api/account/register', registration).then(function (response) {
                return response;
            });

        };

        var _redirectToLoginIfNotAuthenticated = function () {
            if (!_authentication.isAuth) {
                $location.path('login');
            }
        };

        var _login = function (loginData) {

            var data = 'grant_type=password&username=' + loginData.userName + '&password=' + loginData.password;

            if (loginData.useRefreshTokens) {
                data = data + '&client_id=' + clientId;
            }

            $http = $http || $injector.get('$http');
            console.log('about to post to:' + serviceBase + 'token');
            return $http.post(serviceBase + 'token',
                                data,
                                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
              .success(function (response) {

                  if (loginData.useRefreshTokens) {
                      localStorageService.set('authorizationData', {
                          token: response.access_token,// jshint ignore:line
                          userName: loginData.userName,
                          refreshToken: response.refresh_token,// jshint ignore:line
                          useRefreshTokens: true
                      });
                  }
                  else {
                      localStorageService.set('authorizationData', {
                          token: response.access_token,// jshint ignore:line
                          userName: loginData.userName,
                          refreshToken: '',
                          useRefreshTokens: false
                      });
                  }

                  _authentication.isAuth = true;
                  _authentication.userName = loginData.userName;
                  _authentication.useRefreshTokens = loginData.useRefreshTokens;

              })
              .error(function () {
                  _logOut();
              });

        };

        var _logOut = function () {

            localStorageService.remove('authorizationData');

            _authentication.isAuth = false;
            _authentication.userName = '';
            _authentication.useRefreshTokens = false;

        };

        var _fillAuthData = function () {

            var authData = localStorageService.get('authorizationData');
            if (authData) {
                _authentication.isAuth = true;
                _authentication.userName = authData.userName;
                _authentication.useRefreshTokens = authData.useRefreshTokens;
            }

        };

        var _refreshToken = function () {
            console.log('refreshing token...');
            var deferred = $q.defer();

            var authData = localStorageService.get('authorizationData');

            if (authData && authData.useRefreshTokens) {

                var data = 'grant_type=refresh_token&refresh_token=' +
                            authData.refreshToken +
                            '&client_id=' +
                            clientId;

                localStorageService.remove('authorizationData');

                $http = $http || $injector.get('$http');
                $http.post(serviceBase + 'token',
                    data,
                    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
                    .success(function (response) {
                        localStorageService.set('authorizationData', {
                            token: response.access_token,// jshint ignore:line
                            userName: response.userName,
                            refreshToken: response.refresh_token,// jshint ignore:line
                            useRefreshTokens: true
                        });

                        deferred.resolve(response);

                    }).error(function (error) {
                        deferred.reject();
                    });

            } else {
                deferred.reject();
            }

            return deferred.promise;

        };

        var _obtainAccessToken = function (externalData) {

            $http = $http || $injector.get('$http');
            return $http.get(serviceBase + 'api/account/ObtainLocalAccessToken', {
                params: {
                    provider: externalData.provider,
                    externalAccessToken: externalData.externalAccessToken
                }
            })
              .success(function (response) {

                  localStorageService.set('authorizationData', {
                      token: response.access_token,// jshint ignore:line
                      userName: response.userName,
                      refreshToken: '',
                      useRefreshTokens: false
                  });

                  _authentication.isAuth = true;
                  _authentication.userName = response.userName;
                  _authentication.useRefreshTokens = false;

              }).error(function (err, status) {
                  _logOut();
              });

        };

        var _registerExternal = function (registerExternalData) {

            $http = $http || $injector.get('$http');
            return $http.post(serviceBase + 'api/account/registerexternal', registerExternalData)
              .success(function (response) {

                  localStorageService.set('authorizationData', {
                      token: response.access_token,// jshint ignore:line
                      userName: response.userName,
                      refreshToken: '',
                      useRefreshTokens: false
                  });

                  _authentication.isAuth = true;
                  _authentication.userName = response.userName;
                  _authentication.useRefreshTokens = false;

              }).error(function () {
                  _logOut();
              });

        };

        authServiceFactory.saveRegistration = _saveRegistration;
        authServiceFactory.login = _login;
        authServiceFactory.logOut = _logOut;
        authServiceFactory.fillAuthData = _fillAuthData;
        authServiceFactory.authentication = _authentication;
        authServiceFactory.refreshToken = _refreshToken;

        authServiceFactory.obtainAccessToken = _obtainAccessToken;
        authServiceFactory.externalAuthData = _externalAuthData;
        authServiceFactory.registerExternal = _registerExternal;
        authServiceFactory.redirectToLoginIfNotAuthenticated = _redirectToLoginIfNotAuthenticated;

        return authServiceFactory;
    }
})();
