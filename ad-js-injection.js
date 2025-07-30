(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.supportLoadEventForAndroid = exports.muteAllSound = void 0;

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _construct(Parent, args, Class) { if (_isNativeReflectConstruct()) { _construct = Reflect.construct.bind(); } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var supportLoadEventForAndroid = function supportLoadEventForAndroid(iframeWindow) {
  if (iframeWindow.navigator.userAgent.match(/Android/i)) {
    var originAddEventListener = iframeWindow.addEventListener;

    iframeWindow.addEventListener = function (eventName, callback, useCapture) {
      originAddEventListener.call(iframeWindow, eventName === 'load' ? 'DOMContentLoaded' : eventName, callback, useCapture);
    }; // support onload


    var onloadEventCallback = null;
    Object.defineProperty(iframeWindow, 'onload', {
      set: function set(v) {
        onloadEventCallback = v;
        iframeWindow.addEventListener('DOMContentLoaded', onloadEventCallback);
      },
      get: function get() {
        return onloadEventCallback;
      }
    });
  }
};

exports.supportLoadEventForAndroid = supportLoadEventForAndroid;
supportLoadEventForAndroid(window);

var muteAllSound = function muteAllSound() {
  // https://vungle.atlassian.net/browse/CP-2203
  // begin: mute playable page sound
  var SOUND_TYPES = {
    'WEB_AUDIO': 'WEB_AUDIO',
    'AUDIO': 'AUDIO',
    'VIDEO': 'VIDEO'
  }; // declare the dom elements that need to be muted

  var htmlElementsNeedMuted = ['audio', 'video']; // backup origin window.AudioContext function, so we can call it in Object.defineProperty

  var originAudioContext = window.AudioContext; // backup origin document.createElement function, so we can call it in Object.defineProperty

  var originCreateElement = document.createElement;

  var muteSound = function muteSound(elementInstance, elementType) {
    var preventWebAudioResume = function preventWebAudioResume() {
      Object.defineProperty(elementInstance, 'resume', {
        value: function value() {
          return Promise.resolve();
        },
        configurable: true
      });
    };

    var preventAudioAndVideoResume = function preventAudioAndVideoResume() {
      var originValue = elementInstance.muted;
      Object.defineProperty(elementInstance, 'muted', {
        set: function set() {},
        get: function get() {
          return originValue;
        },
        configurable: true
      });
    };

    var handleWebAudioStateChange = function handleWebAudioStateChange(ev) {
      if (ev.target.state === 'running') {
        elementInstance.suspend();
      }
    };

    var doMute = function doMute() {
      switch (elementType) {
        case SOUND_TYPES.WEB_AUDIO:
          preventWebAudioResume();
          elementInstance.suspend();
          break;

        case SOUND_TYPES.AUDIO:
        case SOUND_TYPES.VIDEO:
          elementInstance.muted = true;
          preventAudioAndVideoResume();
          break;

        default:
          console.error("unsupported elementType ".concat(elementType));
      }
    };

    var readyMute = function readyMute() {
      if (elementType === SOUND_TYPES.WEB_AUDIO) {
        // webAudio may change state to running because the AudioContext initialization process is asynchronous.
        elementInstance.onstatechange = handleWebAudioStateChange;
      }

      doMute();
    };

    readyMute();
  };

  var muteDynamicElementsSound = function muteDynamicElementsSound() {
    var muteWebAudio = function muteWebAudio() {
      var AudioContextMod = function AudioContextMod() {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        var instance = _construct(originAudioContext, args);

        muteSound(instance, SOUND_TYPES.WEB_AUDIO);
        return instance;
      };

      AudioContextMod.prototype = originAudioContext.prototype;
      Object.defineProperty(window, 'AudioContext', {
        value: AudioContextMod,
        configurable: true
      });
    };

    var muteDynamicAudioAndVideo = function muteDynamicAudioAndVideo() {
      var getCreateElementMod = function getCreateElementMod() {
        return function (tagName) {
          var instance = originCreateElement.call(document, tagName);
          var tagNameInLowerCase = tagName.toLowerCase();

          if (htmlElementsNeedMuted.includes(tagNameInLowerCase)) {
            muteSound(instance, tagNameInLowerCase === 'audio' ? SOUND_TYPES.AUDIO : SOUND_TYPES.VIDEO);
          }

          return instance;
        };
      };

      Object.defineProperty(document, 'createElement', {
        value: getCreateElementMod(),
        configurable: true
      });
    }; // dynamic created webAudio


    muteWebAudio(); // dynamic created Audio and Video

    muteDynamicAudioAndVideo();
  };

  var muteDomElementsSound = function muteDomElementsSound() {
    var audioElements = _toConsumableArray(document.querySelectorAll('audio'));

    var videoElements = _toConsumableArray(document.querySelectorAll('video'));

    audioElements.forEach(function (v) {
      muteSound(v, SOUND_TYPES.AUDIO);
    });
    videoElements.forEach(function (v) {
      muteSound(v, SOUND_TYPES.VIDEO);
    });
  };

  var init = function init() {
    muteDynamicElementsSound();
    window.addEventListener('DOMContentLoaded', muteDomElementsSound);
  };

  init();
};

exports.muteAllSound = muteAllSound;

if (window.location.search.indexOf('is_muted=true') !== -1) {
  muteAllSound();
} // end: mute playable page sound
// Storage for tokens


window.VungleHelper = {};

VungleHelper.setSKPresentation = function (eventType, presentationType) {
  var presentationOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var creativeEventTypes = {
    skPresentationASOIInteraction: 'asoi-interaction',
    skPresentationASOIComplete: 'asoi-complete',
    skPresentationCTAClick: 'cta-click'
  }; //Check if creative event matches supported events

  var objectKey = Object.keys(creativeEventTypes).find(function (key) {
    return creativeEventTypes[key] === eventType;
  });

  if (objectKey) {
    var skPresentationSettings = {};
    skPresentationSettings[objectKey] = {
      presentationType: presentationType,
      presentationOptions: presentationOptions
    };
    window.sendMessage('ad-event-sk-presentation', skPresentationSettings);
  }
};

VungleHelper.dismissSKOverlay = function () {
  window.sendMessage('ad-event-sk-dismiss');
};

var clickEvent = function () {
  if ('ontouchstart' in document.documentElement === true) {
    return 'touchstart';
  }

  return 'click';
}(); // Legacy IEC v1 Event


window.callSDK = function (action) {
  parent.postMessage(action, '*');
}; // Legacy IEC v2 Event


window.actionClicked = function (action) {
  parent.postMessage(action, '*');
}; // Adwords Open Event


window.open = function () {
  //Open should always redirect to CTA Download
  parent.postMessage('download', '*');
};

window.addEventListener(clickEvent, function () {
  parent.postMessage('interacted', '*');
});
window.addEventListener('error', function (event) {
  var reason = event.error ? event.error.name : '';
  parent.postMessage({
    title: 'playable-error',
    content: reason
  }, '*');
});
window.addEventListener('unhandledrejection', function (event) {
  parent.postMessage({
    title: 'playable-unhandledrejection',
    content: event.reason
  }, '*');
});
window.addEventListener(clickEvent, function (e) {
  // Since the click event is on ad.html, we need to pass the click coordinates to the parent page outside the iframe.
  var clientX = 0;
  var clientY = 0;
  clientX = e.touches ? e.touches[0].clientX : e.clientX;
  clientY = e.touches ? e.touches[0].clientY : e.clientY;
  parent.postMessage('clickEvent|' + clientX + '|' + clientY, '*');
});
document.addEventListener('DOMContentLoaded', function () {
  window.sendMessage('ad-event-loaded');
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    e.preventDefault();
  }
});

function sendEvent(name, obj) {
  if (typeof obj === 'undefined') {
    obj = {};
  }

  var event = new CustomEvent(name, {
    'detail': obj
  });
  window.dispatchEvent(event);
}

Event.prototype.stopPropagation = function () {// Disable Event Propagation for touchstart event listeners
};

window.sendMessage = function (title, obj) {
  // Make sure you are sending a string, and to stringify JSON
  var data = {
    title: title,
    content: obj
  };
  window.parent.postMessage(data, '*');
};

window.receiveMessage = function (e) {
  if (e.data.length === 0 || typeof e.data.title === 'undefined') {
    return;
  }

  window.processMessage(e.data.title, e.data.content || {});
  sendEvent(e.data.title, e.data.content || {});
};

window.processMessage = function (title, content) {
  if (title === 'ad-event-init') {
    VungleHelper.tokens = content.tokens;
    VungleHelper.closeDelay = content.closeDelay;
    VungleHelper.rewardedAd = content.rewardedAd;
  }
};

window.addEventListener('message', window.receiveMessage);

window.sendInstructions = function () {
  window.sendMessage('ad-event-child-instructions', window.vungleSettings);
};

if (typeof window.vungleSettings !== 'undefined') {
  window.sendInstructions();
}

},{}]},{},[1]);
