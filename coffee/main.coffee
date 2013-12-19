"use strict"

requirejs.config
    urlArgs: Math.random()
    baseUrl: "../vendor/halal/js/"
    paths:
        "jquery": "../../../vendor/jquery/jquery.min"
        "jquery-ui": "../../../../../../vendor/jquery-ui/ui/minified/jquery-ui.min"
        "handlebars": "../../../vendor/handlebars/handlebars.min"
    shim:
        "jquery-ui":
            exports: "$"
            deps: ['jquery']

require ["halal", "../../../js/IsometricMap"], (Hal, IsometricMap) ->
    llog.setLevel "DEBUG"
    llogi "Halal loaded"
    Hal.asm.loadSpritesFromFileList("assets/sprites.list")
    Hal.asm.on "SPRITES_LOADED", () ->
        require ["../../../js/MapEditor"], (MapEditor) ->  
            llogi "MapEditor loaded"
            isomap = new IsometricMap
                name: "Amjad"
                tilew: 128
                tileh: 64
                rows: 30
                cols: 200
                bg_color: "gray"
                draw_camera_center: true
                draw_quadspace: false
                draw_stat: true
                mask: Hal.asm.getSprite("editor/tilemask_128x64")
                max_layers: 6
                
            isomap.pause()
            Hal.addScene(isomap)
            isomap.pause()
            isomap.on "MAP_TILES_INITIALIZED", () ->
                    center = @worldCenterTile()
                    name = center.row + "_" + center.col
                    Hal.Ajax.get "assets/map/#{name}", (map) =>
                        arr = new Array()
                        map.split(",").forEach (t) -> arr.push(+t)
                        isomap.loadBitmapMap(arr)
                        isomap.resume()
                        Hal.fadeInViewport(1000)
                        Hal.debug(true)



