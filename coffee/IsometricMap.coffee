"use strict"

define ["halal"], (Hal) ->

    class IsometricMap extends Hal.IsometricScene
        constructor: (meta) ->
            super(meta)

    IsometricMap::init = () ->
        super()
        ### @SUPPORTED_EDITOR_MODES ###
        @supported_modes = {}
        @saved_sections = {}

        @supported_modes["mode-default"] = () =>
                @processLeftClick()
                return
                
        @supported_modes["mode-erase"] = () =>
            @processLeftClick()
            return if not @clicked_layer? 
            #or @clicked_layer.tweener.isAnimating() 
            # @clicked_layer.tween(
            #     attr: "h"
            #     from: 0
            #     to: 100
            #     duration: 500
            # ).tween(
            #     attr: "opacity"
            #     from: 1
            #     to: 0
            #     duration: 700
            # ).done () -> @destroy()
            @clicked_layer.destroy()
            @clicked_layer = null

        @supported_modes["map-load"] = () =>
            start = @worldCenterTile()
            coords = [start.row, start.col]
            save = @saved_sections[start.row+"_"+start.col]
            if not save?
                llogd "No map saved at #{coords[0]}, #{coords[1]}"
                return
            @loadBitmapMap(save)
            Hal.trigger "MAP_LOADED", coords

        @supported_modes["map-save"] = () =>

            save = @saveBitmapMap()
            start = @worldCenterTile()
            coords = [start.row, start.col]
            @saved_sections[start.row+"_"+start.col] = save
            Hal.trigger "MAP_SAVED", save, coords

        @supported_modes["mode-place"] = () =>
            return if not @tile_under_mouse? or not @selected_tile?
            @selected_tile_x = @selected_tile_sprite.w2
            @selected_tile_y = @selected_tile_sprite.h - @tileh2
            @tm.loadTileLayerById(@tile_under_mouse, @selected_tile.id)
            # t = @tm.addTileLayerMeta(
            #     @tile_under_mouse.row, @tile_under_mouse.col,
            #     @selected_tile, @selected_tile_x, @selected_tile_y #,@selected_tile.layer
            # )
            return

        @current_mode       = "mode-default"
        @current_mode_clb   = @supported_modes[@current_mode]

    IsometricMap::initListeners = () ->
        super()
        ###map editor stuff###
        @editor_mode_listener =
        Hal.on "EDITOR_MODE_CHANGED", (mode) =>
            return if @paused
            console.debug mode
            if @supported_modes[mode]?
                @current_mode = mode
                if mode.indexOf("mode") isnt -1
                    console.debug "zasto ulazim ovde"
                    @current_mode_clb = @supported_modes[mode]
                else
                    console.debug "run mode: #{mode}"
                    @supported_modes[@current_mode]()
            else
                llogw "Mode #{mode} not supported"
            llogd @current_mode

        @layer_selected_listener =
        Hal.on "TILE_LAYER_SELECTED", (tile) =>
            @selected_tile = @tm.findByName(tile.name)
            llogd "Tile layer selected from editor"
            llogd @selected_tile
            @selected_tile_sprite = Hal.asm.getSprite(@selected_tile.sprite)
            @selected_tile_x = @selected_tile_sprite.w2
            @selected_tile_y = @selected_tile_sprite.h - @tileh2
        
        @left_click_listener = 
        Hal.on "LEFT_CLICK", () =>
            return if @paused
            @current_mode_clb.call(@)

        @show_tilelayer_listener =
        Hal.on "EXIT_FRAME", (delta) =>
            t = @getTileAt(@world_pos)
            if @current_mode is "mode-place"
                return if not @selected_tile? or not @tile_under_mouse?
                ctx = @renderer.contexts[@selected_tile.layer]
                ctx.setTransform(
                    @_transform[0],
                    @_transform[3],
                    @_transform[1],
                    @_transform[4],
                    @_transform[2],
                    @_transform[5]
                )
                ctx.globalAlpha = 0.5
                ctx.drawImage(@selected_tile_sprite.img, @tile_under_mouse.position[0] - @selected_tile_x, @tile_under_mouse.position[1] - @selected_tile_y)
                ctx.globalAlpha = 1.0
                if t isnt @tile_under_mouse
                    if @tile_under_mouse
                        @tile_under_mouse.drawableOffState(Hal.DrawableStates.Fill)
                    @tile_under_mouse = t
                    if @tile_under_mouse?
                        @tile_under_mouse.drawableOnState(Hal.DrawableStates.Fill)
            
        @on "OVER_NEW_TILE", (newtile) ->
            if @tile_under_mouse?
                @tile_under_mouse.attr("stroke_color", "white")
                @tile_under_mouse.attr("stroke_width", 0.5)
                ind = @visible_ents.indexOf(@tile_under_mouse)
                if ind isnt -1
                    @visible_ents.splice(ind, 1)
                    
            @visible_ents.push(newtile)
            newtile.attr("stroke_color", "red")
            newtile.attr("stroke_width", 2)
            if not newtile.tweener.isAnimating()
                newtile.tween
                    attr: "position[1]"
                    from: newtile.position[1]
                    to: newtile.position[1] - 10
                    duration: 300
                .done () ->
                    @tween
                        attr: "position[1]"
                        from: @position[1]
                        to: @position[1] + 10
                        duration: 300
        
    IsometricMap::destroy = () ->
        super()
        Hal.removeTrigger "EDITOR_MODE_CHANGED", @editor_mode_listener
        Hal.removeTrigger "TILE_LAYER_SELECTED", @layer_selected_listener
        Hal.removeTrigger "MOUSE_MOVE", @mouse_moved_listener
        Hal.removeTrigger "LEFT_CLICK", @left_click_listener
        Hal.removeTrigger "EXIT_FRAME", @show_tilelayer_listener
        
    return IsometricMap
