"use strict"

define [], () ->
    _section_cache = {}

    newSectionDescriptor = (row, col, needsRefresh) ->
        name = "#{row}_#{col}"
        section = _section_cache[name]
        if not section?
            section = 
                row: row
                col: col
                name: name
        return section

	class SectionManager
        constructor: (@map) ->

        ###
            @tood
            Loaduj sekciju na osnovu sectdescriptor strukture
        ###
        loadSection: (sectdescriptor) ->
            return

        saveSection: (sectdescriptor) ->
            return

        fillAsFromCenterSection: (center_section) ->

        needsLoading: (world_center) ->
            if @_update_transform
                return
            return

