requirejs.config({
    baseUrl: 'scripts',
    paths: {
        px500: 'vendors/px500',
        underscore: '../bower_components/underscore/underscore',
        Backbone: '../bower_components/backbone/backbone',
        photoManager: 'modules/photoManager',
        Tooltip: 'modules/tooltip'

    },
    shim: {
        underscore: {
            exports: '_'
        }
    }
});
requirejs(['photoManager', 'underscore','Tooltip'], function(photoManager,  _, Tooltip) {

    // content page container
    var px500img = document.querySelector('.px500-img'); // img, as background
    var blurMask = document.querySelector('.blur-mask'); // img, as blur mask
    var px500SettingBtn = document.querySelector('.px500-setting-btn');
    var px500TackBtn = document.querySelector('.px500-tack-btn');
    var fragmentContainer = document.querySelector('.fragment-container');
    var px500Panel = document.querySelector('.px500-panel');
    var px500SettingPanel = document.querySelector('.px500-setting-panel');


    chrome.runtime.getBackgroundPage(function(eventPage) {
        photoManager = eventPage.photoManager || photoManager;
        var photoWithMetas = photoManager.get500px();
        if (!photoWithMetas.photo) {
            photoManager.set500px();
            photoWithMetas = photoManager.get500px();
        }
        displayPx500(photoWithMetas);
    });



    /**
     *
     * construct the new Tab view with 500px photo and its metas
     * @param  {Object} photoMetas photoWithMetas
     *
     */
    function displayPx500(photoMetas) {
        /// get pic metas holders
        var picMetasDom = px500Panel.querySelector('.pic-metas'); // metas view container
        var picMetaTitle = picMetasDom.querySelector('.pic-title'); // title of the photo
        var picMetaUser = picMetasDom.querySelector('.pic-user'); // user of the photo
        var picMetaDescription = picMetasDom.querySelector('.pic-description'); // user of the photo

        var featuresHolder = px500SettingPanel.querySelector('.features'); // 500px features(categories) holder


        /// set title and user
        picMetaTitle.href = photoMetas.link;
        picMetaTitle.text = photoMetas.name;


        // set img src, for background and blur mask
        px500img.src = photoMetas.photo;
        blurMask.src = photoMetas.photo;


        /// set descpitoin
        if (!_.isEmpty(photoMetas.description)) {
            picMetaDescription.innerHTML = photoMetas.description;
            picMetaDescription.classList.remove('hide');
            picMetaUser.href = photoMetas.userPage;
            picMetaUser.text = '-- ' + photoMetas.username;
            picMetaUser.classList.remove('hide');
        }


        /// set tags.
        var tags = photoMetas.tags.slice(0, 6);
        var tagIndex = tags.length;
        if (tagIndex > 0) {
            var picMetaTags = document.createElement('div');
            picMetaTags.classList.add('pic-tags', 'text-white','metas-focus');
            for (tagIndex--; tagIndex >= 0; tagIndex--) {
                var tagElement = document.createElement('a');
                tagElement.classList.add('pic-tag');
                tagElement.text = '#' + tags[tagIndex];
                tagElement.href = 'https://500px.com/search?tag=' + tags[tagIndex] + '&type=photos';
                picMetaTags.appendChild(tagElement);
            }
            picMetasDom.appendChild(picMetaTags);
        }

        /// mark this photo is view, ask to make a request for a new one.
        photoManager.mark();
        photoManager.refresh();


        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        /// fragment pages
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        var selectedFeature = px500SettingPanel.querySelector('.feature.selected');
        var termInput = px500SettingPanel.querySelector('.term-input');

        // set feature or term
        if (photoMetas.term && photoMetas.term !== 'null') {
            termInput.value = photoMetas.term;
        } else if (photoMetas.feature) {
            var features = px500SettingPanel.querySelectorAll('.feature');
            var i = features.length;
            for (i--; i >= 0; i--) {
                selectedFeature = features[i];
                if (selectedFeature.getAttribute('data-feature') === photoMetas.feature) {
                    selectedFeature.classList.add('selected');
                    break;
                }
            }
            if (i < 0) {
                selectedFeature = null;
            }
        }


        function refresh500pxSetting() {
            if (selectedFeature) {
                photoManager.setFeature(selectedFeature.getAttribute('data-feature'));
                termInput.value = '';
            } else if (!_.isEmpty(termInput.value)) {
                photoManager.setTerm(termInput.value, false);
            }
        }

        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        /// event handler
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        px500SettingBtn.addEventListener('click', function(event) {
            if (this.classList.contains('active')) {
                refresh500pxSetting();
            }
            this.classList.toggle('active');
            fragmentContainer.classList.toggle('active');
            blurMask.classList.toggle('show');
            px500Panel.classList.toggle('slide');
            px500SettingPanel.classList.toggle('bounceIn');
        });
        // tack 
        function tack(){
            var isTacked = JSON.parse(localStorage.getItem('isTacked'));
            var content =  isTacked ? 'Click to untacked. fetch new pic form next tick.' : 'Click to tack,keep this pic for a while'; 
            px500TackBtn.setAttribute('data-content',content);
            Tooltip.setContent(content);
            if(isTacked){
                px500TackBtn.classList.remove('untacked');
                px500TackBtn.classList.add('tacked');
            }else{
                px500TackBtn.classList.remove('tacked');
                px500TackBtn.classList.add('untacked');
            }
        }
        px500TackBtn.addEventListener('click',function(event){
            photoManager.tack(photoMetas);
            tack();
        });
        tack();

        Tooltip.init();
        Tooltip.make(px500TackBtn);


        termInput.addEventListener('keyup', function(event) {
            if (event.keyCode === 13) {
                if (selectedFeature != null) {
                    selectedFeature.classList.remove('selected');
                    selectedFeature = null;
                }
                this.blur();
            }
        });
        px500SettingPanel.addEventListener('click', function(event) {
            var target = event.target;
            // stream : feature
            if (target.classList.contains('feature')) {
                if (selectedFeature != null) {
                    selectedFeature.classList.remove('selected');
                }
                selectedFeature = target;
                selectedFeature.classList.add('selected');
                termInput.value = '';
            }
        }, false);
    }

});