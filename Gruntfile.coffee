module.exports = (grunt) ->       
    fs      = require "fs"
    path    = require "path"
    wrench  = require "wrench"

    log     = console.log
    socket  = null

    ###
        Meta information and settings
    ###
    config =
        pub_dir: "."
        sprite_dir: "assets/sprites"
        sprite_list: "assets/sprites.list"
        cur_dir: process.cwd()
        tiles: "assets/tiles.list"
        maps: "assets/maps.list"
        tiles_seeds: "assets/tiles_seeds.txt"
        amjad_map_dir: "assets/map/"
        js_dir: "js#{path.sep}"
        coffee_dir: "coffee#{path.sep}"

    grunt.loadNpmTasks("grunt-contrib-coffee")
    grunt.loadNpmTasks("grunt-contrib-connect")
    grunt.loadNpmTasks("grunt-contrib-watch")
    grunt.initConfig
        pkg: grunt.file.readJSON("package.json")

        coffee:
            glob_all:
                expand: true
                cwd: "#{config.coffee_dir}"
                src: ["**/*.coffee"]
                dest: "#{config.js_dir}"
                ext: ".js"
            
            all: 
                expand: true
                flatten: false
                src: ["**/*.coffee"]
                cwd: "#{config.coffee_dir}"
                dest: "#{config.js_dir}"
                ext: ".js"
                
        watch:
            coffee:
                files: [
                    "#{config.coffee_dir}/**/*.coffee"
                ]
                tasks: ["coffee:glob_all"]
            
            options:
                nospawn: true
                livereload: false

        connect:
            server:
                options:
                    keepalive: false
                    port: 9000
                    base: config.pub_dir
                    debug: false

    is_win         = !!process.platform.match(/^win/)
    is_sprite      = is_spritesheet = /^.*\.[png|jpg]+$/
    is_json        = /^.*\.[json]+$/
    all_tiles      = null
    all_sprites    = null

    console.log "Is windows: #{is_win}"
    console.log "Platform #{process.platform}"

    #fora da imam jedinstvene tajlove po razlicitim racunarima
    generating_seed = default_seed = 0xABCDEF
    #nece ih biti vise od 2^16, da ga jebem
    predict_tiles = 0xFFFF

    #solidan randomizer sa http://stackoverflow.com/questions/521295/javascript-random-seeds
    #potrebno je pozvati ga sa seed--, ako hocu da brisem tajl
    tiles_randomizator = () ->
        x = Math.sin(generating_seed++) * 10000;
        return x - Math.floor(x)

    saveSprites = (sprites) ->
        sprites = sprites.map(
            (x) ->
                return "sprites/#{x}"
        )
        fs.writeFileSync(config.sprite_list, sprites.join().replace(/,/g,"\n"))

    #load all tiles
    all_tiles = do getAllTiles = () ->
        generating_seed = default_seed = 0xABCDEF
        out = fs.readFileSync(config.tiles)
        out = JSON.parse(out)
        for key, tile of out
            id = Math.floor(tiles_randomizator() * predict_tiles)
            tile["id"] = id
            console.log "#: #{id}".green
        try
            fs.writeFileSync(config.tiles, JSON.stringify(out))
        catch err
            console.log err
        return out

    #load all sprites
    all_sprites = do getAllSprites = () ->
        out = wrench.readdirSyncRecursive(config.sprite_dir)
        out = out.filter((x) -> return is_sprite.test(x))
        if is_win
            out = out.map (x) -> return x.replace(/\\/g,"\/")
        return out

    #load the latest seed
    generating_seed = do loadSeed = () ->
        if fs.existsSync config.tiles_seeds
            seeds = fs.readFileSync(config.tiles_seeds).toString().split("\n")
            if seeds.length >= 2
                seed = seeds[0]
            else
                throw "wtf"
        else
            seed = default_seed
            fs.appendFileSync(config.tiles_seeds, default_seed.toString()+"\n")
        console.log "Last seed used: #{seed}".green
        return seed

    saveSprites(all_sprites)

    io = require("socket.io").listen(8080, {log: true})
    io.sockets.on "connection", (sck) ->
        console.log "Connection via socket.io established".green
        socket = sck

        all_sprites = getAllSprites()
        saveSprites(all_sprites)
        all_tiles = getAllTiles()

        socket.emit "LOAD_SPRITES", 
            files: JSON.stringify(all_sprites)
            url: "sprites/"
        
        socket.on "LOAD_MAPEDITOR_ASSETS", () ->
            socket.emit("LOAD_TILES", all_tiles)

        socket.on "TILE_SAVED", (tile) ->
            tile = JSON.parse(tile)
            console.log "New tile #{tile.name}".yellow
            list = JSON.parse(fs.readFileSync(config.tiles))
            id = Math.floor(tiles_randomizator() * predict_tiles)
            tile["id"] = id
            list[tile.name] = tile
            try
                fs.writeFileSync(config.tiles, JSON.stringify(list))
            catch err
                console.log err.red
            socket.emit "TILE_ADDED", tile

        ### @todo ###
        socket.on "TILE_REMOVED", (tile) ->
            return

        socket.on "SAVE_MAP_SECTION", (data) ->
            section = JSON.parse(data)
            name = section.start[0] + "_" + section.start[1]
            console.log "New map section #{section.start}".yellow
            try
                fs.writeFileSync(config.amjad_map_dir + name, section.section)
            catch err
                console.log err.red
            socket.emit "MAP_SECTION_SAVED", name

    grunt.event.on "watch", (action, filepath) ->
        log filepath.red
        filepath = filepath.replace(grunt.config("coffee.glob_all.cwd"), "")
        grunt.config("coffee.glob_all.src", [filepath])
        
    grunt.registerTask "serve", ["connect:server", "watch"]

    grunt.registerTask "compile", "Compiling Halal Map editor", () ->
        spawn = require("child_process").spawn
        proc = spawn "r.js", ["-o", "build.js"]

        proc.stdout.setEncoding("utf8")
        proc.stderr.setEncoding("utf8")

        proc.stdout.on "data", (data) ->
            console.log data.yellow
        proc.stderr.on "data", (data) ->
            console.log data.red

        proc.on "exit", (retcode) ->
            console.log retcode
            console.log "Done compiling".green

        proc.on "close", (retcode) ->
            console.log retcode
            console.log "Done compiling".green