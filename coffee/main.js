(function() {
  "use strict";
  requirejs.config({
    urlArgs: Math.random(),
    baseUrl: "js",
    paths: {
      "jquery": "../vendor/jquery/jquery.min",
      "jquery-ui": "../vendor/jquery-ui/ui/minified/jquery-ui.min",
      "handlebars": "../vendor/handlebars/handlebars.min",
      "halal": "../vendor/halal/build/halal"
    },
    shim: {
      "jquery-ui": {
        exports: "$",
        deps: ['jquery']
      }
    }
  });

  require(["IsometricMap"], function(IsometricMap) {
    llog.setLevel("DEBUG");
    llogi("Halal loaded");
    Hal.asm.loadSpritesFromFileList("assets/sprites.list");
    return Hal.asm.on("SPRITES_LOADED", function() {
      return require(["MapEditor"], function(MapEditor) {
        var isomap,
          _this = this;
        llogi("MapEditor loaded");
        isomap = new IsometricMap({
          name: "Amjad",
          tilew: 128,
          tileh: 64,
          rows: 30,
          cols: 200,
          bg_color: "gray",
          draw_camera_center: true,
          draw_quadspace: false,
          draw_stat: true
        });
        Hal.addScene(isomap);
        return Hal.Ajax.get("assets/map/0_0", function(map) {
          var arr;
          arr = new Array();
          map.split(",").forEach(function(t) {
            return arr.push(+t);
          });
          return isomap.on("MAP_TILES_INITIALIZED", function() {
            isomap.loadBitmapMap(arr);
            Hal.fadeInViewport(1000);
            return Hal.debug(true);
          });
        });
      });
    });
  });

}).call(this);
