"use strict"


define ["jquery-ui", "handlebars", "halal"], 

($) ->

    ### let's define some helpers ###
    Handlebars.registerHelper "create_options", (values, options) ->
        out = ""
        values.forEach (elem) ->
            out += "<option value='#{elem}'>#{elem}</option>" #$("<option/>")
        return new Handlebars.SafeString(out)
   
    Hal.on "MAP_SAVED", (saved_map, start) =>
        console.debug saved_map
        console.debug start
        socket.emit "SAVE_MAP_SECTION", JSON.stringify({section: saved_map, start: start})

    socket = io.connect('http://localhost:8080')
    socket.emit "LOAD_MAPEDITOR_ASSETS"

    socket.on "TILE_ADDED", (tile) ->
        Hal.trigger "TILE_MNGR_NEW_TILE", tile
        
    socket.on "MAP_SECTION_SAVED", (start) ->
        console.debug "Map section #{start} successfully saved"

    socket.on "LOAD_TILES", (tiles) ->
        console.debug tiles
        for i, t of tiles
            tw = createSpriteBoxFromSprite(Hal.asm.getSprite(t.sprite), true)
            st = createTileFromSprite(t.sprite)
            st.name = t.name
            st.size = t.size
            st.layer = t.layer
            st.id = t.id
            addTileToTilesDialog(st, tw)
        Hal.trigger "TILE_MNGR_LOAD_TILES", tiles

    SelectableDragable = 
    """
    <div id = {{id}} class="selectable">
        <div class="title-container">
            <h5 id="title"> {{title}} </h5>
            <div class="title-buttons">
                <i id="toggle-show" class="fa fa-minus-circle"></i>
            </div>
        </div>
        <div class="holder">
            <div class="toolbox">
                {{{tools}}}
            </div>
            <div class="content">
        </div>
        </div>
    </div>
    """

    TileForm = 
    """
    <div class="keyval">
        <div>
            <label for="name">Name</label>
            <input id="tile-name" type="text" value="{{name}}"></input>
        </div>

        <div>
            <label for="layer">Layer</label>
            <select id="tile-layer">
            {{create_options layers}}
            </select>
        </div>

        <div>
            <label for="minigrid"> Size </label>
            {{{minigrid}}}
        </div>
    </div>
    <button id="save-tile" type="button" class="tileform-button"> Save </button>
    """

    SelectableBox = 
    """
    <li class="selectable-box">
    </li>
    """

    SelectableBoxTitle =
    """
    <span class="selectable-title">
        {{title}}
    </span>
    """

    FolderBox = 
    """
    <i class="fa fa-folder-open"></i>
    """

    $BackIcon =
    $(
        """
        <i class="fa fa-arrow-circle-left"></i>
        """
    )

    $EditingBar = 
    $("""
        <div class="editing-bar">
            <i id="mode-place" class="fa fa-edit"></i>
            <i id="mode-erase" class="fa fa-times"></i>
            <i id="mode-default" class="fa fa-ban"></i>
            <i id="map-save" class="fa fa-save"></i>
            <i id="map-load" class="fa fa-refresh"></i>
        </div>
    """)

    tpl_select_drag         = Handlebars.compile(SelectableDragable)
    tpl_title               = Handlebars.compile(SelectableBoxTitle)
    prev_sprite_folder      = ""
    current_sprite_folder   = ""
    all_folders             = Hal.asm.getSpriteFolders()
    selected_mode           = null
    num_layers              = 6
    selected_layer          = 0

    ### Setup editing bar listeners ###
    $EditingBar.click (ev) ->
        $EditingBar.find(".editing-mode-active").each (k, v) -> $(v).removeClass "editing-mode-active"
        if ev.target.nodeName is "I"
            Hal.trigger "EDITOR_MODE_CHANGED", ev.target.id
            $(ev.target).toggleClass("editing-mode-active")
    ###
        Sprite list dialog
    ###
    $SpritesContainer = $(tpl_select_drag({
        title: "Sprites"
        id: "sprite-container"
    }))
    $SpritesContainer.css("top", "20px")
    $SpritesContainer.css("right", "50px")
    $SpritesContainer.draggable()
    # $SpritesContainer.resizable()
    $SpritesContainerContent = 
        $SpritesContainer.find(".content")
    $SpritesContainerTBox =
        $SpritesContainer.find(".toolbox")
    $SpritesContainer.find("#toggle-show").click () ->
        holder = $(@).parents(".selectable").last().find(".holder").first()
        holder.toggle("slide",
            direction: "up"
        )
        $(@).toggleClass "fa-minus-circle fa-plus-circle"

    ###
        Tiles container
    ###
    $TilesContainer = $(tpl_select_drag({
        title: "Tiles"
        id: "tiles-container"
    }))
    $TilesContainer.css("top", "337px")
    $TilesContainer.css("position", "absolute")
    $TilesContainer.css("right", "50px")
    $TilesContainer.draggable()
    # $TilesContainer.resizable()
    $TilesContainerHolder = 
        $TilesContainer.find(".holder")
    $TilesContainerContent = 
        $TilesContainer.find(".content")
    $TilesContainerTBox =
        $TilesContainer.find(".toolbox")
    
    # TilesContainerTBox.append(createLayerCircleBtns())

    $TilesContainer.find("#toggle-show").click () ->
        holder = $(@).parents(".selectable").last().find(".holder").first()
        holder.toggle("slide",
            direction: "up"
        )
        $(@).toggleClass "fa-minus-circle fa-plus-circle"

    ###
        Map markers
    ###
    $MarkersContainer = $(tpl_select_drag({
        title: "Map markers"
        id: "markers-container"
    }))
    $MarkersContainer.css("top", "337px")
    $MarkersContainer.css("position", "absolute")
    $MarkersContainer.css("right", "50px")
    $MarkersContainer.draggable()
    # $TilesContainer.resizable()
    $MarkersContainerHolder = 
        $MarkersContainer.find(".holder")
    $MarkersContainerContent = 
        $MarkersContainer.find(".content")
    $MarkersContainerTBox =
        $MarkersContainer.find(".toolbox")
    
    # TilesContainerTBox.append(createLayerCircleBtns())

    $MarkersContainer.find("#toggle-show").click () ->
        holder = $(@).parents(".selectable").last().find(".holder").first()
        holder.toggle("slide",
            direction: "up"
        )
        $(@).toggleClass "fa-minus-circle fa-plus-circle"


    ###
        Tile editing container
    ###
    $CenterTileDialog = $(tpl_select_drag({
        title: "#"
        id: "tile-container"
    }))
    # $CenterTileDialog.resizable()
    $CenterTileDialog.draggable()
    $CenterTileDialog.css(
        "left": "50%"
        "top": "50%"
        "margin-left": "-150px"
        "margin-top": "-150px"
    )
    $CenterTileDialog.css("position", "absolute")
    $CenterTileDialogContent = 
        $CenterTileDialog.find(".content")
    $CenterTileDialogTBox =
        $CenterTileDialog.find(".toolbox")
    $CenterTileDialog.find("#toggle-show").switchClass "fa-minus-circle", "fa-arrow-right"
    $CenterTileDialog.hide()
    $CenterTileDialog.find("#toggle-show").click () ->
        holder = $(@).parents(".selectable")
        holder.toggle("clip")

    hud_zindex = +Hal.dom.hud.style["z-index"]

    createSpriteBoxFromSprite = (spr, clone = false) ->
        sprBox = $(SelectableBox)
        sprBox.attr("id", "sprite")
        sprBox.attr("sprite_path", spr.getName())
        sprBox.append(if clone then $(spr.img).clone() else spr.img)
        sprBox.append(tpl_title({
            title: spr.name
        }))
        return sprBox

    displaySpritesAndFolders = (content, sprites, folders) ->
        content.empty()
        for i, f of folders
            sprBox = $(SelectableBox)
            sprBox.attr("id", "folder")
            sprBox.attr("folder", i)
            sprBox.append(FolderBox)
            sprBox.append(tpl_title({
                title: i
            }))
            content.append(sprBox)

        for i, s of sprites
            sprbox = createSpriteBoxFromSprite(s)
            content.append(sprbox)
            sprbox.draggable(
                revert: "invalid"
                helper: "clone"
                start: (ev, ui) -> 
                    $(ui.helper).css("z-index", hud_zindex+1)
            )

        content.find("li#folder").each (k, v) ->
            $(v).click () ->
                onFolderClick.call(@)

    onFolderClick = () ->
        $SpritesContainerTBox.append($BackIcon)
        prev_sprite_folder = current_sprite_folder
        $BackIcon.show()
        current_sprite_folder = "#{prev_sprite_folder}/#{$(@).attr('folder')}"
        folders = Hal.asm.getSpriteFoldersFromFolder(current_sprite_folder)
        sprites = Hal.asm.getSpritesFromFolder(current_sprite_folder)
        displaySpritesAndFolders($SpritesContainerContent, sprites, folders)

    createTileFromSprite = (spr_path) ->
        tile = 
            # id: Hal.ID()
            name: spr_path.replace(/\//g, "_")
            size: "0"
            sprite: spr_path
            tile: 0
            layer: 0
        return tile

    fillTilePropertyForm = (tile) ->
        $CenterTileDialogContent.empty()
        $CenterTileDialog.find("#title").text(tile.sprite)
        tpl_tile_form = Handlebars.compile(TileForm)

        $TileForm = $(tpl_tile_form({
            name: tile.name
            size: tile.size
            layer: tile.layer
            sprite: tile.sprite
            minigrid: createMiniGrid(tile.sprite, tile.size)
            layers: new Array(num_layers).join(0).split(0).map (_,i) -> i
        }))
        $CenterTileDialogContent.append($TileForm)

        $TileForm.find(".minigrid").first().click (ev) ->
            # there's no need to check here explicitly 
            # which target is clicked upon
            # because the container itself is full-fileld 
            # with same targets.
            $(ev.target).toggleClass("minigrid-active-cell")

        $TileForm.find("#tile-size option[value=#{tile.layer}]").attr("selected", "selected")

        $CenterTileDialogSave = $CenterTileDialog.find("#save-tile").first()

        ### Save Tile ###
        $CenterTileDialogSave.click () ->
            name    = $CenterTileDialogContent.find("#tile-name").val()
            layer   = +$CenterTileDialogContent.find("#tile-layer").find("option:selected").text()
            llogd "Saved to layer: #{layer}"
            size    = parseMiniGridSize()
            t = 
                name: name
                layer: layer
                size: size
                sprite: tile.sprite
            ### na ovo slusa tile manager ###
            Hal.trigger "TILE_MNGR_NEW_TILE", t
            socket.emit "TILE_SAVED", JSON.stringify(t)
            $CenterTileDialog.hide "clip"
            return t

    createMiniGrid = (sprname, encodednum) ->
        spr         = Hal.asm.getSprite(sprname)
        h           = Math.pow(2, ~~(Math.log(spr.h-1)/Math.LN2) + 1)
        factor      = 16
        size        = 128
        w           = Math.max(h, spr.h) * 2
        numrows     = w / size
        numcols     = w / size
        diagonal    = (Math.sqrt(2*size*size) * numrows) / (size/factor)
        diff        = diagonal - (numcols*factor)
        
        $wrapper = $("<div/>", 
          "width": (diagonal) + "px"
          "height": (diagonal / 2) + "px"
          "class" :"minigrid-wrapper"
        )

        $parent = $("<div/>",
          "class": "minigrid"
          "width": numcols * factor
          "height": numrows * factor
          "css":
            "left": (diff * 0.5 - 1) + "px"
            "top" : -(diff * 0.5 - (numrows*5) / 2 + (numrows / 2 + 1)) + "px"
        )

        k = 0
        bin = encodednum.split('')

        for i in [0...numrows]
          for j in [0...numcols]
            $cell = $("<div/>",
              "id": "minigrid-cell"
              "css":
                "float": "left"
              "width": factor - 1
              "height": factor - 1
            )
            if +bin[k]
              $cell.addClass("minigrid-active-cell")
            k++
            $cell.appendTo($parent)
        $parent.appendTo($wrapper)

        return new Handlebars.SafeString($wrapper[0].outerHTML)

    parseTileInfo = () ->
        return

    addTileToTilesDialog = (t, wrapper) ->
        console.debug t
        fillTilePropertyForm(t)
        wrapper.data("tile", t)
        wrapper.click () ->
            $TilesContainer.find(".border-active").removeClass "border-active"
            $(this).toggleClass "border-active"
            console.debug $(this).data("tile")
            Hal.trigger "TILE_LAYER_SELECTED", $(this).data("tile")
        $TilesContainerContent.append(wrapper)

    parseMiniGridSize = () ->
        out = []
        $.each($CenterTileDialogContent.find(".minigrid").children(), 
          (k, v) ->
            out[k] = 0
            if $(v).hasClass("minigrid-active-cell")
              out[k] = 1
        )
        binaryString = out.toString().replace(/,/g,'')
        llogd binaryString
        return binaryString

    createLayerCircleBtns = () ->
        out = ""
        for i in [0...num_layers]
            out +=
            """
                <div id="layer" layer='#{i}' class='circle'>
                    <span id="layer-text">#{i}</span>
                </div>
            """
        return out

    Hal.trigger "DOM_ADD", (domlayer) =>
        $domlayer = $(domlayer)
        $SpritesContainerTBox.append($BackIcon)
        $BackIcon.hide()
        $BackIcon.click () ->
            if prev_sprite_folder is current_sprite_folder
                prev_sprite_folder = ""
            if prev_sprite_folder is ""
                folders = all_folders
            else
                folders = Hal.asm.getSpriteFoldersFromFolder(prev_sprite_folder)
            sprites = Hal.asm.getSpritesFromFolder(prev_sprite_folder)
            displaySpritesAndFolders($SpritesContainerContent, sprites, folders)
            current_sprite_folder = prev_sprite_folder
            if current_sprite_folder is ""
                $BackIcon.hide()

        displaySpritesAndFolders($SpritesContainerContent, null, all_folders)

        $domlayer.append($SpritesContainer)
        $domlayer.append($CenterTileDialog)

        $TilesContainerTBox.append(
            createLayerCircleBtns()
        )

        $TilesContainerTBox.click (ev) ->
            ### 
                gore u createLayerCircleBtns
                sam namestio kojeg je tipa
            ###
            $panel = $(ev.target)

            if $panel.attr("id") is "layer-text" 
                $layer = $panel.parent()
                $layer.toggleClass "circle-anim"
                selected_layer = $layer.attr("layer")
                console.debug "selected layer: #{selected_layer}"
            else if $panel.attr("markers") isnt "true"
                $panel.toggleClass "circle-anim"
                $panel.attr("markers", "true")
                $panel.empty()
                $panel.toggleClass "circle-anim"
            else    
                $panel.empty()
                $panel.attr("markers", "false")
                $panel.append(createLayerCircleBtns())
                $panel.toggleClass "circle-anim"

                # $panel.empty()
                #$TilesContainerTBox.replaceWith(createLayerCircleBtns())

        $TilesContainerHolder.droppable(
            accept: "#sprite"
            activeClass: "border-active"
            drop: (ev, ui) ->
                tile_spr_wrapper = ui.draggable.clone()
                t = createTileFromSprite(tile_spr_wrapper.attr("sprite_path"))
                tile_spr_wrapper.addClass "border-active"
                addTileToTilesDialog(t, tile_spr_wrapper)
                $CenterTileDialog.show("clip")
        )

        $domlayer.append($TilesContainer)
        $domlayer.append($EditingBar)