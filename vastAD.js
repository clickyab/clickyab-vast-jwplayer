
// (C) 2016 - MiladHeydari <miladheydari.work@gmail.com>
// Project Based on VAST-VMAP -> by https://github.com/jonhoo/vast-vmap
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.



if(typeof isLoaded == 'undefined') {
    isLoaded = true;
    //EventListener in mobile and desktops
    var clickEvent = navigator.userAgent.match(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i) ? 'touchstart' : 'click';

    var addRule = (function (style) {
        var sheet = document.head.appendChild(style).sheet;
        return function (selector, css) {
            var propText = typeof css === "string" ? css : Object.keys(css).map(function (p) {
                return p + ":" + (p === "content" ? "'" + css[p] + "'" : css[p]);
            }).join(";");
            sheet.insertRule(selector + "{" + propText + "}", sheet.cssRules.length);
        };
    })(document.createElement("style"));

    function fetchXML(url, identifier, onSuccess, onFailure) {
        var request;

        // IE 9 CORS method
        if (window.XDomainRequest)
        {
            request = new XDomainRequest();

            request.onload = function()
            {

                if (request.contentType != null && request.responseText != null)
                {

                    // IE < 10 requires to parse the XML as string in order to use the getElementsByTagNameNS method
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(request.responseText, 'text/xml');

                    onSuccess(doc, identifier);

                }
                else
                    onFailure(request, identifier);

            };

            request.onerror = request.ontimeout = function()
            {
                onFailure(request, identifier);
            };

        }
        else // The standard one
        {

            request = new XMLHttpRequest();

            request.onreadystatechange = function() {
                if (request.readyState === 4) {
                    if (request.status === 200) {
                        if (request.responseXML !== null) {
                            onSuccess(request.responseXML, identifier);
                        } else {
                            onFailure(request, identifier);
                        }
                    } else {
                        onFailure(request, identifier);
                    }
                }
            };

        }

        request.open("GET", url, true);
        VAST_VMAP_XHROptions.onBeforeSend(url, identifier, request);
        request.send(null);
    }
    function queryVAST(endpoint, onFetched, onError, parentAd) {
        var e = "Reached abort limit of (" + VAST_VMAP_XHROptions.defaultVASTAbortLimit + ") wrappers.";
        /**
         * Handle the case where there's an error, but no onError provided.
         */
        onError = onError || function () {};
        /**
         * Abort and call onError() immediately in the following conditions
         * 1.  There is no parentAd (this would be the root ad) AND the VAST_VMAP_XHROptions.defaultVASTAbortLimit is 0
         * 2.  There is a parentAd (this is not the root ad) AND parentAd.abortLimit is 0
         *
         * Otherwise fetch the next VAST response from endpoint.  The next ad's abortLimit is parentAd.abortLimit - 1.
         */
        var abort = ((!parentAd && VAST_VMAP_XHROptions.defaultVASTAbortLimit === 0) ||
            (parentAd && parentAd.abortLimit === 0)) &&
            (onError(new Error(e)) || true);

        if (abort) {
            /**
             * Put this in setTimeout to avoid being burned by clients with
             * weird, non-standard, or no console.
             */
            setTimeout(function () {
                if (typeof buster === "undefined") {
                    if ("warn" in console) {
                        console.warn(e);
                    } else {
                        console.log(e);
                    }
                }
            }, 0);
        }

        return (abort || fetchXML(endpoint, null, function(doc) {
            try {
                new VASTAds(doc, onFetched, onError, parentAd);
            } catch(e) {
                console.error(e.toString());
                var s = e.stack.split(/\n/);
                for (var i = 0; i < s.length; i++) {
                    var msg = s[i];
                    msg = msg.replace("[arguments not available]", "");
                    msg = msg.replace(/http:\/\/.*?resources\//, "");
                    console.debug("\t" + msg);
                }

                onError();
            }
        }, function (e) {
            console.error("Failed to load VAST from '" + endpoint + "':", e);
            onError(e);
        })), void (0);
    }
    function TrackingEvents(root, ad) {
        this.events = {};
        this.ad = ad;

        if (root === null) {
            return;
        }

        if (root.tagName !== "TrackingEvents") {
            root = root.getElementsByTagName("TrackingEvents");
            if (root.length !== 1) {
                return;
            }

            root = root.item(0);
        }

        var tracks = root.getElementsByTagName("Tracking");
        for (var i = 0; i < tracks.length; i++) {
            var e = tracks[i].getAttribute("event");
            if (!e) {
                continue;
            }

            var offset = null;
            if (e === "progress") {
                offset = tracks[i].getAttribute("offset");
                e += "-" + offset;
            }

            this.events[e] = this.events[e] || [];

            var ev = {
                "url": tracks[i].textContent.replace(/\s/g, ""),
                "offset": offset,
                "event": e
            };

            this.events[e].push(ev);
        }
    }
    var getTimeOffset =  [];
    window.getTimeOffset = [];
    function VMAP(a, b, c) {
        this.breaks = [];
        var d = [], e = this;
        fetchXML(a, null, function (a) {
            for (var f = a.getElementsByTagName("AdBreak"), g = [], h = 0; h < f.length; h++) {
                var i = f.item(h);
                if (d[h] = i.getAttribute("timeOffset"), 0 !== d[h].indexOf("#")) {
                    // window.getTimeOffset = window.getTimeOffset.push(d[h]);
                    var j = {
                        ad: null,
                        breakId: i.getAttribute("breakId"),
                        tracking: new TrackingEvents(i, null),
                        position: d[h]
                    }, k = i.getElementsByTagName("VASTData");
                    if (0 != k.length)j.ad = new VASTAds(k.item(0).getElementByTagName(null, "VAST").item(0), targetedAdHandler); else {
                        var l = i.getElementsByTagName("AdTagURI");
                        if (!l) {
                            console.error("No supported ad target for break #" + h);
                            continue
                        }
                        var m;
                        !function (a) {
                            m = function (c) {
                                a.ad = c, null !== c && b(-1, a.position, c)
                            }
                        }(j), queryVAST(l.item(0).textContent.replace(/\s/g, ""), m)
                    }
                    e.breaks.push(j), g.push(j.position)
                }
            }
            "function" == typeof c && c(g)
        }, function (b) {
            console.error("Failed to load VMAP from '" + a + "':", b), c([])
        })
    }
// console.log(window.getTimeOffset);
    function VASTAds(root, onAdsAvailable, onError, parentAd) {
        this.ads = [];
        this.onAdsAvailable = onAdsAvailable;
        this.onAdsError = onError;
        this.onReceivedErrorCounter = 0;
        var adElements = root.getElementsByTagNameNS("*", 'Ad');

        var that = this;

        if (adElements.length === 0) {
            onError();
            return;
        }

        var onAdError = function (e) {
            that.onReceivedErrorCounter++;
            if (that.onReceivedErrorCounter === adElements.length) {
                onError(e);
                return;
            }
        };

        for (var i = 0; i < adElements.length; i++) {
            var ad = new VASTAd(this, adElements.item(i), parentAd || null);
            if (ad.isEmpty()) {
                onAdError();
                continue;
            }

            this.ads.push(ad);

            if (ad.hasData() && (!ad.hasSequence() || ad.isNumber(1))) {

                if (onAdsAvailable) {
                    // Needs to be reset before calling user function since user function
                    // may take long to execute
                    var oaf = this.onAdsAvailable;
                    this.onAdsAvailable = null;
                    oaf.call(this, this);
                }
            } else {
                var wrapper = adElements.item(i).getElementsByTagName('Wrapper').item(0);
                var uri = wrapper.getElementsByTagName('VASTAdTagURI');
                if (uri.length === 0) {
                    onAdError();
                    continue;
                }

                uri = uri.item(0).textContent.replace(/\s/g, "");
                var allowPods = wrapper.getAttribute("allowMultipleAds") === "true";

                var onGotFirstAd;
                (function(ad, allowPods, that) {
                    onGotFirstAd = function(ads) {
                        ad.onLoaded(ads, allowPods);
                        if (that.onAdsAvailable) {
                            var oaf = that.onAdsAvailable;
                            that.onAdsAvailable = null;
                            oaf.call(that, that);
                        }
                    };
                })(ad, allowPods, that);
                queryVAST(uri, onGotFirstAd, onAdError, ad);
            }
        }
    }
    function VASTAd(vast, root, parentAd, onAdAvailable) {
        this.vast = vast;
        this.pod = vast;
        this.parentAd = parentAd;
        this.onAdAvailable = onAdAvailable;
        this.abortLimit = parentAd ? parentAd.abortLimit > 0 ? parentAd.abortLimit - 1 :
            parentAd.abortLimit : VAST_VMAP_XHROptions.defaultVASTAbortLimit;
        this.sequence = null;
        this.hasContent = true;
        this.loaded = true;
        this.linear = null;
        this.companions = [];
        // TODO: Enforce the companions required attribute
        // Can that even be done here, or must it be done by interface?
        // Must give interface a way of "rejecting" an ad?
        this.companionsRequired = "none";
        this.nonlinears = [];
        this.nonlinearsTracking = null;
        this.impressions = [];
        this.currentPodAd = this;
        this.sentImpression = false;
        this.properties = {};

        /**
         * Copy over tracking and creatives from parent
         */
        var i, k;
        if (this.parentAd !== null) {
            var pa = this.parentAd;

            this.companionsRequired = pa.companionsRequired;
            this.linear = pa.linear ? pa.linear.copy(this) : null;

            if (pa.companions.length) {
                for (i = 0; i < pa.companions.length; i++) {
                    this.companions.push(pa.companions[i].copy(this));
                }
            }

            if (pa.nonlinears.length) {
                for (i = 0; i < pa.nonlinears.length; i++) {
                    this.companions.push(pa.nonlinears[i].copy(this));
                }
            }

            if (pa.nonlinearsTracking !== null) {
                this.nonlinearsTracking = pa.nonlinearsTracking.copy(this);
            }

            for (k in pa.properties) {
                if (pa.properties.hasOwnProperty(k)) {
                    this.properties[k] = pa.properties[k];
                }
            }
        }

        if (this.nonlinearsTracking === null) {
            this.nonlinearsTracking = new TrackingEvents(null, this);
        }

        if (root.hasAttribute('sequence')) {
            this.sequence = parseInt(root.getAttribute('sequence'), 10);
        }

        var inline = root.getElementsByTagName("InLine");
        if (inline.length === 0) {
            this.loaded = false;
            inline = root.getElementsByTagName("Wrapper");
            // Note here that VASTAds will automatically fetch wrapped responses for us,
            // so we don't need to do anything special with it here
            if (inline.length === 0) {
                this.hasContent = false;
                // TODO: error tracking
                return;
            }
        }

        inline = inline.item(0);

        var prop = inline.firstChild;
        while (prop !== null) {
            if (prop.nodeType === 1) {
                switch (prop.tagName) {
                    case 'Creatives':
                    case 'InLine':
                    case 'Wrapper':
                    case 'Impression':
                    case 'VASTAdTagURI':
                    case 'Error':
                        break;
                    default:
                        this.properties[prop.tagName] = prop.textContent.replace(/^\s*|\s*$/g, "");
                }
            }
            prop = prop.nextSibling;
        }

        // Extract Impressions
        var imps = inline.getElementsByTagName("Impression");
        for (i = 0; i < imps.length; i++) {
            this.impressions.push(imps.item(i).textContent.replace(/\s/g, ""));
        }

        /**
         * Time to find our creatives.
         * What makes this a lot more ugly that it should be is that we have to merge
         * up any tracking or creative elements that our wrapper ad created. Not only
         * that, but the spec isn't particularly helpful in how we might figure out
         * which elements to merge, so we have to do some heuristics as well.
         * Oh well, here goes...
         */
        var creatives = inline.getElementsByTagName("Creatives");
        if (creatives.length === 0) {
            return;
        }

        creatives = creatives.item(0).getElementsByTagName("Creative");
        for (i = 0; i < creatives.length; i++) {
            var creative = creatives.item(i).firstChild;

            // skip TextNodes
            while (creative !== null && creative.nodeType === 3) {
                creative = creative.nextSibling;
            }

            if (creative === null) {
                continue;
            }

            var n;
            switch (creative.tagName) {
                case "Linear":
                    n = new VASTLinear(this, creative);
                    if (this.linear) {
                        this.linear.augment(n);
                    } else {
                        this.linear = n;
                    }
                    break;
                /**
                 * From the spec:
                 *
                 *   When multiple Companion creative are included in the InLine response,
                 *   identifying which Companion clickthrough event shoud be associated
                 *   with the Wrapper tracking element can be difficult. The video player
                 *   may associate Inline Companion clickthrough activity to Wrapper
                 *   <CompanionClickTracking> events at its own discretion. The Companion
                 *   id attribute may be a useful association if provided, or the video
                 *   player can match width and height attributes.
                 *
                 * Oh, yeah, and it says nothing about how to match NonLinear elements...
                 */
                case "CompanionAds":
                    if (creative.hasAttribute("required")) {
                        this.companionsRequired = creative.getAttribute("required");
                    }
                /* falls through */
                case "NonLinearAds":
                    var tag = creative.tagName.replace("Ads", "");
                    var Cls = tag === "Companion" ? VASTCompanion : VASTNonLinear;
                    var arr = tag === "Companion" ? this.companions : this.nonlinears;

                    if (tag === "NonLinear") {
                        var track = new TrackingEvents(creative, this);
                        this.nonlinearsTracking.augment(track);
                    }

                    // Since we add to arr, we store the length to we don't start merging
                    // sibling elements.
                    var arrl = arr.length;

                    var items = creative.getElementsByTagName(tag);
                    for (var j = 0; j < items.length; j++) {
                        n = new Cls(this, items.item(j));

                        for (k = 0; k < arrl; k++) {
                            var o = arr[k];

                            // Match if two values are equal or only one is set
                            var m1 = o.attribute('id', n.attribute('id')) === n.attribute('id', o.attribute('id'));
                            var m2 = o.attribute('width', n.attribute('width')) === n.attribute('width', o.attribute('width'));
                            var m3 = o.attribute('height', n.attribute('height')) === n.attribute('height', o.attribute('height'));

                            // Set if both values are set
                            var idset = o.attribute('id') !== undefined && n.attribute('id') !== undefined;
                            var widthset = o.attribute('width') !== undefined && n.attribute('width') !== undefined;
                            var heightset = o.attribute('height') !== undefined && n.attribute('height') !== undefined;

                            // If all match and at least one set for both
                            if (m1 && m2 && m3 && (idset || widthset || heightset)) {
                                // If we do this merge then the n is basically a copy of o, which
                                // is already in the array, so we don't want to add it again.
                                o.augment(n);
                                n = null;
                                break;
                            }
                        }

                        if (n !== null) {
                            arr.push(n);
                        }
                    }
                    break;
            }
        }
    }
    function VASTCreative(ad, root) {
        this.root = root;
        this.clickThrough = null;
        if (root.tagName === "NonLinear") {
            root = root.parentNode;
        }
        this.tracking = new TrackingEvents(root, ad);
    }
    function VASTLinear(ad, root) {
        VASTCreative.call(this, ad, root);
        this.mediaFiles = [];
        this.clickThrough = null;
        this.duration = null;
        this.adParameters = null;

        var i;

        var clicks = root.getElementsByTagName("VideoClicks");
        if (clicks.length) {
            clicks = clicks.item(0);
            var ct = clicks.getElementsByTagName("ClickThrough");
            if (ct.length) {
                this.clickThrough = ct.item(0).textContent.replace(/\s/g, "");
                // console.log(this.clickThrough);
            }

            ct = clicks.getElementsByTagName("ClickTracking");
            for (i = 0; i < ct.length; i++) {
                this.tracking.addClickTracking(ct.item(i).textContent.replace(/\s/g, ""));
            }
        }

        var d = root.getElementsByTagName("Duration");
        if (d.length) {
            this.duration = this.timecodeFromString(d.item(0).textContent.replace(/\s/g, ""));
        }

        var ap = root.getElementsByTagName("AdParameters");
        if (ap.length) {
            this.adParameters = ap.item(0).textContent.replace(/\s/g, "");
        }

        var medias = root.getElementsByTagName("MediaFiles");
        if (!medias.length) {
            return;
        }

        medias = medias.item(0).getElementsByTagName("MediaFile");
        for (i = 0; i < medias.length; i++) {
            var m = medias.item(i);
            var mf = {};
            for (var a = 0; a < m.attributes.length; a++) {
                mf[m.attributes[a].name] = m.attributes[a].value;
            }
            mf["src"] = medias.item(i).textContent.replace(/\s/g, "");
            this.mediaFiles.push(mf);
        }
    }
    function VASTStatic(ad, root) {
        VASTCreative.call(this, ad, root);
        this.resources = {
            "iframe": null,
            "html": null,
            "images": {}
        };

        var res;
        res = root.getElementsByTagName("IFrameResource");

        if (res.length > 0) {
            this.resources["iframe"] = res.item(0).textContent.replace(/\s/g, "");

        }

        res = root.getElementsByTagName("HTMLResource");
        if (res.length > 0) {
            this.resources["html"] = res.item(0).textContent.replace(/\s/g, "");
        }

        res = root.getElementsByTagName("StaticResource");
        for (var i = 0; i < res.length; i++) {
            this.resources["images"][res.item(i).getAttribute("creativeType")] = res.item(i).textContent.replace(/\s/g, "");
        }

    }
    function VASTCompanion(ad, root) {
        VASTStatic.call(this, ad, root);
        this.altText = "";

        VASTStatic.prototype.extractClicks.call(this, "Companion");
        var el = root.getElementsByTagName("AltText");
        if (el.length) {
            this.altText = el.item(0).textContent.replace(/\s/g, "");
        }
    }
    function VASTNonLinear(ad, root) {
        VASTStatic.call(this, ad, root);
        this.tracking = ad.nonlinearsTracking;
        VASTStatic.prototype.extractClicks.call(this, "NonLinear");
    }

    function CYplayer(type,source ,clickThrough){

        this.Media=null;
        this.type=type;
        this.source=source;
        this.duration=9;
        this.pos=0;
        this.functional=null;
        this.functionalcomp=null;
        this.end=false;
        this.createElementsByType=function(){

            if(this.type.indexOf("image")>-1){

                this.Media=document.createElement("A");
                this.Media.style.display="block";
                this.Media.style.background="url('"+this.source+"')";
                this.Media.style.backgroundSize="100% 100%";
                this.Media.setAttribute("href",clickThrough);
                this.Media.setAttribute("target","_blank");
                this.Media.style.width="100%";
                this.Media.style.height="100%";



                //  this.Media=document.createElement("div");
                // this.Media.style.background="url("+this.source+")";
                // this.Media.style.backgroundSize="100% 100%";

            }else if(this.type.indexOf("html")>-1){

                this.Media=document.createElement("div");
                this.Media.innerHTML=decodeURI(this.source);

            }else if(this.type.indexOf("iframe")>-1){

                this.Media=document.createElement("iframe");
                this.Media.src=this.source;
                this.Media.style.background="#fff";


            }
        };

        this.setDuration=function(duration){
            this.duration=duration
        };

        this.getDuration=function(){
            return this.duration;
        };

        this.getPosition=function(){
            return this.pos;
        };

        this.onTime=function (functional){
            this.functional=functional;

        };

        this.onComplete = function (functional){
            this.functionalcomp=functional;

        };

        this.stop = function(){

            this.end=true;

        };

        this.play=function(){
            if(this.pos>this.duration || this.end==true){

                this.functionalcomp();
                return;
            }
            this.pos+=0.1;
            var that=this;
            setTimeout(function(e){
                that.functional();
                that.play();
            },100);
        };

        this.onClick=function(functioncal){

            if(this.type=="iframe"){
            }else if(this.type=="image"){
                this.Media.addEventListener("click",functioncal);
            }else{
                //this.Meida.addEventListener("click",functioncal);
            }
            this.Media.style.cursor="pointer";
        };

        this.setSize=function(){
            this.Media.style.border="none";
            this.Media.style.width='100%';
            this.Media.style.height='100%';
            if(this.type!="image"){

            }else{
                //this.Media.style.top="50%";
                //this.Media.style.position="absolute";
                //this.Media.style.transform = "translate(0, 50%)";
                //background-size:100%,100%;
                this.Media.style.backgroundSize="100%,100%";
                this.Media.style.backgroundRepeat="no-repeat";
                this.Media.style.backgroundPosition="center center";
            }
        }

        this.createElementsByType();

    };
    function CYVastPlayer(debug) {

        this.requestSettings = {
            width: null,
            height: null,
            bitrate: null,
            insertionPointType: null,
            playbackPosition: null
        };
        this.activeAd = null;
        this.adPlaying = false;
        this.adsEnabled = true;
        this.breaks = [];
        this.lastPlayedBreak = null;
        this.debug = !!debug;


        this.adPlayer=null;
        this.loadedVast=0;
        this.AmIReady=false;
        this.token=parseInt(Math.random()*1000000000);

        this.onAds=false;

        this.lastPlayedMidroll=0;

        this.IntCurrentTime=0;

        this.BannerNonLinear=null;
        this.BannerCampain=null;
        this.startedYet=false;

        this.adPlayerTimeLine=null;

        this.TrackingEvent={
            firstQuartile:false,
            midpoint:false,
            thirdQuartile:false,
            complete:false
        };

        this.Skipable=false;

        this.skip=null;
        this.adsPlayerZone=null;

        this.video=null;

        this._bindContextForCallbacks();
    };
    var VAST_VMAP_XHROptions = {
        XMLHttpRequest: function () {
            return new XMLHttpRequest();
        },
        onBeforeSend: function (url, identifier, XHR) {
        },
        defaultVASTAbortLimit: -1
    };
    VASTAds, VASTAd, VASTLinear, VASTNonLinear, VASTCompanion;

    TrackingEvents.prototype.copy = function(ad) {
        var n = Object.create(TrackingEvents.prototype);
        n.events = {};
        for (var e in this.events) {
            if (this.events.hasOwnProperty(e)) {
                n.events[e] = [].concat(this.events[e]);
            }
        }
        n.ad = ad;
        return n;
    };
    TrackingEvents.prototype.finger = function(url) {
        if (typeof window === 'object' && typeof Image !== 'undefined' && typeof buster === 'undefined') {
            // use an image where possible to avoid CORS errors in the console
            var track = new Image();
            track.src = url;
            return;
        }

        var request = VAST_VMAP_XHROptions.XMLHttpRequest();
        request.open("get", url, true);
        VAST_VMAP_XHROptions.onBeforeSend(url, "tracking-pixel", request);
        request.send();
    };
    TrackingEvents.prototype.augment = function(other) {
        for (var e in other.events) {
            if (!other.events.hasOwnProperty(e)) {
                continue;
            }

            if (!this.events[e]) {
                this.events[e] = other.events[e];
            } else {
                this.events[e] = this.events[e].concat(other.events[e]);
            }
        }
    };
    TrackingEvents.prototype.addClickTracking = function(url) {
        var ev = {
            "url": url,
            "event": "click",
            "offset": null
        };

        if (!this.events["click"]) {
            this.events["click"] = [ev];
        } else {
            this.events["click"].push(ev);
        }
    };
    /**
     * Returns all events of the given types
     *
     * @param {string[]} evs Event types to look for
     * @returns {object[]} A list of objects each representing one tracked event.
     *   Every object contains an "event" index holding the event name and
     *   optionally an "attributes" index holding a key-value mapping of any
     *   additional attributes for the event (like "offset" for progress events).
     */
    TrackingEvents.prototype.getEventsOfTypes = function(evts) {
        var ret = [];
        var includeProgress = evts.indexOf('progress') > -1;

        for (var e in this.events) {
            if (!this.events.hasOwnProperty(e)) {
                continue;
            }

            if (evts.indexOf(e) > -1 || (includeProgress && e.indexOf("progress-") === 0)) {
                ret = ret.concat(this.events[e]);
            }
        }

        return ret;
    };
    /**
     * Notifies all URIs that have subscribed to the given event type.
     *
     * @param {string} ev Event type to notify
     * @param {object} macros Macros to replace in the tracking URIs
     */
    TrackingEvents.prototype.track = function(ev, _macros) {
        if (!this.events[ev] || this.events[ev].length === 0) {
            return;
        }

        var evs = [].concat(this.events[ev]);
        var i;

        var macros = {};
        for (var m in _macros) {
            if (!_macros.hasOwnProperty(m)) {
                continue;
            }

            macros["[" + m + "]"] = encodeURIComponent(_macros[m]);
        }

        // First creative view for a creative within an ad should count as an
        // impression
        if (ev === "creativeView") {
            var ad = this.ad;
            while (ad !== null && !ad.hasSentImpression()) {
                ad.impressionSent();
                for (i = 0; i < ad.impressions.length; i++) {
                    evs.push({"url": ad.impressions[i]});
                }
                ad = ad.parentAd;
            }
        }

        var that = this;
        for (i = 0; i < evs.length; i++) {
            var e = evs[i];
            var url = e["url"];

            // Standard dictates 8 digits of randomness
            var rand = '' + parseInt(Math.random() * 99999999, 10);
            while (rand.length !== 8) {
                rand = '0' + rand;
            }
            macros["[CACHEBUSTING]"] = rand;

            for (m in macros) {
                if (!macros.hasOwnProperty(m)) {
                    continue;
                }
                url = url.replace(m, macros[m]);
            }

            that.finger(url);
        }
    };
    /**
     * Query the server for the available Ad Breaks and pass them to the callback
     *
     * This function will also asynchronously parse (and fetch if necessary) the
     * VAST ad specifications for each break in the VMAP response.
     *
     * @constructor
     * @param {string} server The server URL to contact to retrieve the VMAP
     * @param {function(number, string, VASTAds)} adHandler The function to call
     *   whenever the VAST ad response for an ad break has been fetched and/or
     *   parsed. This function will be called at most once for every ad break given
     *   to breakHandler. The first parameter to the function is the corresponding
     *   index in the list passed to the breakHandler, and the second parameter is
     *   the VASTAds object holding the possible ads to play for that break.
     * @param {?function} breakHandler The function to call when Ad Breaks have been
     *   fetched. This function will receive a list of break positions. Each
     *   position can either be a percentage (<1), a number of seconds into the
     *   content video or one of the string literals "start" or "end". Ordinal
     *   positions are not supported and thus will not be passed.
     */
    VMAP.prototype.onBreakStart = function(break_index) {
        this.breaks[break_index].tracking.track("breakStart");
        return this.breaks[break_index].ad;
    };
    VMAP.prototype.onBreakEnd = function(break_index) {
        this.breaks[break_index].tracking.track("breakEnd");
    };
    /**
     * Returns an ad from the list of ads given by the VAST server
     *
     * Will prefer pods unless allowPods === false
     *
     * Note that the result of a call to this function might change over time as
     * more ads are loaded
     *
     * @param {boolean} allowPods whether to allow ad pods (multiple videos) or not
     * @returns {VASTAd} An ad.
     */
    VASTAds.prototype.getAd = function(allowPods) {
        var ad = null;
        if (allowPods) {
            ad = this.getAdWithSequence(1);
            if (ad && !ad.current().isEmpty()) {
                return ad.current();
            }
        }

        // So, no pods available.
        // Just pick the first one we find
        // Standard does not dictate how to pick an ad...
        // Theoretically, we could look deep into the Linears to find the ad with the
        // media file that suits the player best, but that seems like overengineering.
        for (var i = 0; i < this.ads.length; i++) {
            if (this.ads[i].hasSequence()) {
                continue;
            }

            if (!this.ads[i].current().isEmpty()) {
                return this.ads[i].current();
            }
        }
    };
    VASTAds.prototype.getAdWithSequence = function(seq) {
        for (var i = 0; i < this.ads.length; i++) {
            if (this.ads[i].isNumber(seq)) {
                return this.ads[i];
            }
        }

        return null;
    };
    /**
     * Returns the value of the given tag for this ad
     *
     * See the VAST spec for what tags may be present on an ad
     * Note that ad tags are merged from the parent
     *
     * @param {string} tag The attribute to get
     * @param {*} [nothing] Value to return if tag isn't present. Defaults to
     *   undefined
     * @returns {?string} The value for that tag for this ad or default if unset
     */
    VASTAd.prototype.getTag = function(tag, nothing) {
        if (!this.properties.hasOwnProperty(tag)) {
            return nothing;
        }

        return this.properties[tag];
    };
    /**
     * Should be called the VAST response matching this wrapped ad is parsed and
     * ready.
     *
     * @param {VASTAds} ads VASTAds object wrapped by this ad
     */
    VASTAd.prototype.onLoaded = function(ads, allowPods) {
        this.pod = ads;
        this.currentPodAd = ads.getAd(allowPods);

        if (!this.currentPodAd.isEmpty()) {
            this.loaded = true;
            if (this.onAdAvailable) {
                this.onAdAvailable.call(this, this);
            }
        }
    };
    /**
     * Returns true if impression metrics has been sent for this ad, false otherwise
     *
     * @returns {boolean} true if impression metrics have been sent, false otherwise
     */
    VASTAd.prototype.hasSentImpression = function() {
        return this.sentImpression;
    };
    /**
     * Indicate that impression metrics have been sent for this ad
     */
    VASTAd.prototype.impressionSent = function() {
        this.sentImpression = true;
    };

    /**
     * Returns the representative ad for this ad.
     *
     * For normal ads, this should just return this ad, for pods, it should return
     * the current ad withing the pod
     *
     * @returns {VASTAd} the representative ad for this ad
     */
    VASTAd.prototype.current = function() {
        return this.currentPodAd;
    };

    /**
     * Determines if this ad has the given sequence number
     *
     * @param {number} seq The target sequence number
     * @returns {boolean} true if this ad has the given sequence number, false
     *   otherwise
     */
    VASTAd.prototype.isNumber = function(seq) {
        return this.sequence === seq;
    };

    /**
     * Determines if this ad has a sequence number
     *
     * @returns {boolean} true if this ad has a sequence number, false otherwise
     */
    VASTAd.prototype.hasSequence = function() {
        return this.sequence !== null;
    };

    /**
     * Determine if this ad has any content (wrapped or inline) or not
     *
     * @returns {boolean} True if this <Ad> contains a <Wrapper> or <InLine>, false
     *   otherwise
     */
    VASTAd.prototype.isEmpty = function() {
        return !this.hasContent;
    };

    /**
     * Determines if the current VASTAd has inline data. Returns false if it is a
     * wrapper ad entry that has not yet been loaded.
     *
     * @returns {boolean} True if this ad contains an <InLine>, false otherwise
     */
    VASTAd.prototype.hasData = function() {
        return this.loaded;
    };

    /**
     * Returns the next ad after this one (if any)
     *
     * TODO: In VAST 2.0, this should return any next ad, not just based on seq
     *
     * @returns {?VASTAd} The next ad or null
     */
    VASTAd.prototype.getNextAd = function() {
        if (this.vast !== this.pod) {
            this.currentPodAd = this.currentPodAd.getNextAd();
            if (this.currentPod !== null) {
                return this.currentPodAd.current();
            }
        }

        if (!this.hasSequence()) {
            return null;
        }

        return this.vast.getAdWithSequence(this.sequence + 1).current();
    };

    /**
     * Returns the linear creative element associated with this ad.
     *
     * @returns {?VASTLinear} the linear creative element associated with this ad or
     *   null
     */
    VASTAd.prototype.getLinear = function() {
        return this.linear;
    };

    /**
     * Returns all companion banners associated with this ad.
     *
     * @returns {VASTCompanion[]} all companion banners associated with this ad
     */
    VASTAd.prototype.getCompanions = function() {
        return this.companions;
    };
    /**
     * Returns the companion for the given location id if present, null otherwise
     *
     * @param {string} id The location id to get the companion banner for
     * @returns {?VASTCompanion} the companion banner identified by the given id or
     *   null
     */
    VASTAd.prototype.getCompanion = function(id) {
        for (var i = 0; i < this.companions.length; i++) {
            if (this.companions[i].attribute('id') === id) {
                return this.companions[i];
            }
        }

        return null;
    };
    /**
     * Returns one of "all", "any" or "none" in accordance with the VAST spec
     *
     * @returns {string} all|any|none
     */
    VASTAd.prototype.companionsRequired = function() {
        return this.companionsRequired;
    };


    /**
     * Returns all non-linear creative elements associated with this ad.
     *
     * @returns {VASTNonLinear[]} all non-linear creative elements associated with
     *   this ad
     */
    VASTAd.prototype.getNonLinears = function() {
        return this.nonlinears;
    };
    /**
     * Should be called whenever a trackable event occurs
     *
     * Trackable events in the VAST stack are:
     *   - click
     *   - creativeView
     *   - start
     *   - firstQuartile
     *   - midpoint
     *   - thirdQuartile
     *   - complete
     *   - mute
     *   - unmute
     *   - pause
     *   - rewind
     *   - resume
     *   - fullscreen
     *   - exitFullscreen
     *   - expand
     *   - collapse
     *   - acceptInvitation
     *   - close
     *   - progress
     *   - skip
     *
     * The video player should report these whenever possible, except all the
     * progress events (start, complete, midpoint and *Quartile), which should only
     * be reported for Linear Creative elements according to the positions returned
     * from getTrackingPoints().
     *
     * This function will only do any real work if the reported event actually has a
     * tracking entry in the VAST document
     *
     * @param {string} ev The event type to report
     * @param {number} position The number of seconds into ad playback where the
     *   event occured
     * @param {string} asset The asset URI being played
     */
    VASTCreative.prototype.track = function(ev, position, asset) {
        this.tracking.track(ev, {
            "CONTENTPLAYHEAD": this.timecodeToString(position),
            "ASSETURI": asset
        });
    };
    /**
     * Takes a timestamp and returns it as a timecode string HH:MM:SS
     *
     * @param {number} time Timestamp in seconds
     * @returns {string} Timestamp as timecode
     */
    VASTCreative.prototype.timecodeToString = function(time) {
        var hrs = '0' + parseInt(time/3600, 10);
        var mts = '0' + parseInt((time % 3600)/60, 10);
        var scs = '0' + time % 60;
        var str = hrs + ':' + mts + ':' + scs;
        return str.replace(/(^|:|\.)0(\d{2})/g, "$1$2");
    };

    /**
     * Takes a string and returns it as a number of seconds if it is a timecode,
     * otherwise just returns the string (XX% for example)
     *
     * @param {string} time Timecode
     * @returns {number|string} Timecode in seconds or input string
     */
    VASTCreative.prototype.timecodeFromString = function(time) {
        if (time.indexOf(':') === -1) {
            return time;
        }

        return parseInt(time.substr(0,2), 10) * 3600 +
            parseInt(time.substr(3,2), 10) * 60 +
            parseInt(time.substr(6,2), 10);
    };

    /**
     * Returns the URL to send the user to if this creative is clicked
     *
     * @returns {?string} URL to send the user to or null if none has been set
     */
    VASTCreative.prototype.getClickThrough = function() {
        return this.clickThrough;
    };

    /**
     * Returns the value of the given attribute for the creative
     *
     * See the VAST spec for what attributes may be present on the different types
     * of creatives
     *
     * Handles any timecode attribute as a timecode and converts it to a number
     *
     * @param {string} name The attribute name
     * @param {*} [nothing] Value to return if attribute isn't present. Defaults to
     *   undefined
     * @returns {?string} The value for that attribute for this creative or default
     *   if unset
     */
    VASTCreative.prototype.attribute = function(name, nothing) {
        // TODO: attributes should be merged when augmented
        if (!this.root.hasAttribute(name)) {
            return nothing;
        }

        var attr = this.root.getAttribute(name);
        switch (name) {
            case 'skipoffset':
            case 'duration':
            case 'offset':
            case 'minSuggestedDuration':
                attr = this.timecodeFromString(attr);
        }
        return attr;
    };

    VASTLinear.prototype = Object.create(VASTCreative.prototype);
    /**
     * Returns the duration for this linear creative, or null if not set
     *
     * @returns {?number} The duration of this linear in seconds, null otherwise
     */
    VASTLinear.prototype.getDuration = function() {
        return this.duration;
    };

    /**
     * Returns a new, but identical VASTLinear object pointing to the given ad
     *
     * @param {VASTAd} ad The ad holding the copy of this creative
     */
    VASTLinear.prototype.copy = function(ad) {
        return new VASTLinear(ad, this.root);
    };
    /**
     * Adds the tracking events and creative elements found in the given VASTLinear
     * record to those currently in this creative
     *
     * @param {VASTLinear} other VASTLinear object to merge into this one
     */
    VASTLinear.prototype.augment = function(other) {
        this.duration = other.duration || this.duration;
        this.mediaFiles = other.mediaFiles.slice(0) || this.mediaFiles.slice(0);
        this.tracking.augment(other.tracking);
        this.clickThrough = other.clickThrough || this.clickThrough;
    };

    /**
     * Returns all media files associated with this linear so the caller can decide
     * which one to play
     *
     * Each object in the returned list contains a "src" attribute, as well as any
     * of the following attributes:
     *   - delivery
     *   - type
     *   - bitrate
     *   - minBitrate
     *   - maxBitrate
     *   - width
     *   - height
     *   - scalable
     *   - maintainAspectRatio
     *   - codec
     *   - src
     * according to the VAST specification.
     *
     * @returns {object[]} a list of media files for this linear
     */
    VASTLinear.prototype.getAllMedias = function() {
        return this.mediaFiles;
    };
    /**
     * This methods makes a best guess at what media file to choose for this linear
     * based on the given target parameters. The target object should contain the
     * width and height of the video player, as well as a target bitrate if
     * applicable. If no bitrate is given, the highest bitrate is chosen, otherwise
     * the closest bitrate is chosen.
     *
     * @param {{width: number, height: number, ?bitrate: number}} target The target
     *   video settings
     * @returns {?object} a single media file with the properties given for each
     *   object in getAllMedias() or null if no media file is available
     */
    VASTLinear.prototype.getBestMedia = function(target) {
        var best = Number.POSITIVE_INFINITY;
        var besti = -1;
        for (var i = 0; i < this.mediaFiles.length; i++) {
            var media = this.mediaFiles[i];
            // Root of the sum of the squares seems as good a mesure as any for a
            // two-dimensional distance. Pythagoras FTW!
            var distance = Math.sqrt(
                Math.pow(target["width"] - media["width"], 2) +
                Math.pow(target["height"] - media["height"], 2)
            );

            if (distance < best) {
                best = distance;
                besti = i;
            } else if (distance === best) {
                // If the two files are equally close to the target resolution, use
                // bitrate as the pivot. Has bitrate > closer to target bitrate > highest
                // bitrate
                var other = this.mediaFiles[besti];
                var otherBR = other["bitrate"] || other["maxBitrate"];
                var mediaBR = media["bitrate"] || media["maxBitrate"];

                if (mediaBR && !otherBR) {
                    besti = i;
                } else if (target["bitrate"] && otherBR && mediaBR) {
                    if (Math.abs(mediaBR - target["bitrate"]) < Math.abs(otherBR - target["bitrate"])) {
                        besti = i;
                    }
                } else if (mediaBR > otherBR) {
                    besti = i;
                }
            }
        }

        if (besti === -1) {
            return null;
        }
        return this.mediaFiles[besti];
    };
    /** @const **/
    var VAST_LINEAR_TRACKING_POINTS = ['start',
        'firstQuartile',
        'midpoint',
        'thirdQuartile',
        'complete',
        'progress',
        'skip'
    ];
    /**
     * Returns a list of positions in the playback of this ad when track() should be
     * called. Each position is an object containing a position (either a percentage
     * into the clip given by a number suffixed with %, an absolute number of
     * seconds or one of the strings "start" or "end") and an event name. When the
     * given position is reached in the playback of the ad, VASTAd.track() should be
     * called giving the event name and the current playback position in absolute
     * number of seconds.
     *
     * Note that this function will include points for the start, complete,
     * firstQuartile, midpoint and thirdQuartile events, so these need not be
     * explicitly added. There MAY be multiple events with the same offset, in which
     * case track must be called for each one with their respective event names.
     *
     * The list will only include points that the VAST response explicitly request
     * tracking for.
     */
    VASTLinear.prototype.getTrackingPoints = function() {
        var events = this.tracking.getEventsOfTypes(VAST_LINEAR_TRACKING_POINTS);
        var points = [];

        var duration = null;
        if (typeof this.duration !== 'undefined' && this.duration) {
            duration = this.duration;
        }

        for (var i = 0; i < events.length; i++) {
            var point = {"event": events[i]["event"], "offset": null, "percentOffset": null};
            var offset;
            switch (events[i]["event"]) {
                case "start":
                    point["percentOffset"] = "0%";
                    point["offset"] = 0;
                    break;
                case "firstQuartile":
                    point["percentOffset"] = "25%";
                    if (duration) {
                        point["offset"] = duration * 0.25;
                    }
                    break;
                case "midpoint":
                    point["percentOffset"] = "50%";
                    if (duration) {
                        point["offset"] = duration * 0.5;
                    }
                    break;
                case "thirdQuartile":
                    point["percentOffset"] = "75%";
                    if (duration) {
                        point["offset"] = duration * 0.75;
                    }
                    break;
                case "complete":
                    point["percentOffset"] = "100%";
                    if (duration) {
                        point["offset"] = duration;
                    }
                    break;
                case "skip":
                    offset = this.attribute('skipoffset', 0);
                    if(offset.indexOf('%') === -1) {
                        point["offset"] = VASTCreative.prototype.timecodeFromString(offset);
                        if (duration) {
                            point["percentOffset"] = (point["offset"] / duration * 100) + "%";
                        }
                    } else {
                        point["percentOffset"] = offset;
                        if (duration) {
                            point["offset"] = duration * parseInt(point["percentOffset"], 10) / 100;
                        }
                    }
                    break;
                default:
                    // progress-...
                    offset = events[i]["offset"];
                    if (!offset) {
                        continue;
                    }
                    if (offset === "start") {
                        offset = '0%';
                    }
                    if (offset === "end") {
                        offset = '100%';
                    }

                    if(offset.indexOf('%') === -1) {
                        point["offset"] = VASTCreative.prototype.timecodeFromString(offset);
                        if (duration) {
                            point["percentOffset"] = (point["offset"] / duration * 100) + "%";
                        }
                    } else {
                        point["percentOffset"] = offset;
                        if (duration) {
                            point["offset"] = duration * parseInt(point["percentOffset"], 10) / 100;
                        }
                    }
            }
            points.push(point);
        }

        points.sort(function(a, b) {
            if (a["offset"] && b["offset"]) {
                return a["offset"] - b["offset"];
            } else if (a["percentOffset"] && b["percentOffset"]) {
                return parseInt(a["percentOffset"], 10) - parseInt(b["percentOffset"], 10);
            }

            return 0;
        });

        return points;
    };
    VASTStatic.prototype = Object.create(VASTCreative.prototype);
    /**
     * Adds the tracking events and creative elements found in the given
     * VASTCompanion record to those currently in this creative
     *
     * @param {VASTCompanion} other VASTCompanion object to merge into this one
     */
    VASTStatic.prototype.augment = function(other) {
        this.tracking.augment(other.tracking);
        this.clickThrough = other.clickThrough || this.clickThrough;
        this.resources["iframe"] = other.resources["iframe"] || this.resources["iframe"];
        this.resources["html"] = other.resources["html"] || this.resources["html"];
        for (var t in other.resources["images"]) {
            if (other.resources["images"].hasOwnProperty(t)) {
                this.resources["images"][t] = other.resources["images"][t];
            }
        }
    };
    /**
     * Returns all resources associated with this creative.
     *
     * @returns {{?iframe: string, ?html: string, ?images}} an object representing
     *   each of the possible resources that can be used to render this creative.
     *   The iframe and html indexes have their respective URLs as values, whereas
     *   images is a list of object, each with a src and type attribute
     */
    VASTStatic.prototype.getAllResources = function() {
        return this.resources;
    };
    /**
     * Extracts and handles ClickThrough and ClickTracking elements
     *
     * @param {string} prefix The prefix for the XML elements
     */
    VASTStatic.prototype.extractClicks = function(prefix) {
        var el;
        el = this.root.getElementsByTagName(prefix + "ClickThrough");
        if (el.length) {
            this.clickThrough = el.item(0).textContent.replace(/\s/g, "");
        }

        el = this.root.getElementsByTagName(prefix + "ClickTracking");
        if (el.length) {
            this.tracking.addClickTracking(el.item(0).textContent.replace(/\s/g, ""));
        }
    };
    VASTCompanion.prototype = Object.create(VASTStatic.prototype);
    /**
     * Returns a new, but identical VASTCompanion object pointing to the given ad
     *
     * @param {VASTAd} ad The ad holding the copy of this creative
     */
    VASTCompanion.prototype.copy = function(ad) {
        return new VASTCompanion(ad, this.root);
    };

    /**
     * Adds the tracking events and creative elements found in the given
     * VASTCompanion record to those currently in this creative
     *
     * @param {VASTCompanion} other VASTCompanion object to merge into this one
     */
    VASTCompanion.prototype.augment = function(other) {
        VASTStatic.prototype.augment.call(this, other);
        this.altText = other.altText || this.altText;
    };
    /**
     * Returns the alt text given for this creative
     *
     * @returns {string} alternative text for this creative
     */
    VASTCompanion.prototype.getAltText = function() {
        return this.altText;
    };

    VASTNonLinear.prototype = Object.create(VASTStatic.prototype);
    /**
     * Adds the tracking events and creative elements found in the given
     * VASTNonLinear record to those currently in this creative
     *
     * @param {VASTNonLinear} other VASTNonLinear object to merge into this one
     */
    VASTNonLinear.prototype.augment = function(other) {
        VASTStatic.prototype.augment.call(this, other);
    };

    /**
     * Returns a new, but identical VASTNonLinear object pointing to the given ad
     *
     * @param {VASTAd} ad The ad holding the copy of this creative
     */
    VASTNonLinear.prototype.copy = function(ad) {
        return new VASTNonLinear(ad, this.root);
    };
    CYVastPlayer.prototype.loadVMAP = function(url) {
        //this.breaks = [];

        var adHandler = this._onAdBreakFetched.bind(this);
        var server = url;
        // TODO: store VMAP object to track breakpoints regardless of ads
        // This will require changes to _checkForMidroll so it checks *all* breaks,
        // not just those received by _onAdBreakFetched. The index parameter should
        // be used to merge here somehow...
        new VMAP(server, adHandler);

    };
    CYVastPlayer.prototype.loadVAST = function(array) {

        for(var i=0;i<array.length;i++){
            var adds=array[i];
            var onFetched = this._onAdBreakFetched.bind(this, -1, adds[0]);
            queryVAST(adds[1], onFetched);
        }
    }; CYVastPlayer.prototype.log = function log() {
        if (this.debug && console.log && console.log.apply) {
            console.log.apply(console, arguments);
        }
    };
    CYVastPlayer.prototype.logError = function logError() {
        if (console.error && console.error.apply) {
            console.error.apply(console, arguments);
        } else {
            this.log.apply(arguments);
        }
    };
    CYVastPlayer.prototype.setAdsEnabled = function setAdsEnabled(enabled) {
        this.adsEnabled = enabled;
    };
    CYVastPlayer.prototype._onAdBreakFetched = function (i, position, ad) {
        var p = this._changeTimeToMe(position.constructor === Array ?position[this.loadedVast]:position);

        this.breaks.push({
            position: p,
            ad: ad,
            show : false
        });

        if(position.constructor === Array){
            if(this.loadedVast==i){
                this.AmIReady=true;
                this.loadedVast=0;
            }else{

                this.loadedVast++;
            }
        }

    };
    CYVastPlayer.prototype.setVideoProperties = function setVideoProperties(width, height, bitrate) {
        this.requestSettings.width = width;
        this.requestSettings.height = height;
        this.requestSettings.bitrate = bitrate;
    };
    CYVastPlayer.prototype._bindContextForCallbacks = function () {
        this._onAdBreakFetched = this._onAdBreakFetched.bind(this),
            this._showNextAd = this._showNextAd.bind(this),
            this._adsVideoEnd = this._adsVideoEnd.bind(this),
            this._showNonLinear = this._showNonLinear.bind(this),
            this._prepareAdPlayback = this._prepareAdPlayback.bind(this),
            this._AdsEnd = this._AdsEnd.bind(this),
            this.showAds = this.showAds.bind(this),
            this.startAndEnd = this.startAndEnd.bind(this),
            this._timeLineAds = this._timeLineAds.bind(this),
            this._skipAds = this._skipAds.bind(this),
            this.removeAds = this.removeAds.bind(this)
    };
    CYVastPlayer.prototype._showNextAd = function _showNextAd(first) {

        if (first instanceof VASTAd && first !== null && first !== undefined) {
            this.activeAd = first;
        } else if(this.activeAd!==null){
            this.activeAd = this.activeAd.getNextAd();
        }

        if(this.activeAd!==null){
            if (!this.adsEnabled || this.activeAd === null) {
                this.log('no more ads');

                return false;
            }

            if (!this.activeAd.hasData()) {

                return this._showNextAd();
            }

            this.log('showing next ad');

            if (this.activeAd.linear!=null) {
                this.adVideo = this.activeAd.linear.getBestMedia(this.requestSettings);
                this.log('found linear', this.adVideo);
            }

            var companions = this.activeAd.getCompanions();

            for (var i = 0; i < companions.length; i++) {
                var c = companions[i];
            }

            if(this.activeAd.nonlinears!=null){
                if(this.activeAd.nonlinears.length!=0){
                    this._showNonLinear();
                }
            }
            return true;
        }

    };

    CYVastPlayer.prototype._showNonLinear= function _showNonLinear(){

        var itemNon=this.activeAd.nonlinears[0];
        var images=null;
        var clickThrough=null;
        var TrackingEvents=null;
        var HTMLTemp=null;
        var rendered=null;
        var closeBTN=document.createElement("div");
        closeBTN.setAttribute("class","jw-ads-close-btn-nonlinear jw-icon jw-icon-close");
        closeBTN.style.width="24px";
        closeBTN.style.height="24px";
        closeBTN.style.display="block";
        closeBTN.style.cursor="pointer";
        closeBTN.style.position="absolute";
        closeBTN.style.color="#fff";
        closeBTN.style.background="#000";
        closeBTN.style.borderRadius="4px";
        closeBTN.style.border="1px solid #fff";
        closeBTN.style.fontSize="10px";
        closeBTN.style.lineHeight="11px";
        closeBTN.style.left="none";
        closeBTN.style.right="9.6%";
        closeBTN.style.top="-9px";


        addRule(".jw-icon-close:before", {
            top: "5px",
            position: "absolute",
            left: "6px"
        });

        var thats=this.player.getState();
        var that=this;
        closeBTN.addEventListener(clickEvent,function(e){
            this.parentNode.parentNode.removeChild(this.parentNode);
            if(that.player.getState()=="paused"){
                that.player.play();
            }else{

            }

        });

        if(itemNon.clickThrough!=null){
            clickThrough=itemNon.clickThrough;
        }

        if(itemNon.tracking.events!=null){
            TrackingEvents=itemNon.tracking.events;
        }

        this.BannerNonLinear=null;
        if(itemNon.resources.html!=null){
            if(itemNon.resources.html.length!=0){


            }
        }else if(itemNon.resources.iframe!=null){
            if(itemNon.resources.iframe.length!=0){


            }
        }else if(itemNon.resources.images!=null){
            if(itemNon.resources.images.length!=0){
                images=itemNon.resources.images[Object.keys(itemNon.resources.images)[0]];
                HTMLTemp="";
                HTMLTemp+="<img style='width:80%;height:auto;margin-left:10%;margin-right:10%;' src='"+images+"'/>";
            }
        }
        var clicking=function(){
            window.open(clickThrough, '_blank');
        };
        rendered=document.createElement("div");
        rendered.style.direction="ltr";
        rendered.style.width="100%";
        this.BannerCampain.style.direction="ltr";
        rendered.id='ads'+Math.ceil(Math.random()*10000000);
        rendered.appendChild(closeBTN);
        adsTagA=document.createElement("a");
        adsTagA.style.display="block";
        adsTagA.addEventListener("touchstart",clicking);
        if(clickThrough!=null){
            adsTagA.href=clickThrough;
            adsTagA.target="_blank";
        }
        adsTagA.innerHTML=HTMLTemp;
        rendered.appendChild(adsTagA);
        rendered.style.position="absolute";
        rendered.style.bottom="40px";
        //banner max-width is 728px
        rendered.style.maxWidth="728px";
        rendered.style.left="50%";
        rendered.style.transform="translateX(-50%)";
        this.BannerCampain.appendChild(rendered);

        rendered.style.marginLeft="auto";
        rendered.style.marginRight="auto";
        this.BannerCampain.style.textAlign="center";

        if(itemNon.root.attributes["minSuggestedDuration"]!=null && itemNon.root.attributes["minSuggestedDuration"]!=undefined){
            var minSuggestedDuration=this._changeTimeToMe(itemNon.root.attributes["minSuggestedDuration"].nodeValue);

            setTimeout(function(evtt){
                if(closeBTN!=null && closeBTN.parentNode!=null && closeBTN.parentNode.parentNode!=null){
                    closeBTN.parentNode.parentNode.removeChild(closeBTN.parentNode);
                }
            },minSuggestedDuration*1000);
        }

        this.ResizeBanner(null);

        for(var trackEvent in TrackingEvents){

            var Events = TrackingEvents[trackEvent];

            switch (trackEvent){
                case "start":
                    for(var start in Events){
                        this._trackerURL(Events[start].url);

                    }
                    break;

            }
        }

    };
    CYVastPlayer.prototype._trackerURL= function _trackerURL(url){

        var xhttp=null;
        if (window.XMLHttpRequest){
            xhttp=new XMLHttpRequest({mozSystem: true});

        }else{
            xhttp=new ActiveXObject("Microsoft.XMLHTTP");

        }

        xhttp.open("GET",url,false);
        xhttp.send();

    };
    CYVastPlayer.prototype._runAds = function _runAds(insertionPoint, ad) {

        this.requestSettings.insertionPointType = insertionPoint;

        if(insertionPoint == "start") {
        }
        switch (insertionPoint) {
            case 'start':

                ad = null;
                for (var i = 0, l = this.breaks.length; i < l; i++) {

                    if (this.breaks[i].position === insertionPoint) {
                        ad = this.breaks[i].ad.ads[0];
                        if(this.breaks[i].ad.ads[0].linear!=null){
                            if(this.breaks[i].ad.ads[0].linear.length!=0){

                                this._prepareAdPlayback(ad);
                                this.lastPlayedMidroll=i;

                                return ;


                            }
                        }
                        break;
                    }

                }
                break;
            case 'end':

                for (var i = 0, l = this.breaks.length; i < l; i++) {

                    if (this.breaks[i].position === "end") {
                        ad = this.breaks[i].ad.ads[0];
                        this._prepareAdPlayback(ad);
                        this.lastPlayedMidroll=i;




                        break;
                    }

                }

                break;
            case 'position':
                ad =  ad.ad.ads[0];
                if(ad.linear!=null){
                    if(ad.linear.length!=0){
                        this._prepareAdPlayback(ad);
                        return;
                    }
                }
                break;
        }

        this._showNextAd(ad);


    };
    CYVastPlayer.prototype._prepareAdPlayback = function _prepareAdPlayback(ad){
        var video = document.querySelector("video");
        if(this.player.getState()=="playing"){
            this.player.pause();
            // fallback for fullscreen in iphone
            window.setTimeout(function() {
                if (video.webkitDisplayingFullscreen) {
                    video.webkitExitFullscreen();
                }
            },1500)


        }

        if(this.onAds==true){
            return;
        }

        this.player.getContainer().setAttribute("class",this.player.getContainer().getAttribute("class")+" jw-flag-ads");

        this.onAds=true;
        this.Skipable=false;

        var vr=this.player.getContainer().querySelector("#VR");
        if(vr!=null){
            vr.style.position="absolute";
        }

        html=this.player.getContainer();

        this.player.setControls(false);

        var mediaFile=ad.linear.mediaFiles[0];
        var currentDuration=ad.duration;

        this.activeAd=ad;

        var Skip = document.createElement("div");

        Skip.setAttribute("class","jw-ads-skip");

        Skip.style.background = "rgba(0, 0, 0, 0.7) none repeat scroll 0 0";
        Skip.style.display = "table";
        Skip.style.position = "absolute";
        Skip.style.left = "0";
        Skip.style.bottom = "30px";
        Skip.style.textAlign = "center";
        Skip.style.direction = "rtl";
        Skip.style.color = "#ffffff";
        Skip.style.borderTop = "1px solid #b6b6b6";
        Skip.style.borderRight = "1px solid #b6b6b6";
        Skip.style.borderBottom = "1px solid #b6b6b6";
        Skip.style.fontSize = "13px";
        Skip.style.fontFamily = "Tahoma, Arial, Helvetica, sans-serif";
        Skip.style.padding = "12px 30px 17px 30px";
        Skip.style.zIndex="999999";

        function hoverSkip() {
            Skip.style.background = "rgba(0, 0, 0, 0.9) none repeat scroll 0 0";
        }
        function unHoverSkip() {
            Skip.style.background = "rgba(0, 0, 0, 0.7) none repeat scroll 0 0";
        }

        Skip.onmouseout  = unHoverSkip;
        Skip.onmouseover = hoverSkip;


        this.adPlayerTimeLine=document.createElement("div");
        this.adPlayerTimeLine.setAttribute("class","jw-ads-timeline");
        this.adPlayerTimeLine.style.width="0%";
        this.adPlayerTimeLine.style.height="4px";
        this.adPlayerTimeLine.style.position="absolute";
        this.adPlayerTimeLine.style.backgroundColor="#f3bc36";
        this.adPlayerTimeLine.style.bottom="0";
        this.adPlayerTimeLine.style.zIndex="999999";

        Skip.addEventListener(clickEvent, this._skipAds);


        this.skip=Skip;

        var clickThrough=ad.linear.clickThrough;
        thatclick=this;


        var clicking=function(){
            if(clickThrough!=""){
                if(mediaFile.type.indexOf("video")>-1){
                    thatclick.adPlayer.play();
                    window.open(clickThrough, '_blank');
                    clickThrough="";
                }else{
                    window.open(clickThrough, '_blank');
                }
            }else{
                if(mediaFile.type.indexOf("video")>-1){
                    thatclick.adPlayer.play();
                }
                return false;
            }
        };
        this.adsPlayerZone=document.createElement("div");
        this.adsPlayerZone.style.position="absolute";
        this.adsPlayerZone.style.display="block";
        this.adsPlayerZone.style.background="#000";
        this.adsPlayerZone.style.width="100%";
        this.adsPlayerZone.style.height="100%";
        this.adsPlayerZone.style.zIndex="999998";
        this.adsPlayerZone.id="adsPlayer"+parseInt(Math.random()*10000000);
        this.video.parentNode.appendChild(this.adsPlayerZone);
        html.querySelector(".jw-preview ").style.display="none";

        if(mediaFile.type== null || mediaFile.type.indexOf("video")>-1){
            this.adPlayer=jwplayer(this.adsPlayerZone.id);
            this.adPlayer.setup({
                playlist: [{
                    sources:[{
                        file:mediaFile.src,
                        type:"video/mp4"
                    }],
                }],
                aspectratio: "16:9",
                stretching:'uniform',
                primary: "html5",

                autostart: true,
                width:"100%",
                height:"100%"
            });

            this.adPlayer.on("error",this._AdsEnd);

            this.adPlayer.setControls(true);

            that=this;

            this.adPlayer.on("ready",function(){
                var adscontentPlayer = that.adPlayer.getContainer();

                adscontentPlayer.querySelector(".jw-video").style.cursor="pointer";
                adscontentPlayer.style.display="block";
                adscontentPlayer.appendChild(that.adPlayerTimeLine);
                adscontentPlayer.parentNode.appendChild(that.skip);
                adscontentPlayer.addEventListener(clickEvent,clicking);


            });



        }else if(mediaFile.type != null && (mediaFile.type.indexOf("image")>-1 || mediaFile.type.indexOf("iframe")>-1 || mediaFile.type.indexOf("html")>-1)){

            this.adPlayer=new CYplayer(mediaFile.type,mediaFile.src , clickThrough);
            this.adPlayer.setDuration(ad.linear.duration);
            var globalDuration;
            window.globalDuration = ad.linear.duration;
            this.adsPlayerZone.appendChild(this.adPlayer.Media);
            this.adPlayer.Media.parentNode.parentNode.appendChild(this.adPlayerTimeLine);
            this.adPlayer.Media.parentNode.parentNode.appendChild(this.skip);
            this.adsPlayerZone.addEventListener("touchstart", clicking);
            this.adPlayer.play();
            this.adPlayer.setSize();
        }

        this.adPlayer.onTime(this._timeLineAds);
        this.adPlayer.onComplete(this._AdsEnd)

        if(this.activeAd.linear.root.getAttribute("skipOffset")!=null){
            var timeSkip = this._changeTimeToMe(this.activeAd.linear.root.getAttribute("skipOffset"));
        }else{
            var timeSkip = parseInt(this.adPlayer.getDuration());
        }


        timeSkip = timeSkip + "ثانیه تا پایان آگهی بازگانی";
        Skip.innerHTML=timeSkip;

    };
    CYVastPlayer.prototype._skipAds = function _skipAds(evt){

        if(this.Skipable==false){
            return ;
        }
        if(this.onAds==false){
            return;
        }
        this.player.getContainer().setAttribute("class",this.player.getContainer().getAttribute("class").replace(" jw-flag-ads",""));
        mediaFile = this.activeAd.linear.mediaFiles[0];

        if(mediaFile.type == null || mediaFile.type.indexOf("video")>-1){

            var adscontentPlayer = this.adPlayer.getContainer();

            adscontentPlayer.style.display="none";
            this.adPlayer.remove();

        }else if(mediaFile.type != null && (mediaFile.type.indexOf("image")>-1 || mediaFile.type.indexOf("iframe")>-1 || mediaFile.type.indexOf("html")>-1)){

            this.adPlayer.Media.parentNode.parentNode.removeChild(this.adPlayerTimeLine);
            this.adPlayer.stop();

        }

        this.skip.parentNode.removeChild(this.skip);
        delete this.adPlayer;
        this.adsPlayerZone.parentNode.removeChild(this.adsPlayerZone);
        delete this.adsPlayerZone;
        delete this.skip;
        this.onAds=false;
        this.TrackingEvent.start = false;
        this.TrackingEvent.firstQuartile = false;
        this.TrackingEvent.midpoint = false;
        this.TrackingEvent.thirdQuartile = false;
        this.TrackingEvent.compelete = false;
        var vr=this.player.getContainer().querySelector("#VR");
        if(vr!=null){
            vr.style.position="";
        }

        if(this.player.getState()!="playing"){
            this.player.play();
        }

        this.player.setControls(true);

        var thisVideo = document.getElementById(this.player.id);

        this.breaks[this.lastPlayedMidroll].show=true;
        that=this;
        setTimeout(function(){
            flag=false;
            for (var i = 0, l = that.breaks.length; i < l; i++) {
                if (
                    that.breaks[i].position === that.breaks[that.lastPlayedMidroll].position &&
                    that.breaks[i].show === false
                ) {
                    ad = that.breaks[i].ad.ads[0];
                    if(that.breaks[i].ad.ads[0].linear!=null){
                        if(that.breaks[i].ad.ads[0].linear.length!=0){
                            that._prepareAdPlayback(ad);
                            that.lastPlayedMidroll=i;
                            flag=true;
                            break;
                        }
                    }

                }
            }
            if(flag==false){
                if(that.player.getState()=="paused"){
                    that.player.play();
                }
            }
        },300);

    };
    CYVastPlayer.prototype._AdsEnd = function _AdsEnd(){
        this.Skipable=true;
        this._skipAds();
        var Event=this.activeAd.linear.tracking.events;

        if(Event.complete!=undefined){

            for(var i=0 ;i<Event.complete.length;i++){
                var iframeElement = document.createElement('iframe');
                iframeElement.setAttribute("width", "0");
                iframeElement.setAttribute("height", "0");
                iframeElement.setAttribute("scrolling", "no");
                iframeElement.setAttribute("allowtransparency", "true");
                iframeElement.setAttribute("hspace", "0");
                iframeElement.setAttribute("vspace", "0");
                iframeElement.setAttribute("marginheight", "0");
                iframeElement.setAttribute("marginwidth", "0");
                iframeElement.setAttribute("src", Event.complete[i].url);
                document.body.appendChild(iframeElement);
                window.setTimeout(function() {
                    iframeElement.remove();
                },10000)
                // this._trackerURL(Event.complete[i].url);
            }
            this.TrackingEvent.complete = false;
        }
    };
    CYVastPlayer.prototype._timeLineAds = function _timeLineAds(){

        if(this.player.getState()!="paused"){
            this.player.pause();
        }
        if(this.onAds){
            var jack=parseFloat((this.adPlayer.getPosition()/this.adPlayer.getDuration())*100);
            var Event=this.activeAd.linear.tracking.events;
            this.adPlayerTimeLine.style.width=jack+"%";
            this.adPlayerTimeLine.style.width=setInterval+"%";

            var posOfAds=this.adPlayer.getPosition();

            if(this.skip!=null){
                var timeSkip=(this.activeAd.linear.root.getAttribute("skipOffset")!=null?this._changeTimeToMe(this.activeAd.linear.root.getAttribute("skipOffset")):parseInt(this.adPlayer.getDuration()));
                if(timeSkip<posOfAds){
                    this.Skipable=true;
                    var skipIcon = '<svg style="position: relative; left: 5px; top: 4px" width="16" height="16" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><polygon fill="#fff" points="2,2 28,16 2,30"/><rect fill="#fff" height="28" width="4" x="26" y="2"/></svg>';
                    this.skip.innerHTML=skipIcon + "نمی بینم";
                    this.skip.setAttribute("class",this.skip.getAttribute("class")+" jw-icon jw-icon-skip-forward");
                    this.skip.style.cursor = "pointer";
                }else{
                    this.skip.innerHTML=timeSkip-parseInt(posOfAds) + "  " + "ثانیه تا پایان آگهی بازرگانی";

                }
            }
            if(Event.start!=null){
                if(this.TrackingEvent.start==undefined || this.TrackingEvent.start==null || this.TrackingEvent.start==false){
                    this.TrackingEvent.start = true;
                    for(var i=0 ;i<Event.start.length;i++){
                        this._trackerURL(Event.start[i].url);
                    }
                }

            }

            if(jack>25 && this.TrackingEvent.firstQuartile == false && this.TrackingEvent.firstQuartile!==undefined){

                this.TrackingEvent.firstQuartile = true;
                if(Event.firstQuartile!=null){
                    for(var i=0 ;i<Event.firstQuartile.length;i++){
                        this._trackerURL(Event.firstQuartile[i].url);
                    }
                }

            }else if(jack>50 && this.TrackingEvent.midpoint == false && this.TrackingEvent.midpoint!==undefined){

                this.TrackingEvent.midpoint=true;
                if(Event.midpoint!=null){
                    for(var i=0 ;i<Event.midpoint.length;i++){
                        this._trackerURL(Event.midpoint[i].url);
                    }
                }

            }else if(jack>75 && this.TrackingEvent.thirdQuartile == false && this.TrackingEvent.thirdQuartile!==undefined){

                this.TrackingEvent.thirdQuartile=true;
                if(Event.thirdQuartile!=null){
                    for(var i=0 ;i<Event.thirdQuartile.length;i++){
                        this._trackerURL(Event.thirdQuartile[i].url);
                    }
                }
            }

        }

    };
    CYVastPlayer.prototype._changeTimeToMe = function _changeTimeToMe(time) {
        var temp=time.split(":");
        if(temp.length == 1){
            result=time;
        }else{
            result=parseInt(temp[0])*3600+parseInt(temp[1])*60+parseInt(temp[2]);
        }
        return result;
    };
    CYVastPlayer.prototype._adsVideoEnd = function _adsVideoEnd() {
        this._release();
        this.adPlaying = false;
        this.player.play();

    };
    CYVastPlayer.prototype.showAds = function showAds(evt){
        if (this.adPlaying) {
            return false;
        }
        if (this.breaks.length === 0) {
            return false;
        }
        var potentialMidroll = null;

        for (var i = -1, l = this.breaks.length-1; i < l; l--) {

            if(parseInt(this.breaks[l].position)!== NaN){

                if (this.breaks[l].position == parseInt(this.player.getPosition()) && this.IntCurrentTime!=parseInt(this.player.getPosition())) {

                    potentialMidroll = l;


                    break;
                }

            }
        }


        if(this.IntCurrentTime!= parseInt(this.player.getPosition())){
            this.IntCurrentTime=parseInt(this.player.getPosition());

        }

        if (potentialMidroll !== null && this.breaks[potentialMidroll].show==false) {
            this.lastPlayedMidroll = potentialMidroll;
            this._runAds('position', this.breaks[potentialMidroll]);
            this.breaks[potentialMidroll].show=true;
            return true;
        }
        return false;
    };
    CYVastPlayer.prototype.startAndEnd= function startAndEnd(evt){
        switch(evt.type){
            case "start":
                break;
            case "beforePlay":

                break;
            case "play":
                if(this.startedYet==false){
                    this._runAds("start");
                    this.startedYet=true;
                }
                break;
            case "complete":

                this._runAds("end");
                window.setInterval(function (e) {
                    document.querySelector("video").pause();
                    jwplayer().stop(); // remove this if you want repeat the video
                }, window.globalDuration);


                break;

            default:
                // console.log(evt);
                break;
        }
    };
    CYVastPlayer.prototype.watchPlayer = function watchPlayer(videoElement) {
        this.player = videoElement;
        this.hasShownPreroll = false;
        this.hasShownPostroll = false;
        this.player.onTime(this.showAds);
        this.player.onPlay(this.startAndEnd);
        this.player.onComplete(this.startAndEnd);
        this.player.onResize(this.ResizeBanner);
        var that=this;


        return true;
    };
    CYVastPlayer.prototype.removeAds = function (){

        this.player.off("time",this.showAds);
        this.player.off("play",this.startAndEnd);
        this.player.off("complete",this.startAndEnd);
        this.player.off("resize",this.ResizeBanner);

    };
    CYVastPlayer.prototype.setAdZone = function adsZone(video,banner) {
        this.BannerCampain=banner;
        this.video=video;
        return true;
    };
    if (typeof Function.prototype.bind === 'undefined') {
        Function.prototype.bind = function () {
            var __method = this, args = Array.prototype.slice.call(arguments), object = args.shift();
            return function () {
                var local_args = args.concat(Array.prototype.slice.call(arguments));
                if (this !== window) {
                    local_args.push(this);
                }
                return __method.apply(object, local_args);
            };
        };
    };
    (function(jwplayer){

        var Plugin = function(player, config, div) {

            function setup(evt) {
                playermain=player;

                html=player.getContainer();
                video=html.querySelector(".jw-video");
                var conf=player.getConfig();
                var adsTemp=null;
                if(player.getPlaylistItem().advertising!==undefined && player.getPlaylistItem().advertising!==null){

                    adsTemp=player.getPlaylistItem().advertising;
                }else if(conf.advertising !== null){
                    adsTemp=conf.advertising;
                } else {

                    return;
                }

                if(adsTemp!=null && adsTemp!=""){
                    ads = new CYVastPlayer(false);
                    var flag=0;
                    if(adsTemp.schedule!==undefined && adsTemp.schedule!==null){
                        ads.loadVMAP(adsTemp.schedule);
                        flag++;
                    }
                    if(adsTemp.arms!==undefined && adsTemp.arms!==null){
                        ads.loadArms(adsTemp.arms);
                        flag++;
                    }

                    if(adsTemp.vasts!==undefined && adsTemp.vasts!==null){
                        ads.loadVAST(adsTemp.vasts);
                        flag++;
                    }

                    if(flag!=0){

                        div.style.display="block";

                        videoOverlay=document.createElement("div");
                        videoOverlay.style.position="absolute";
                        videoOverlay.style.width="100%";
                        videoOverlay.style.height="100%";

                        video.parentNode.appendChild(videoOverlay);
                        ads.setVideoProperties(player.getWidth(), player.getHeight());
                        ads.watchPlayer(playermain);
                        ads.setAdZone(video,videoOverlay);
                    }
                }

            };

            function onPlaylistItemChange(evt){
                if(player.getPlaylistIndex()==0)
                    return ;
                if(videoOverlay!=null){
                    video.parentNode.removeChild(videoOverlay);
                    ads.removeAds();
                    delete ads;
                    delete playermain;
                }
                setup();
            };

            player.onPlaylistItem(onPlaylistItemChange);
            player.onReady(setup);

        };
        var PluginDetail={
            name:"vastAD",
            version:"1.0"
        };

        var minPlayerVersion = "7.0";
        var pluginName = 'vastAD';

        jwplayer().registerPlugin(pluginName,minPlayerVersion, Plugin);

    })(jwplayer);

}
