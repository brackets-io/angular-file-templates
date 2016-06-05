define(function (require, exports, module) {
    "use strict";
    var commandIdh = "html";
    var commandIdj ="js";
    var commandIdc ="css";
    var commandIdp = "php";
    var commandModule = 'module';
    var prefix = 'newfile-from-template';
   	var CommandManager = brackets.getModule("command/CommandManager"),
        Commands = brackets.getModule("command/Commands"),
        Menus = brackets.getModule("command/Menus"),
        FileUtils = brackets.getModule("file/FileUtils"),
        FileSystem = brackets.getModule("filesystem/FileSystem"),
        ProjectManager = brackets.getModule("project/ProjectManager"),
        ProjectModel = brackets.getModule("project/ProjectModel"),
        AppInit = brackets.getModule("utils/AppInit"),
        Dialogs = brackets.getModule("widgets/Dialogs"),
        DefaultDialogs = brackets.getModule("widgets/DefaultDialogs"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        EditorManager = brackets.getModule("editor/EditorManager"),
        KeyEvent = brackets.getModule("utils/KeyEvent"),
        PreferencesManager = brackets.getModule("preferences/PreferencesManager");

    var template;
    function mkdir(dir) {
        var promise = $.Deferred();
        dir.create(function(err, stat){
            if(err) { promise.reject(err); }
            else    { promise.resolve(); }
        });
        return promise;
    }

    function mkdirp(path) {
        var dir = FileSystem.getDirectoryForPath(path);
        var promise = $.Deferred();

        dir.exists(function(err, exists){
            if(!exists)
            {
                var parentFolder = path.replace(/\/+\s*$/, "").split('/').slice(0, -1).join('/');
                mkdirp(parentFolder).then(function(){
                    dir.create(function(err, stat){
                        if(err) { promise.reject(err); }
                        else    { promise.resolve(); }
                    });
                })
                .fail(function(err){
                    promise.reject(err);
                });
            }
            else {
                promise.resolve();
            }
        });

        return promise;
    }

    function createFile(file) {
        var promise = $.Deferred();
        file.write(template, {}, function(err, stat){
            if(err) { promise.reject(err); }
            else    { promise.resolve(); }
        });
        return promise;
    }

    function addFileToWorkingSet(file) {
        return CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, {fullPath: file.fullPath});
    }

    function createNewFile(filename) {

        var projectPath = ProjectManager.getInitialProjectPath();

        // Get the relative path of the file to be created
        var folders = filename.split('/');
        // Removes last item of the array, that corresponds with the filename
        folders.pop();

        // If the user add a / at the begining we must fix it by removing the first element of the array that would be empty
        if(folders[0] === '') {
            folders.shift();
        }

        // Join back all the folders to get the relativePath
        var relativePath = folders.join('/');

        var file = FileSystem.getFileForPath(projectPath + filename);

        mkdirp(projectPath + relativePath)
            .then(function()   { return createFile(file); })
            .then(function()   { return addFileToWorkingSet(file); });
    }

    function newhtml() {
    	template = require('text!html-template.html');
    	createNewFile('new.html');
    }
    function newjs() {
    	template = require('text!js-template.js');
    	createNewFile('new.js');

    }
    function newcss() {
    	template = require('text!css-template.css');
    	createNewFile('new.css');

    }
    function newphp() {
        template = require('text!php-template.php');
 		createNewFile('new.php');
    }

    function newAngularModule() {
        template = require('text!config/angular.module.js');
        promptFilename('.module.js');
    }

    function promptFilename(suffix) {

        var relativePath = getRelativePath();

        var dialog = createDialog();
        var dialogElement = dialog.getElement();

        var filenameInput = dialogElement.find('#filename');
        // Set input value current relatvie path
        filenameInput.val(relativePath);

        filenameInput.keyup(function(event) { keyupListener(event, filename, suffix) });
    }

    function getRelativePath() {
        var elementPath = ProjectManager.getSelectedItem().parentPath;
        var projectPath = ProjectManager.getInitialProjectPath();

        return elementPath.replace(projectPath, '');
    }

    function createDialog() {
        ExtensionUtils.loadStyleSheet(module, "styles.css");
        var dialogTemplate = require("text!templates/prompt-filename.html");
        var compiledTemplate = Mustache.render(dialogTemplate);

        return Dialogs.showModalDialogUsingTemplate(compiledTemplate);
    }

    /**
     * Triggers the file creation when the user press RETURN key
     */
    function keyupListener(event, filename, suffix) {
        if(event.which === KeyEvent.DOM_VK_RETURN) {
            var filename = filenameInput.val();
            if(filename) {
                var prefs = PreferencesManager.getExtensionPrefs(prefix);

                template = Mustache.render(template,
                            {
                                date: new Date().toLocaleDateString(),
                                moduleName: filename.split('/')[filename.split('/').length - 1],
                                author: prefs.get('author')
                            });
                createNewFile(filename + suffix);
                dialog.close();
            }
        }
    }

//command
CommandManager.register("New Angular module", commandModule, newAngularModule);
CommandManager.register("New html", commandIdh, newhtml);
CommandManager.register("New js", commandIdj, newjs);
CommandManager.register("New css", commandIdc, newcss);
CommandManager.register("New php", commandIdp, newphp);
//Menus
var menu = Menus.addMenu("New as", "edgedocks.custom.menu" );
 menu.addMenuItem(commandIdh,[{key: "Ctrl-Shift-h", platform: "win"},
{key: "Ctrl-Shift-h", platform: "mac"}]);
 menu.addMenuItem(commandIdj,[{key: "Ctrl-Shift-j", platform: "win"},
{key: "Ctrl-Shift-j", platform: "mac"}]);
 menu.addMenuItem(commandIdc,[{key: "Ctrl-Shift-c", platform: "win"},
{key: "Ctrl-Shift-c", platform: "mac"}]);
 menu.addMenuItem(commandIdp,[{key: "Ctrl-Shift-p", platform: "win"},
{key: "Ctrl-Shift-p", platform: "mac"}]);
menu.addMenuItem(commandModule,[{key: "Ctrl-Alt-Shift-m", platform: "win"},
{key: "Ctrl-Opt-Shift-m", platform: "mac"}]);
});
