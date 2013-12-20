(function() {
  "use strict";
  requirejs.config({
    urlArgs: Math.random(),
    baseUrl: "../vendor/halal/js/",
    paths: {
      "jquery": "../../../vendor/jquery/jquery.min",
      "jquery-ui": "../../../../../../vendor/jquery-ui/ui/minified/jquery-ui.min",
      "handlebars": "../../../vendor/handlebars/handlebars.min"
    },
    shim: {
      "jquery-ui": {
        exports: "$",
        deps: ['jquery']
      }
    }
  });

<<<<<<< HEAD
  require(["halal", "../../../js/IsometricMap", "../../../js/MetaConfig"], function(Hal, IsometricMap, MetaConfig) {
=======
  require(["halal", "../../../js/IsometricMap"], function(Hal, IsometricMap) {
>>>>>>> 76755d0220628a714cc687838ff47226da3c06d7
    llog.setLevel("DEBUG");
    llogi("Halal loaded");
    Hal.asm.loadViaSocketIO();
    return Hal.asm.on("SPRITES_LOADED", function() {
      return require(["../../../js/MapEditor"], function(MapEditor) {
        var isomap;
        llogi("MapEditor loaded");
        isomap = new IsometricMap({
          name: "Amjad",
          tilew: 128,
          tileh: 64,
          rows: 30,
          cols: 100,
          bg_color: "gray",
          draw_camera_center: true,
          draw_quadspace: false,
          draw_stat: true,
          mask: Hal.asm.getSprite("editor/tilemask_128x64"),
<<<<<<< HEAD
          max_layers: MetaConfig.MAX_LAYERS
=======
          max_layers: 6
>>>>>>> 76755d0220628a714cc687838ff47226da3c06d7
        });
        isomap.pause();
        Hal.addScene(isomap);
        Hal.trigger("MAP_ADDED", isomap);
        isomap.pause();
        return isomap.on("MAP_TILES_INITIALIZED", function() {
          var center, name,
            _this = this;
          center = this.worldCenterTile();
          name = center.row + "_" + center.col;
          return Hal.Ajax.get("assets/map/" + name, function(map) {
            var arr;
            arr = new Array();
            map.split(",").forEach(function(t) {
              return arr.push(+t);
            });
            return isomap.loadBitmapMap(arr);
          }, function() {
            return console.error("Error loading map " + name);
          }, function() {
            isomap.resume();
            Hal.fadeInViewport(1000);
            return Hal.debug(true);
          });
        });
      });
    });
  });

}).call(this);
