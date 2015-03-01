define(['px500', 'underscore'], function(px500, _) {

    //  The number of photos to return.
    var PER_PAGE = 100;

    // PhotoManager Status
    var STATUS = PhotoManager.STATUS = {
        FETCHING: 1,
        DOWNLOADING: 2,
        IDLE: 3,
        FETCH_ERROR: 4,
        DOWNLOAD_ERROR: 5,
        SAVE_ERROR: 6
    };

    // max times to try after failed.
    var MAX_RETRY = 3;

    // time for chrome.alarm to fire, to reset photoManager.status
    var MONITOR_MINUTE = 1;

    // 500px sdk key
    var SDK_KEY = '2e23273c0b5ba6d6706d184d6919b6365ada0de0';

    // pre defined features to used with stream
    var FEATURES = 'popular,highest_rated,upcoming,editors,fresh_today,fresh_yesterday,fresh_week'.split(',');

    // pre defined terms[tags] to used in search
    var TERMS = 'scenery,nature,travel,landscapes,urban,season'.split(',');

    var PX500 = 'https://500px.com';

    // default configuration for 500px api
    var defaultQuery = {
        image_size: 4,
        tags: 1,
        rpp: PER_PAGE
    };

    // default 500px obj
    var defaultPx500 = {
        photo: '../../assets/images/bg.png',
        userPage: 'https://500px.com/MeerSadi',
        link: 'https://500px.com/photo/100276985/cloud-atlas-by-meer-sadi',
        description: 'Two fishermen going home during the twilight .',
        tags: 'colorful,clouds,boat,beautiful bangladesh'.split(','),
        name: 'Cloud Atlas',
        username: 'Meer Sadi',
        index: -1,
        page: 1,
        isView: false
    };

    // singletom
    var photoManager = null;

    function PhotoManager() {
        px500.init({
            sdk_key: SDK_KEY
        });
        this.callbacks = [];
        this.status = STATUS.IDLE;
        this.retry = 0;
        if (!localStorage.getItem('feature') && !localStorage.getItem('term')) {
            this.setFeature();
            this.mark();
        }
    }

    PhotoManager.prototype.set500px = function(px500) {
        px500 = _.extend({}, defaultPx500, px500);
        try {
            _.each(_.keys(px500), function(k) {
                localStorage.setItem(k, px500[k]);
            });
            console.log('set 500px succeed');
        } catch (e) {
            console.log("set 500px failed: localStorage issue, " + e);
        }
    };

    // create monitors for fetching and downloading to prevent endless request,
    // while the listener will be set up in event.js
    PhotoManager.monitor = function() {
        console.log('monitoring...');
        chrome.alarms.create('requestMonitor', {
            delayInMinutes: MONITOR_MINUTE
        });
    };
    PhotoManager.clearMonitor = function(name) {
        console.log('clear monitor');
        chrome.alarms.clear(name || 'requestMonitor');
    };

    // reset status
    PhotoManager.prototype.reset = function() {
        this.status = STATUS.IDLE;
        this.retry = 0;
        this.callbacks = [];
    };

    PhotoManager.prototype.register = function(callback) {
        if (_.isFunction(callback)) {
            this.callbacks.push(callback);
        }
    };
    PhotoManager.prototype.run = function() {
        this.callbacks.forEach(function(cb) {
            cb.apply(photoManager, photoManager.get500px());
        });
        this.callbacks = [];
    };

    /**
     *
     * using the 500px api to perform a query for photos
     * @param  {String} api   500px api, '/photos' or '/photos/search'
     * @param  {Object} query query configuration
     *
     */
    function fetchPhotosList(api, query) {

        photoManager.status = STATUS.FETCHING;

        console.log('-----------------------');
        console.log('start fetching');
        // create monitor
        PhotoManager.monitor();

        // begin fetching
        px500.api(api, query, function(response) {

            console.log('fetch finished');
            // get calback, clear monitor
            PhotoManager.clearMonitor();

            // 404, abort
            if (response.status === 404) {
                photoManager.status = STATUS.FETCH_ERROR;
                photoManager.retry = 0;
                return;
            }

            photoManager.status = response.success ? STATUS.IDLE : STATUS.FETCH_ERROR;

            if (photoManager.status === STATUS.FETCH_ERROR) {
                if (++photoManager.retry < MAX_RETRY) {
                    fetchPhotosList(api, query);
                } else {
                    photoManager.retry = 0;
                    return;
                }
            }

            photoManager.retry = 0;
            var photos = response.data.photos;
            var photo = null;
            var index = parseInt(localStorage.getItem('index'));
            index = _.isNumber(index) ? index + 1 : 0;

            for (; index < PER_PAGE; index++) {
                photo = photos[index];
                if (photo && photo.height < photo.width) break;
            }

            if (index >= PER_PAGE) {
                // not found in this page, fetch next page
                query.page++;
                localStorage.setItem('page', query.page);
                localStorage.setItem('index', -1);
                fetchPhotosList(api, query);
            } else {
                // found, begin download.
                photo.index = index;
                localStorage.setItem('page', query.page);
                localStorage.setItem('index', index);
                photo.page = response.data.current_page;

                console.log('fetch succeed');
                download(photo);
            }
        });
    }

    /**
     *
     * download and cache a photo as well as it's meta data
     * @param  {object} photo object with all details of a photo
     *
     */
    function download(photo) {

        console.log('start downloading');
        // begin monitoring download
        PhotoManager.monitor();

        photoManager.status = STATUS.DOWNLOADING;

        var image = document.createElement('img');

        image.onload = function() {

            // download succeed, clear monitor
            console.log('image onload succeed');
            PhotoManager.clearMonitor();

            var imgCanvas = document.createElement("canvas"),
                imgContext = imgCanvas.getContext("2d");

            imgCanvas.width = image.width;
            imgCanvas.height = image.height;

            imgContext.drawImage(image, 0, 0, image.width, image.height);

            var imgAsDataURL = imgCanvas.toDataURL("image/png");
            try {
                if(!JSON.parse(localStorage.getItem('isTacked'))){
                    //localStorage.setItem('index', photo.index);
                    //localStorage.setItem("page", photo.page);
                    localStorage.setItem("photo", imgAsDataURL);
                    localStorage.setItem('link', PX500 + photo.url);
                    localStorage.setItem('userPage', PX500 + '/' + photo.user.username);
                    localStorage.setItem('description', photo.description || '');
                    localStorage.setItem('tags', photo.tags);
                    localStorage.setItem('name', photo.name);
                    localStorage.setItem('username', photo.user.fullname);
                    localStorage.setItem('isViewed', false);
                    console.log('download succeed');
                }else{
                    console.log('download succeed, but refresh process is tacked,abort..');
                }
                // fire callbacks
                //photoManager.run();
                photoManager.status = STATUS.IDLE;
            } catch (e) {
                console.log('download failed, in localstorage');
                photoManager.status = STATUS.SAVE_ERROR;
            }
        };

        image.onerror = function() {
            console.log('download failed');
            // download failed, clear monitor
            PhotoManager.clearMonitor();

            photoManager.status = STATUS.DOWNLOAD_ERROR;
            if (++photoManager.retry < MAX_RETRY) {
                console.log('retry downloading');
                download(photo);
            } else {
                photoManager.retry = 0;
            }
        };
        image.src = photo.image_url;

    }

    /**
     *
     * set to fetch photos with stream
     * @param {String} feature feature string,which will be used to queryed with in the following queries.
     *
     */
    PhotoManager.prototype.setFeature = function(feature) {
        if (localStorage.getItem('feature') !== feature) {
            localStorage.setItem('page', 1);
            localStorage.setItem('index', -1);
            localStorage.removeItem('term');
            localStorage.removeItem('termType');
            localStorage.setItem('feature', feature || FEATURES[0]);
        }
    };

    /**
     *
     * set to fetch photos with term
     * @param {term}  term  the keyword to search with
     * @param {Boolean} isTag whether the term is a tag or not
     *
     */
    PhotoManager.prototype.setTerm = function(term, isTag) {
        if (localStorage.getItem('term') !== term) {
            localStorage.setItem('page', 1);
            localStorage.setItem('index', -1);
            localStorage.removeItem('feature');
            localStorage.setItem('term', term || TERMS[0]);
            localStorage.setItem('termType', isTag ? 'tag' : 'term');
        }
    };



    /**
     *
     * auto refresh the cache photo
     *
     */
    PhotoManager.prototype.refresh = function() {
        // abort this request if cached or fetching or downloading or 500px is tacked(paused)
        var ok = JSON.parse(localStorage.getItem('isViewed')) && !JSON.parse(localStorage.getItem('isTacked'));
        ok = ok && photoManager.status !== STATUS.FETCHING && photoManager.status !== STATUS.DOWNLOADING;
        if (!ok) {
            console.log('not ok, abort.');
            if (JSON.parse(localStorage.getItem('isTacked'))) {
                console.log('refresh process is tacked.');
            }
            return;
        }

        // prepare api and query object
        var api = '/photos',
            query = {};
        if (localStorage.getItem('feature')) {
            query.feature = localStorage.getItem('feature') || FEATURES[0];
        } else {
            query[localStorage.getItem('termType') || 'tag'] = localStorage.getItem('term') || TERMS[0];
            api += '/search';
        }

        query = _.extend(query, defaultQuery);
        query.page = parseInt(localStorage.getItem('page')) || 1;

        // check if new page.
        var index = parseInt(localStorage.getItem('index'));
        if (_.isNumber(index) && (index + 1) === PER_PAGE) {
            query.page++;
            localStorage.setItem('page', query.page);
            localStorage.setItem('index', -1);
        }
        // start the request.
        fetchPhotosList(api, query);
    };

    /**
     *
     * fetch the cache data from localstorage,
     * @return {Object} photo with it's meta data
     *
     */
    PhotoManager.prototype.get500px = function() {
        var px500 = {};
        _.each(_.keys(defaultPx500).concat(['term','feature']), function(k) {
            px500[k] = localStorage.getItem(k);
        });
        px500.tags = (px500.tags || '').split(',');
        return px500;
    };

    PhotoManager.prototype.mark = function() {
        localStorage.setItem('isViewed', true);
    };
    PhotoManager.prototype.tack = function(photo) {
        if (JSON.parse(localStorage.getItem('isTacked'))) {
            localStorage.setItem('isTacked', false);
            this.refresh();
        } else {
            localStorage.setItem('isTacked', true);
            this.set500px(photo);
        }
    };

    photoManager = new PhotoManager();

    return photoManager;


});