(function() {
  "use strict";
  define(["jquery-ui", "../../../js/MetaConfig", "handlebars", "halal"], function($, MetaConfig) {
    var $BackIcon, $CenterTileDialog, $CenterTileDialogContent, $CenterTileDialogTBox, $EditingBar, $MarkerNameInput, $MarkersButtons, $MarkersContainer, $MarkersContainerContent, $MarkersContainerHolder, $MarkersContainerTBox, $SpritesContainer, $SpritesContainerContent, $SpritesContainerTBox, $TilesContainer, $TilesContainerContent, $TilesContainerHolder, $TilesContainerTBox, FolderBox, MAP, MarkerBox, SelectableBox, SelectableBoxTitle, SelectableDragable, TileForm, addNewMarker, addTileToTilesDialog, all_folders, createLayerCircleBtns, createMiniGrid, createSpriteBoxFromSprite, createTileFromSprite, current_sprite_folder, displaySpritesAndFolders, fillTilePropertyForm, hud_zindex, onFolderClick, parseMiniGridSize, parseTileInfo, prev_sprite_folder, selected_layer, selected_mode, showLayers, socket, tpl_select_drag, tpl_title,
      _this = this;
    MAP = null;
    /* let's define some helpers*/

    Handlebars.registerHelper("create_options", function(values, options) {
      var out;
      out = "";
      values.forEach(function(elem) {
        return out += "<option value='" + elem + "'>" + elem + "</option>";
      });
      return new Handlebars.SafeString(out);
    });
    Hal.on("MAP_ADDED", function(isomap) {
      MAP = isomap;
      MAP.on("TM_TILES_LOADED", function() {
        return showLayers(0);
      });
      return MAP.on("TM_MARKERS_LOADED", function() {
        var marker, _i, _len, _ref, _results;
        _ref = isomap.tm.markers;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          marker = _ref[_i];
          _results.push(addNewMarker(marker));
        }
        return _results;
      });
    });
    Hal.on("MAP_SAVED", function(saved_map, start) {
      console.debug(saved_map);
      console.debug(start);
      return socket.emit("SAVE_MAP_SECTION", JSON.stringify({
        section: saved_map,
        start: start
      }));
    });
    socket = io.connect('http://localhost:8080');
    socket.emit("LOAD_MAPEDITOR_ASSETS");
    socket.on("MARKER_ADDED", function(marker) {
      addNewMarker(marker);
      return Hal.trigger("TILE_MNGR_NEW_MARKER", marker);
    });
    socket.on("TILE_ADDED", function(tile) {
      return Hal.trigger("TILE_MNGR_NEW_TILE", tile);
    });
    socket.on("MAP_SECTION_SAVED", function(start) {
      return console.debug("Map section " + start + " successfully saved");
    });
    socket.on("LOAD_MARKERS", function(markers) {
      return Hal.trigger("TILE_MNGR_LOAD_MARKERS", markers);
    });
    socket.on("LOAD_TILES", function(tiles) {
      var i, st, t, tw;
      for (i in tiles) {
        t = tiles[i];
        tw = createSpriteBoxFromSprite(Hal.asm.getSprite(t.sprite), true);
        st = createTileFromSprite(t.sprite);
        st.name = t.name;
        st.size = t.size;
        st.layer = t.layer;
        st.id = t.id;
        addTileToTilesDialog(st, tw);
      }
      return Hal.trigger("TILE_MNGR_LOAD_TILES", tiles);
    });
    SelectableDragable = "<div id = {{id}} class=\"selectable\">\n    <div class=\"holder\">\n        <div class=\"toolbox\">\n            {{{tools}}}\n        </div>\n        <div class=\"content\">\n        </div>\n    </div>        \n    <div class=\"title-container\">\n        <h5 id=\"title\"> {{title}} </h5>\n        <div class=\"title-buttons\">\n            <i id=\"toggle-show\" class=\"fa fa-minus-circle\"></i>\n        </div>\n    </div>\n</div>";
    TileForm = "<div class=\"keyval\">\n    <div>\n        <label for=\"name\">Name</label>\n        <input id=\"tile-name\" type=\"text\" value=\"{{name}}\"></input>\n    </div>\n\n    <div>\n        <label for=\"layer\">Layer</label>\n        <select id=\"tile-layer\">\n        {{create_options layers}}\n        </select>\n    </div>\n\n    <div>\n        <label for=\"minigrid\"> Size </label>\n        {{{minigrid}}}\n    </div>\n</div>\n<button id=\"save-tile\" type=\"button\" class=\"tileform-button\"> Save </button>";
    SelectableBox = "<li class=\"selectable-box\">\n</li>";
    SelectableBoxTitle = "<span class=\"selectable-title\">\n    {{title}}\n</span>";
    FolderBox = "<i class=\"fa fa-folder-open\"></i>";
    MarkerBox = "<i class=\"fa fa-file\"></i>";
    $BackIcon = $("<i class=\"fa fa-arrow-circle-left\"></i>");
    $EditingBar = $("<div class=\"editing-bar\">\n    <i id=\"mode-place\" class=\"fa fa-edit\"></i>\n    <i id=\"mode-erase\" class=\"fa fa-times\"></i>\n    <i id=\"mode-default\" class=\"fa fa-ban\"></i>\n    <i id=\"map-save\" class=\"fa fa-save\"></i>\n    <i id=\"map-load\" class=\"fa fa-refresh\"></i>\n</div>");
    $MarkersButtons = $("<div class=\"marker-buttons\">\n    <i id=\"add-new-marker\" class=\"fa fa-plus-circle\"></i>\n    <input type=\"text\" id=\"marker-name\"></input>\n</div>");
    tpl_select_drag = Handlebars.compile(SelectableDragable);
    tpl_title = Handlebars.compile(SelectableBoxTitle);
    prev_sprite_folder = "";
    current_sprite_folder = "";
    all_folders = Hal.asm.getSpriteFolders();
    selected_mode = null;
    selected_layer = 0;
    hud_zindex = +Hal.dom.hud.style["z-index"];
    /* Setup editing bar listeners*/

    $EditingBar.click(function(ev) {
      $EditingBar.find(".editing-mode-active").each(function(k, v) {
        return $(v).removeClass("editing-mode-active");
      });
      if (ev.target.nodeName === "I") {
        Hal.trigger("EDITOR_MODE_CHANGED", ev.target.id);
        return $(ev.target).toggleClass("editing-mode-active");
      }
    });
    /*
        Sprite list dialog
    */

    $SpritesContainer = $(tpl_select_drag({
      title: "Sprites",
      id: "sprite-container"
    }));
    $SpritesContainer.css("bottom", "0px");
    $SpritesContainer.css("position", "fixed");
    $SpritesContainer.css("left", "0px");
    $SpritesContainerContent = $SpritesContainer.find(".content");
    $SpritesContainerTBox = $SpritesContainer.find(".toolbox");
    $SpritesContainer.find("#toggle-show").click(function() {
      var holder;
      holder = $(this).parents(".selectable").last().find(".holder").first();
      holder.toggle("slide", {
        direction: "down"
      });
      return $(this).toggleClass("fa-minus-circle fa-plus-circle");
    });
    /*
        Tiles container
    */

    $TilesContainer = $(tpl_select_drag({
      title: "Tiles",
      id: "tiles-container"
    }));
    $TilesContainer.css("bottom", "0px");
    $TilesContainer.css("position", "fixed");
    $TilesContainer.css("left", "305px");
    $TilesContainerHolder = $TilesContainer.find(".holder");
    $TilesContainerContent = $TilesContainer.find(".content");
    $TilesContainerTBox = $TilesContainer.find(".toolbox");
    $TilesContainer.find("#toggle-show").click(function() {
      var holder;
      holder = $(this).parents(".selectable").last().find(".holder").first();
      holder.toggle("slide", {
        direction: "down"
      });
      return $(this).toggleClass("fa-minus-circle fa-plus-circle");
    });
    /*
        Map markers
    */

    $MarkersContainer = $(tpl_select_drag({
      title: "Map markers",
      id: "markers-container"
    }));
    $MarkersContainer.css("bottom", "0px");
    $MarkersContainer.css("position", "fixed");
    $MarkersContainer.css("left", "610px");
    $MarkersContainer.draggable();
    $MarkersContainerHolder = $MarkersContainer.find(".holder");
    $MarkersContainerContent = $MarkersContainer.find(".content");
    $MarkersContainerTBox = $MarkersContainer.find(".toolbox");
    $MarkersContainerTBox.append($MarkersButtons);
    $MarkersContainer.find("#toggle-show").click(function() {
      var holder;
      holder = $(this).parents(".selectable").last().find(".holder").first();
      holder.toggle("slide", {
        direction: "down"
      });
      return $(this).toggleClass("fa-minus-circle fa-plus-circle");
    });
    $MarkerNameInput = $MarkersButtons.find("input");
    $MarkersButtons.find("#add-new-marker").click(function() {
      return $MarkerNameInput.toggle("slide", {
        direction: "left",
        done: function() {
          return alert("bla");
        }
      });
    });
    $MarkerNameInput.on("keyup", function(ev) {
      var val;
      if (ev.keyCode === 13) {
        val = $(this).val();
        return socket.emit("MARKER_SAVED", val);
      }
    });
    /*
        Tile editing container
    */

    $CenterTileDialog = $(tpl_select_drag({
      title: "#",
      id: "tile-container"
    }));
    $CenterTileDialog.draggable();
    $CenterTileDialog.css({
      "left": "50%",
      "top": "50%",
      "margin-left": "-150px",
      "margin-top": "-150px"
    });
    $CenterTileDialog.css("position", "absolute");
    $CenterTileDialogContent = $CenterTileDialog.find(".content");
    $CenterTileDialogTBox = $CenterTileDialog.find(".toolbox");
    $CenterTileDialog.find("#toggle-show").switchClass("fa-minus-circle", "fa-arrow-right");
    $CenterTileDialog.hide();
    $CenterTileDialog.find("#toggle-show").click(function() {
      var holder;
      holder = $(this).parents(".selectable");
      return holder.toggle("clip");
    });
    addNewMarker = function(marker) {
      var markerBox;
      markerBox = $(SelectableBox);
      markerBox.css("text-align", "center");
      markerBox.attr("id", marker);
      markerBox.append(MarkerBox);
      markerBox.append(tpl_title({
        title: marker
      }));
      $MarkersContainerContent.append(markerBox);
      return markerBox.click(function() {
        return Hal.trigger("MARKER_SELECTED", marker);
      });
    };
    showLayers = function(layer) {
      var i, st, t, tiles, tw, _results;
      $TilesContainerContent.empty();
      tiles = MAP.tm.getAllByLayer(layer);
      _results = [];
      for (i in tiles) {
        t = tiles[i];
        tw = createSpriteBoxFromSprite(Hal.asm.getSprite(t.sprite), true);
        st = createTileFromSprite(t.sprite);
        st.name = t.name;
        st.size = t.size;
        st.layer = t.layer;
        st.id = t.id;
        _results.push(addTileToTilesDialog(st, tw));
      }
      return _results;
    };
    createSpriteBoxFromSprite = function(spr, clone) {
      var sprBox;
      if (clone == null) {
        clone = false;
      }
      sprBox = $(SelectableBox);
      sprBox.attr("id", "sprite");
      sprBox.attr("sprite_path", spr.getName());
      sprBox.append(clone ? $(spr.img).clone() : spr.img);
      sprBox.append(tpl_title({
        title: spr.name
      }));
      return sprBox;
    };
    displaySpritesAndFolders = function(content, sprites, folders) {
      var f, i, s, sprBox, sprbox;
      content.empty();
      for (i in folders) {
        f = folders[i];
        sprBox = $(SelectableBox);
        sprBox.attr("id", "folder");
        sprBox.attr("folder", i);
        sprBox.append(FolderBox);
        sprBox.append(tpl_title({
          title: i
        }));
        content.append(sprBox);
      }
      for (i in sprites) {
        s = sprites[i];
        sprbox = createSpriteBoxFromSprite(s);
        content.append(sprbox);
        sprbox.draggable({
          revert: "invalid",
          helper: "clone",
          start: function(ev, ui) {
            return $(ui.helper).css("z-index", hud_zindex + 1);
          }
        });
      }
      return content.find("li#folder").each(function(k, v) {
        return $(v).click(function() {
          return onFolderClick.call(this);
        });
      });
    };
    onFolderClick = function() {
      var folders, sprites;
      $SpritesContainerTBox.append($BackIcon);
      prev_sprite_folder = current_sprite_folder;
      $BackIcon.show();
      current_sprite_folder = "" + prev_sprite_folder + "/" + ($(this).attr('folder'));
      folders = Hal.asm.getSpriteFoldersFromFolder(current_sprite_folder);
      sprites = Hal.asm.getSpritesFromFolder(current_sprite_folder);
      return displaySpritesAndFolders($SpritesContainerContent, sprites, folders);
    };
    createTileFromSprite = function(spr_path) {
      var tile;
      tile = {
        name: spr_path.replace(/\//g, "_"),
        size: "0",
        sprite: spr_path,
        tile: 0,
        layer: 0
      };
      return tile;
    };
    fillTilePropertyForm = function(tile) {
      var $CenterTileDialogSave, $TileForm, tpl_tile_form;
      $CenterTileDialogContent.empty();
      $CenterTileDialog.find("#title").text(tile.sprite);
      tpl_tile_form = Handlebars.compile(TileForm);
      $TileForm = $(tpl_tile_form({
        name: tile.name,
        size: tile.size,
        layer: tile.layer,
        sprite: tile.sprite,
        minigrid: createMiniGrid(tile.sprite, tile.size),
        layers: new Array(MetaConfig.MAX_LAYERS).join(0).split(0).map(function(_, i) {
          return i;
        })
      }));
      $CenterTileDialogContent.append($TileForm);
      $TileForm.find(".minigrid").first().click(function(ev) {
        return $(ev.target).toggleClass("minigrid-active-cell");
      });
      $TileForm.find("#tile-size option[value=" + tile.layer + "]").attr("selected", "selected");
      $CenterTileDialogSave = $CenterTileDialog.find("#save-tile").first();
      /* Save Tile*/

      return $CenterTileDialogSave.click(function() {
        var layer, name, size, t;
        name = $CenterTileDialogContent.find("#tile-name").val();
        layer = +$CenterTileDialogContent.find("#tile-layer").find("option:selected").text();
        llogd("Saved to layer: " + layer);
        size = parseMiniGridSize();
        t = {
          name: name,
          layer: layer,
          size: size,
          sprite: tile.sprite
        };
        /* na ovo slusa tile manager*/

        Hal.trigger("TILE_MNGR_NEW_TILE", t);
        socket.emit("TILE_SAVED", JSON.stringify(t));
        $CenterTileDialog.hide("clip");
        showLayers(t.layer);
        return t;
      });
    };
    createMiniGrid = function(sprname, encodednum) {
      var $cell, $parent, $wrapper, bin, diagonal, diff, factor, h, i, j, k, numcols, numrows, size, spr, w, _i, _j;
      spr = Hal.asm.getSprite(sprname);
      h = Math.pow(2, ~~(Math.log(spr.h - 1) / Math.LN2) + 1);
      factor = 16;
      size = 128;
      w = Math.max(h, spr.h) * 2;
      numrows = w / size;
      numcols = w / size;
      diagonal = (Math.sqrt(2 * size * size) * numrows) / (size / factor);
      diff = diagonal - (numcols * factor);
      $wrapper = $("<div/>", {
        "width": diagonal + "px",
        "height": (diagonal / 2) + "px",
        "class": "minigrid-wrapper"
      });
      $parent = $("<div/>", {
        "class": "minigrid",
        "width": numcols * factor,
        "height": numrows * factor,
        "css": {
          "left": (diff * 0.5 - 1) + "px",
          "top": -(diff * 0.5 - (numrows * 5) / 2 + (numrows / 2 + 1)) + "px"
        }
      });
      k = 0;
      bin = encodednum.split('');
      for (i = _i = 0; 0 <= numrows ? _i < numrows : _i > numrows; i = 0 <= numrows ? ++_i : --_i) {
        for (j = _j = 0; 0 <= numcols ? _j < numcols : _j > numcols; j = 0 <= numcols ? ++_j : --_j) {
          $cell = $("<div/>", {
            "id": "minigrid-cell",
            "css": {
              "float": "left"
            },
            "width": factor - 1,
            "height": factor - 1
          });
          if (+bin[k]) {
            $cell.addClass("minigrid-active-cell");
          }
          k++;
          $cell.appendTo($parent);
        }
      }
      $parent.appendTo($wrapper);
      return new Handlebars.SafeString($wrapper[0].outerHTML);
    };
    parseTileInfo = function() {};
    addTileToTilesDialog = function(t, wrapper) {
      console.debug(t);
      fillTilePropertyForm(t);
      wrapper.data("tile", t);
      wrapper.click(function() {
        $TilesContainer.find(".border-active").removeClass("border-active");
        $(this).toggleClass("border-active");
        console.debug($(this).data("tile"));
        return Hal.trigger("TILE_LAYER_SELECTED", $(this).data("tile"));
      });
      return $TilesContainerContent.append(wrapper);
    };
    parseMiniGridSize = function() {
      var binaryString, out;
      out = [];
      $.each($CenterTileDialogContent.find(".minigrid").children(), function(k, v) {
        out[k] = 0;
        if ($(v).hasClass("minigrid-active-cell")) {
          return out[k] = 1;
        }
      });
      binaryString = out.toString().replace(/,/g, '');
      llogd(binaryString);
      return binaryString;
    };
    createLayerCircleBtns = function() {
      var i, out, _i, _ref;
      out = "";
      for (i = _i = 0, _ref = MetaConfig.MAX_LAYERS; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        out += "<div id=\"layer\" layer='" + i + "' class='circle'>\n    <span id=\"layer-text\">" + i + "</span>\n</div>";
      }
      return out;
    };
    return Hal.trigger("DOM_ADD", function(domlayer) {
      var $domlayer;
      $domlayer = $(domlayer);
      $SpritesContainerTBox.append($BackIcon);
      $BackIcon.hide();
      $BackIcon.click(function() {
        var folders, sprites;
        if (prev_sprite_folder === current_sprite_folder) {
          prev_sprite_folder = "";
        }
        if (prev_sprite_folder === "") {
          folders = all_folders;
        } else {
          folders = Hal.asm.getSpriteFoldersFromFolder(prev_sprite_folder);
        }
        sprites = Hal.asm.getSpritesFromFolder(prev_sprite_folder);
        displaySpritesAndFolders($SpritesContainerContent, sprites, folders);
        current_sprite_folder = prev_sprite_folder;
        if (current_sprite_folder === "") {
          return $BackIcon.hide();
        }
      });
      displaySpritesAndFolders($SpritesContainerContent, null, all_folders);
      $domlayer.append($SpritesContainer);
      $domlayer.append($CenterTileDialog);
      $domlayer.append($MarkersContainer);
      $TilesContainerTBox.append(createLayerCircleBtns());
      $TilesContainerTBox.click(function(ev) {
        /* 
            gore u createLayerCircleBtns
            sam namestio kojeg je tipa
        */

        var $layer, $panel;
        $panel = $(ev.target);
        if ($panel.attr("id") === "layer-text") {
          $layer = $panel.parent();
          $layer.toggleClass("circle-anim");
          selected_layer = $layer.attr("layer");
          return showLayers(selected_layer);
        }
      });
      $TilesContainerHolder.droppable({
        accept: "#sprite",
        activeClass: "border-active",
        drop: function(ev, ui) {
          var t, tile_spr_wrapper;
          tile_spr_wrapper = ui.draggable.clone();
          t = createTileFromSprite(tile_spr_wrapper.attr("sprite_path"));
          tile_spr_wrapper.addClass("border-active");
          addTileToTilesDialog(t, tile_spr_wrapper);
          return $CenterTileDialog.show("clip");
        }
      });
      $domlayer.append($TilesContainer);
      return $domlayer.append($EditingBar);
    });
  });

}).call(this);
