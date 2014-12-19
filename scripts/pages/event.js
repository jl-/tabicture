;
requirejs.config({
    baseUrl: 'scripts',
    paths: {
        px500: 'vendors/px500',
        underscore: '../bower_components/underscore/underscore',
        photoManager: 'modules/photoManager',
        FSO: 'vendors/fso'
    },
    shim: {
        underscore : {
          exports: '_'
        },
        FSO: {
            init: function(){
                return window.FSO;
            }
        }
    }
});
requirejs(['photoManager'], function(photoManager) {
   window.photoManager = photoManager; 
    // ============================================
    // 
    // ============================================
    chrome.runtime.onInstalled.addListener(function(){
        console.log('installing ...');
        photoManager && photoManager.set500px();
    });

    //===============================================
    //
    //===============================================
    chrome.runtime.onStartup.addListener(function(){
        console.log('start up');
    });

    // monitor for fetching and downloading, prevent endless request.
    chrome.alarms.onAlarm.addListener(function(alarm){
        // alarm && alarm.name === 'requestMonitor'
        console.log('fire alarm, get');
        if(alarm){
            photoManager.reset();
        }
    });
});