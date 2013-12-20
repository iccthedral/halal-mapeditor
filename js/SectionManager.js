(function() {
  "use strict";
  var SectionManager;

  define([], function() {
    var newSectionDescriptor, _section_cache;
    _section_cache = {};
    return newSectionDescriptor = function(row, col, needsRefresh) {
      var name, section;
      name = "" + row + "_" + col;
      section = _section_cache[name];
      if (section == null) {
        section = {
          row: row,
          col: col,
          name: name
        };
      }
      return section;
    };
  });

  SectionManager = (function() {
    function SectionManager(map) {
      this.map = map;
    }

    /*
        @tood
        Loaduj sekciju na osnovu sectdescriptor strukture
    */


    SectionManager.prototype.loadSection = function(sectdescriptor) {};

    SectionManager.prototype.saveSection = function(sectdescriptor) {};

    SectionManager.prototype.fillAsFromCenterSection = function(center_section) {};

    SectionManager.prototype.needsLoading = function(world_center) {};

    return SectionManager;

  })();

}).call(this);
