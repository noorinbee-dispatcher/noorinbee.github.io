function pannedLayerSet() {

    this._holdSet = [];
    this._setIsLoading = false;
    this._setStack = {};

    this.onmap = null;
    this.attached = false;
    this.active = false;

    this.zoomSnap = 12;
    this.zoomHandler = false;
}

pannedLayerSet.prototype.suspendSet = function () {
    this.dropSet();
    this.active = false;
}

pannedLayerSet.prototype.restoreSet = function () {
    if (!this.attached) { return; }
    this.active = true;
    this.builtSetCallback(this);
}

pannedLayerSet.prototype.attachSet = function (mymap, makeActive) {
    var self = this;
    if (self.onmap !== self.mymap) {
        self.dropSet();
        self.attached = false;
    }
    self.onmap = mymap;
    self.active = (typeof (makeActive) !== 'undefined') ? makeActive : true;
    if (!self.attached) {
        self.buildCustomSet();
        self.onmap.on('zoomend', function (e) {
            self.applySetLoader();
        });
        self.onmap.on('moveend', function (e) {
            self.applySetLoader();
        });
        self.attached = true;
    }
}

pannedLayerSet.prototype.buildCustomSet = function () {
    var self = this;
    self.applySetLoader();
}

pannedLayerSet.prototype.applySetLoader = function () {
    if ((!this.isInZoomRange()) && this._holdSet) {
        this.dropSet();
        return;
    }
        if (!this.active) { return; }
    if (this.isInZoomRange()) {
            if (!this._setIsLoading) {
            this._setIsLoading = true;
            this.buildLayeredSet();
            for (i = 0; i < this._holdSet.length; i++) {
                removeOverlay(this._holdSet[i].layer);
            }
        }
    }
}

pannedLayerSet.prototype.isInZoomRange = function () {
    return (this.onmap.getZoom() > this.zoomSnap);
}

pannedLayerSet.prototype.dropSet = function () {
    if (!this._holdSet) { return; }
    for (i = 0; i < this._holdSet.length; i++) {
        this.onmap.removeLayer(this._holdSet[i].layer);
        removeOverlay(this._holdSet[i].layer);
    }
    this._holdSet = [];
}

pannedLayerSet.prototype.freshenSet = function () {
    if (!this.isInZoomRange() || !this.active) {
        return;
    }
    for (i = 0; i < this._holdSet.length; i++) {
        if (!this._holdSet[i].controlled) {
           this._holdSet[i].layer.addTo(this.onmap);
        }

    }
}

pannedLayerSet.prototype.isSetLoaded = function (self) {
    var gettingSet = Object.keys(self._setStack);
    for (i = 0; i < gettingSet.length; i++) {
        if (!self._setStack[gettingSet[i]].loaded) {
            return false;
        }
    }
    self._setIsLoading = false;
    return true;
}

pannedLayerSet.prototype.builtSetCallback = function (self) {
    if (!self.isSetLoaded(self)) {
        return false;
    }

    var gotSet = Object.keys(self._setStack);
    var newHoldSet = [];
    console.log(getOverlays());

    for (i = 0; i < gotSet.length; i++) {
        var addin = { layer: null, show: null, controlled: null };
        addin.added = self._setStack[gotSet[i]].added;
        addin.controlled = self._setStack[gotSet[i]].controlled;        
        addin.layer = self._setStack[gotSet[i]].layer;
        newHoldSet.push(addin);
    }
    console.log(self._setStack);
    self.dropSet();
    Object.assign(self._holdSet, newHoldSet);
    console.log(self._holdSet);
    self.freshenSet();
    return true;
}

pannedLayerSet.prototype.waitOnLayer = function (layer) {
    this._setIsLoading = true;
    this._setStack[layer] = { loaded: false, layer: null, controlled: null };

    var self = this;
    var addLayerToSet = function (lyr, status) {
        self._setStack[layer].loaded = status.loaded;
        self._setStack[layer].added = status.added;
        self._setStack[layer].controlled = status.controlled;
        self._setStack[layer].layer = lyr;
        self.builtSetCallback(self);
    };

    return addLayerToSet;
}


pannedLayerSet.prototype.buildLayeredSet = function () {

    //getGeojson(URL, theMap, styleUI, addto, listed, transform, this.waitOnLayer("myLayerToAdd"));

}
