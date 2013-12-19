(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["halal"], function(Hal) {
    var IsometricMap;
    IsometricMap = (function(_super) {
      __extends(IsometricMap, _super);

      function IsometricMap(meta) {
        IsometricMap.__super__.constructor.call(this, meta);
      }

      return IsometricMap;

    })(Hal.IsometricScene);
    IsometricMap.prototype.init = function(meta) {
      var _this = this;
      IsometricMap.__super__.init.call(this, meta);
      /* @SUPPORTED_EDITOR_MODES*/

      this.supported_modes = {};
      this.saved_sections = {};
      this.supported_modes["mode-default"] = function() {
        _this.processLeftClick();
      };
      this.supported_modes["mode-erase"] = function() {
        _this.processLeftClick();
        if (_this.clicked_layer == null) {
          return;
        }
        _this.clicked_layer.destroy();
        return _this.clicked_layer = null;
      };
      this.supported_modes["map-load"] = function() {
        var coords, save, start;
        start = _this.worldCenterTile();
        coords = [start.row, start.col];
        save = _this.saved_sections[start.row + "_" + start.col];
        if (save == null) {
          llogd("No map saved at " + coords[0] + ", " + coords[1]);
          return;
        }
        _this.loadBitmapMap(save);
        return Hal.trigger("MAP_LOADED", coords);
      };
      this.supported_modes["map-save"] = function() {
        var coords, save, start;
        save = _this.saveBitmapMap();
        start = _this.worldCenterTile();
        coords = [start.row, start.col];
        _this.saved_sections[start.row + "_" + start.col] = save;
        return Hal.trigger("MAP_SAVED", save, coords);
      };
      this.supported_modes["mode-place"] = function() {
        if ((_this.tile_under_mouse == null) || (_this.selected_tile == null)) {
          return;
        }
        _this.selected_tile_x = _this.selected_tile_sprite.w2;
        _this.selected_tile_y = _this.selected_tile_sprite.h - _this.tileh2;
        _this.tm.loadTileLayerById(_this.tile_under_mouse, _this.selected_tile.id);
      };
      this.current_mode = "mode-default";
      return this.current_mode_clb = this.supported_modes[this.current_mode];
    };
    IsometricMap.prototype.initListeners = function() {
      var _this = this;
      IsometricMap.__super__.initListeners.call(this);
      /*map editor stuff*/

      this.editor_mode_listener = Hal.on("EDITOR_MODE_CHANGED", function(mode) {
        if (_this.paused) {
          return;
        }
        console.debug(mode);
        if (_this.supported_modes[mode] != null) {
          _this.current_mode = mode;
          if (mode.indexOf("mode") !== -1) {
            console.debug("zasto ulazim ovde");
            _this.current_mode_clb = _this.supported_modes[mode];
          } else {
            console.debug("run mode: " + mode);
            _this.supported_modes[_this.current_mode]();
          }
        } else {
          llogw("Mode " + mode + " not supported");
        }
        return llogd(_this.current_mode);
      });
      this.layer_selected_listener = Hal.on("TILE_LAYER_SELECTED", function(tile) {
        _this.selected_tile = _this.tm.findByName(tile.name);
        llogd("Tile layer selected from editor");
        llogd(_this.selected_tile);
        _this.selected_tile_sprite = Hal.asm.getSprite(_this.selected_tile.sprite);
        _this.selected_tile_x = _this.selected_tile_sprite.w2;
        return _this.selected_tile_y = _this.selected_tile_sprite.h - _this.tileh2;
      });
      this.left_click_listener = Hal.on("LEFT_CLICK", function() {
        if (_this.paused) {
          return;
        }
        return _this.current_mode_clb.call(_this);
      });
      this.show_tilelayer_listener = Hal.on("EXIT_FRAME", function(delta) {
        var ctx, t;
        t = _this.getTileAt(_this.world_pos);
        if (_this.current_mode === "mode-place") {
          if ((_this.selected_tile == null) || (_this.tile_under_mouse == null)) {
            return;
          }
          ctx = _this.renderer.contexts[_this.selected_tile.layer];
          ctx.setTransform(_this._transform[0], _this._transform[3], _this._transform[1], _this._transform[4], _this._transform[2], _this._transform[5]);
          ctx.globalAlpha = 0.5;
          ctx.drawImage(_this.selected_tile_sprite.img, _this.tile_under_mouse.position[0] - _this.selected_tile_x, _this.tile_under_mouse.position[1] - _this.selected_tile_y);
          ctx.globalAlpha = 1.0;
          if (t !== _this.tile_under_mouse) {
            if (_this.tile_under_mouse) {
              _this.tile_under_mouse.drawableOffState(Hal.DrawableStates.Fill);
            }
            _this.tile_under_mouse = t;
            if (_this.tile_under_mouse != null) {
              return _this.tile_under_mouse.drawableOnState(Hal.DrawableStates.Fill);
            }
          }
        }
      });
      return this.on("OVER_NEW_TILE", function(newtile) {
        if (this.tile_under_mouse != null) {
          this.tile_under_mouse.attr("stroke_color", "white");
          this.tile_under_mouse.attr("stroke_width", 0.5);
        }
        newtile.attr("stroke_color", "red");
        newtile.attr("stroke_width", 2);
        if (!newtile.tweener.isAnimating()) {
          return newtile.tween({
            attr: "position[1]",
            from: newtile.position[1],
            to: newtile.position[1] - 10,
            duration: 300
          }).done(function() {
            return this.tween({
              attr: "position[1]",
              from: this.position[1],
              to: this.position[1] + 10,
              duration: 300
            });
          });
        }
      });
    };
    IsometricMap.prototype.destroy = function() {
      IsometricMap.__super__.destroy.call(this);
      Hal.removeTrigger("EDITOR_MODE_CHANGED", this.editor_mode_listener);
      Hal.removeTrigger("TILE_LAYER_SELECTED", this.layer_selected_listener);
      Hal.removeTrigger("MOUSE_MOVE", this.mouse_moved_listener);
      Hal.removeTrigger("LEFT_CLICK", this.left_click_listener);
      return Hal.removeTrigger("EXIT_FRAME", this.show_tilelayer_listener);
    };
    return IsometricMap;
  });

}).call(this);
