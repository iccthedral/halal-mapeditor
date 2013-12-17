(function() {
  "use strict";
  define(["jquery-ui", "handlebars", "halal"], function($) {
    /* let's define some helpers*/

    var $BackIcon, $CenterTileDialog, $CenterTileDialogContent, $CenterTileDialogTBox, $EditingBar, $MarkersContainer, $MarkersContainerContent, $MarkersContainerHolder, $MarkersContainerTBox, $SpritesContainer, $SpritesContainerContent, $SpritesContainerTBox, $TilesContainer, $TilesContainerContent, $TilesContainerHolder, $TilesContainerTBox, FolderBox, SelectableBox, SelectableBoxTitle, SelectableDragable, TileForm, addTileToTilesDialog, all_folders, createLayerCircleBtns, createMiniGrid, createSpriteBoxFromSprite, createTileFromSprite, current_sprite_folder, displaySpritesAndFolders, fillTilePropertyForm, hud_zindex, num_layers, onFolderClick, parseMiniGridSize, parseTileInfo, prev_sprite_folder, selected_layer, selected_mode, socket, tpl_select_drag, tpl_title,
      _this = this;
    Handlebars.registerHelper("create_options", function(values, options) {
      var out;
      out = "";
      values.forEach(function(elem) {
        return out += "<option value='" + elem + "'>" + elem + "</option>";
      });
      return new Handlebars.SafeString(out);
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
    socket.on("MAP_SECTION_SAVED", function(start) {
      return console.debug("Map section " + start + " successfully saved");
    });
    socket.on("LOAD_TILES", function(tiles) {
      var i, st, t, tw;
      console.debug(tiles);
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
    SelectableDragable = "<div id = {{id}} class=\"selectable\">\n    <div class=\"title-container\">\n        <h5 id=\"title\"> {{title}} </h5>\n        <div class=\"title-buttons\">\n            <i id=\"toggle-show\" class=\"fa fa-minus-circle\"></i>\n        </div>\n    </div>\n    <div class=\"holder\">\n        <div class=\"toolbox\">\n            {{{tools}}}\n        </div>\n        <div class=\"content\">\n    </div>\n    </div>\n</div>";
    TileForm = "<div class=\"keyval\">\n    <div>\n        <label for=\"name\">Name</label>\n        <input id=\"tile-name\" type=\"text\" value=\"{{name}}\"></input>\n    </div>\n\n    <div>\n        <label for=\"layer\">Layer</label>\n        <select id=\"tile-layer\">\n        {{create_options layers}}\n        </select>\n    </div>\n\n    <div>\n        <label for=\"minigrid\"> Size </label>\n        {{{minigrid}}}\n    </div>\n</div>\n<button id=\"save-tile\" type=\"button\" class=\"tileform-button\"> Save </button>";
    SelectableBox = "<li class=\"selectable-box\">\n</li>";
    SelectableBoxTitle = "<span class=\"selectable-title\">\n    {{title}}\n</span>";
    FolderBox = "<i class=\"fa fa-folder-open\"></i>";
    $BackIcon = $("<i class=\"fa fa-arrow-circle-left\"></i>");
    $EditingBar = $("<div class=\"editing-bar\">\n    <i id=\"mode-place\" class=\"fa fa-edit\"></i>\n    <i id=\"mode-erase\" class=\"fa fa-times\"></i>\n    <i id=\"mode-default\" class=\"fa fa-ban\"></i>\n    <i id=\"map-save\" class=\"fa fa-save\"></i>\n    <i id=\"map-load\" class=\"fa fa-refresh\"></i>\n</div>");
    tpl_select_drag = Handlebars.compile(SelectableDragable);
    tpl_title = Handlebars.compile(SelectableBoxTitle);
    prev_sprite_folder = "";
    current_sprite_folder = "";
    all_folders = Hal.asm.getSpriteFolders();
    selected_mode = null;
    num_layers = 6;
    selected_layer = 0;
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
    $SpritesContainer.css("top", "20px");
    $SpritesContainer.css("right", "50px");
    $SpritesContainer.draggable();
    $SpritesContainerContent = $SpritesContainer.find(".content");
    $SpritesContainerTBox = $SpritesContainer.find(".toolbox");
    $SpritesContainer.find("#toggle-show").click(function() {
      var holder;
      holder = $(this).parents(".selectable").last().find(".holder").first();
      holder.toggle("slide", {
        direction: "up"
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
    $TilesContainer.css("top", "337px");
    $TilesContainer.css("position", "absolute");
    $TilesContainer.css("right", "50px");
    $TilesContainer.draggable();
    $TilesContainerHolder = $TilesContainer.find(".holder");
    $TilesContainerContent = $TilesContainer.find(".content");
    $TilesContainerTBox = $TilesContainer.find(".toolbox");
    $TilesContainer.find("#toggle-show").click(function() {
      var holder;
      holder = $(this).parents(".selectable").last().find(".holder").first();
      holder.toggle("slide", {
        direction: "up"
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
    $MarkersContainer.css("top", "337px");
    $MarkersContainer.css("position", "absolute");
    $MarkersContainer.css("right", "50px");
    $MarkersContainer.draggable();
    $MarkersContainerHolder = $MarkersContainer.find(".holder");
    $MarkersContainerContent = $MarkersContainer.find(".content");
    $MarkersContainerTBox = $MarkersContainer.find(".toolbox");
    $MarkersContainer.find("#toggle-show").click(function() {
      var holder;
      holder = $(this).parents(".selectable").last().find(".holder").first();
      holder.toggle("slide", {
        direction: "up"
      });
      return $(this).toggleClass("fa-minus-circle fa-plus-circle");
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
    hud_zindex = +Hal.dom.hud.style["z-index"];
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
        layers: new Array(num_layers).join(0).split(0).map(function(_, i) {
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
      var i, out, _i;
      out = "";
      for (i = _i = 0; 0 <= num_layers ? _i < num_layers : _i > num_layers; i = 0 <= num_layers ? ++_i : --_i) {
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
          return console.debug("selected layer: " + selected_layer);
        } else if ($panel.attr("markers") !== "true") {
          $panel.toggleClass("circle-anim");
          $panel.attr("markers", "true");
          $panel.empty();
          return $panel.toggleClass("circle-anim");
        } else {
          $panel.empty();
          $panel.attr("markers", "false");
          $panel.append(createLayerCircleBtns());
          return $panel.toggleClass("circle-anim");
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
