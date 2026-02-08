'use strict';

var utils = require('axios/lib/utils');
var settle = require('axios/lib/core/settle');
var buildURL = require('axios/lib/helpers/buildURL');
var createError = require('axios/lib/core/createError');

module.exports = function fetchAdapter(config) {
  return new Promise(function dispatchFetchRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;

    if (utils.isFormData(requestData)) {
      delete requestHeaders['Content-Type'];
    }

    var fullUrl = buildURL(config.url, config.params, config.paramsSerializer);

    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password || '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    // Build fetch options
    var fetchOptions = {
      method: config.method.toUpperCase(),
      headers: {},
    };

    // Set headers
    utils.forEach(requestHeaders, function setRequestHeader(val, key) {
      if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
        return;
      }
      fetchOptions.headers[key] = val;
    });

    // Set body
    if (requestData !== undefined && requestData !== null) {
      fetchOptions.body = requestData;
    }

    // Handle timeout with AbortController
    var abortController = new AbortController();
    fetchOptions.signal = abortController.signal;

    var timeoutId;
    if (config.timeout) {
      timeoutId = setTimeout(function () {
        abortController.abort();
        reject(createError(
          'timeout of ' + config.timeout + 'ms exceeded',
          config,
          'ECONNABORTED'
        ));
      }, config.timeout);
    }

    // Handle cancelToken
    if (config.cancelToken) {
      config.cancelToken.promise.then(function onCanceled(cancel) {
        abortController.abort();
        reject(cancel);
      });
    }

    fetch(fullUrl, fetchOptions)
      .then(function handleResponse(res) {
        if (timeoutId) clearTimeout(timeoutId);

        // Parse response headers
        var responseHeaders = {};
        res.headers.forEach(function (value, key) {
          responseHeaders[key] = value;
        });

        return res.text().then(function (data) {
          // Try to parse JSON if responseType is json
          if (config.responseType === 'json' || !config.responseType) {
            try {
              data = JSON.parse(data);
            } catch (e) {
              // not JSON, keep as text
            }
          }

          var response = {
            data: data,
            status: res.status,
            statusText: res.statusText,
            headers: responseHeaders,
            config: config,
            request: null,
          };

          settle(resolve, reject, response);
        });
      })
      .catch(function handleError(err) {
        if (timeoutId) clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          return; // already handled by timeout/cancel
        }
        reject(createError('Network Error', config, null, null));
      });
  });
};
