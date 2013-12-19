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

  require(["halal", "../../../js/IsometricMap"], function(Hal, IsometricMap) {
    llog.setLevel("DEBUG");
    llogi("Halal loaded");
    Hal.asm.loadSpritesFromFileList("assets/sprites.list");
    return Hal.asm.on("SPRITES_LOADED", function() {
      return require(["../../../js/MapEditor"], function(MapEditor) {
        var isomap;
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
          draw_stat: true,
          mask: Hal.asm.getSprite("editor/tilemask_128x64"),
          max_layers: 6
        });
        isomap.pause();
        Hal.addScene(isomap);
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
            isomap.loadBitmapMap(arr);
            isomap.resume();
            Hal.fadeInViewport(1000);
            return Hal.debug(true);
          });
        });
      });
    });
  });

}).call(this);
