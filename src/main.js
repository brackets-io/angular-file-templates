define(function (require, exports, module) {
    'use strict';
    var commandNewFromTemplate = 'newFromTemplate',
        commandIdh = 'html',
        commandIdj ='js',
        commandIdc ='css',
        commandModule = 'module',
        commandController = 'controller',
        commandFactory = 'factory',
        commandService = 'service',
        commandValue = 'value',
        commandConstant = 'constant';

    var templates = [
        {val: '', name: 'Select one', placeholder: true},
        {val: 'module', name: 'Angular Module'},
        {val: 'controller', name: 'Angular Controller'},
        {val: 'factory', name: 'Angular Factory'},
        {val: 'service', name: 'Angular Service'},
        {val: 'value', name: 'Angular Value'},
        {val: 'constant', name: 'Angular Constant'}
    ];

    var prefix = 'angular-file-templates';

   	var CommandManager = brackets.getModule('command/CommandManager'),
        Commands = brackets.getModule('command/Commands'),
        Menus = brackets.getModule('command/Menus'),
        FileUtils = brackets.getModule('file/FileUtils'),
        FileSystem = brackets.getModule('filesystem/FileSystem'),
        ProjectManager = brackets.getModule('project/ProjectManager'),
        ProjectModel = brackets.getModule('project/ProjectModel'),
        AppInit = brackets.getModule('utils/AppInit'),
        Dialogs = brackets.getModule('widgets/Dialogs'),
        DefaultDialogs = brackets.getModule('widgets/DefaultDialogs'),
        ExtensionUtils = brackets.getModule('utils/ExtensionUtils'),
        EditorManager = brackets.getModule('editor/EditorManager'),
        KeyEvent = brackets.getModule('utils/KeyEvent'),
        PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
        _ = brackets.getModule('thirdparty/lodash');

    var template;
    var dialog;

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
                var parentFolder = path.replace(/\/+\s*$/, '').split('/').slice(0, -1).join('/');
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

    function createNewFile(fileName) {

        var projectPath = ProjectManager.getInitialProjectPath();

        // Get the relative path of the file to be created
        var folders = fileName.split('/');
        // Removes last item of the array, that corresponds with the fileName
        folders.pop();

        // If the user add a / at the begining we must fix it by removing the first element of the array that would be empty
        if(folders[0] === '') {
            folders.shift();
        }

        // Join back all the folders to get the relativePath
        var relativePath = folders.join('/');

        var file = FileSystem.getFileForPath(projectPath + fileName);

        mkdirp(projectPath + relativePath)
            .then(function()   { return createFile(file); })
            .then(function()   { return addFileToWorkingSet(file); });
    }

    function newFromTemplate() {
        promptFilename();
    }

    function newhtml() {
    	template = require('text!config/html-template.html');
    	createNewFile('new.html');
    }

    function newjs() {
    	template = require('text!config/js-template.js');
    	createNewFile('new.js');
    }

    function newcss() {
    	template = require('text!config/css-template.css');
    	createNewFile('new.css');
    }

    function newAngularModule() {
        template = require('text!config/_module.js');
        promptFilename('.module.js');
    }

    function newAngularController() {
        template = require('text!config/_controller.js');
        promptFilename('.controller.js', true);
    }

    function newAngularFactory() {
        template = require('text!config/_factory.js');
        promptFilename('.factory.js', true);
    }

    function newAngularService() {
        template = require('text!config/_service.js');
        promptFilename('.service.js', true);
    }

    function newAngularConstant() {
        template = require('text!config/_constant.js');
        promptFilename('.constant.js', true);
    }

    function newAngularValue() {
        template = require('text!config/_value.js');
        promptFilename('.value.js', true);
    }

    function promptFilename(suffix, needsModuleName) {

        var relativePath = getRelativePath();

        dialog = createDialog();
        var dialogElement = dialog.getElement();

        var moduleNameWrapper = dialogElement.find('#modulename-wrapper')

        var fileNameInput = dialogElement.find('#filename');
        fileNameInput.focus();

        // Creating a new file from template but not selecting any. Must show template selector
        if(!suffix) {
            dialogElement.addClass('has-selector');
            dialogElement.find('#selector-wrapper').addClass('visible');
            var templateSelector = dialogElement.find('#template-selector');
            templateSelector.change(selectChangeHandler);
        }

        var moduleNameInput;

        if(needsModuleName) {
            showModuleNameInput();
        }

        // Set input value current relatvie path
        fileNameInput.val(relativePath);

        fileNameInput.keyup(keyupListener);

        /**
         * Triggers the file creation when the user press RETURN key
         */
        function keyupListener(event) {
            if(event.which === KeyEvent.DOM_VK_RETURN) {
                var fileName = fileNameInput.val();
                if(fileName) {
                    var prefs = PreferencesManager.getExtensionPrefs(prefix);

                    template = Mustache.render(template,
                                {
                                    date: new Date().toLocaleDateString(),
                                    elementName: getElementName(fileName + suffix),
                                    author: prefs.get('author'),
                                    moduleName: moduleNameInput ? moduleNameInput.val() : ''
                                });
                    createNewFile(fileName + suffix);
                    dialog.close();
                    dialog = undefined;
                }
            }
        }

        /**
         * Hides or shows the module name input and reloads the template according to the user selection.
         */
        function selectChangeHandler() {
            if(this.value === 'module') {
                hideModuleNameInput();
            } else {
                showModuleNameInput();
            }
            template = require('text!config/_' + this.value + '.js');
            suffix = '.' + this.value + '.js';
        }

        function showModuleNameInput() {
            dialogElement.addClass('has-modulename')
            moduleNameWrapper.addClass('visible');
            moduleNameInput = dialogElement.find('#modulename');
            moduleNameInput.keyup(function(event) { keyupListener(event, fileNameInput, moduleNameInput, suffix) });
        }

        function hideModuleNameInput() {
            dialogElement.removeClass('has-modulename');
            moduleNameWrapper.removeClass('visible');
            moduleNameInput && moduleNameInput.off('keyup');
            moduleNameInput = undefined;
        }
    }

    function getRelativePath() {
        var relativePath = '';
        if (ProjectManager.getSelectedItem()) {
            var isSelectingDirectory = !FileSystem.getFileForPath(ProjectManager.getSelectedItem()._path)._isFile;
            var elementPath = isSelectingDirectory ? ProjectManager.getSelectedItem()._path : ProjectManager.getSelectedItem().parentPath;
            var projectPath = ProjectManager.getInitialProjectPath();

            relativePath = elementPath.replace(projectPath, '');
        }


        return relativePath;
    }

    function createDialog() {
        ExtensionUtils.loadStyleSheet(module, 'styles/styles.css');

        var dialogTemplate = require('text!templates/prompt-filename.html');
        var compiledTemplate = Mustache.render(dialogTemplate, {templates: templates});

        return Dialogs.showModalDialogUsingTemplate(compiledTemplate);
    }

    function getElementName(filepath) {
        var fileName = filepath.split('/').pop();
        fileName = fileName.slice(0, filename.lastIndexOf('.'));

        return _.capitalize(_.camelCase(fileName));
    }

    // Commands
    CommandManager.register('New from template', commandNewFromTemplate, newFromTemplate);
    CommandManager.register('New Angular module', commandModule, newAngularModule);
    CommandManager.register('New Angular controller', commandController, newAngularController);
    CommandManager.register('New Angular factory', commandFactory, newAngularFactory);
    CommandManager.register('New Angular service', commandService, newAngularService);
    CommandManager.register('New Angular value', commandValue, newAngularValue);
    CommandManager.register('New Angular constant', commandConstant, newAngularConstant);
    CommandManager.register('New html', commandIdh, newhtml);
    CommandManager.register('New js', commandIdj, newjs);
    CommandManager.register('New css', commandIdc, newcss);

    // Menus
    var fileMenu = Menus.getMenu('file-menu');

    fileMenu.addMenuItem(commandNewFromTemplate,[{key: 'Ctrl-Shift-N'}], Menus.AFTER, Commands.FILE_NEW_UNTITLED);

    var menu = Menus.addMenu('New as', 'edgedocks.custom.menu' );

    menu.addMenuItem(commandModule,[{key: 'Ctrl-Alt-Shift-M', platform: 'win'}, {key: 'Ctrl-Opt-Shift-M', platform: 'mac'}]);
    menu.addMenuItem(commandController,[{key: 'Ctrl-Alt-Shift-C', platform: 'win'}, {key: 'Ctrl-Opt-Shift-C', platform: 'mac'}]);
    menu.addMenuItem(commandFactory,[{key: 'Ctrl-Alt-Shift-F', platform: 'win'}, {key: 'Ctrl-Opt-Shift-F', platform: 'mac'}]);
    menu.addMenuItem(commandService,[{key: 'Ctrl-Alt-Shift-S', platform: 'win'}, {key: 'Ctrl-Opt-Shift-S', platform: 'mac'}]);
    menu.addMenuItem(commandValue,[{key: 'Ctrl-Alt-Shift-V', platform: 'win'}, {key: 'Ctrl-Opt-Shift-V', platform: 'mac'}]);
    menu.addMenuItem(commandConstant,[{key: 'Ctrl-Alt-Shift-N', platform: 'win'}, {key: 'Ctrl-Opt-Shift-N', platform: 'mac'}]);
    menu.addMenuItem(commandIdh,[{key: 'Ctrl-Shift-h', platform: 'win'}, {key: 'Ctrl-Shift-h', platform: 'mac'}]);
    menu.addMenuItem(commandIdj,[{key: 'Ctrl-Shift-j', platform: 'win'}, {key: 'Ctrl-Shift-j', platform: 'mac'}]);
    menu.addMenuItem(commandIdc,[{key: 'Ctrl-Shift-c', platform: 'win'}, {key: 'Ctrl-Shift-c', platform: 'mac'}]);

    Menus.getContextMenu(Menus.ContextMenuIds.PROJECT_MENU).addMenuItem(commandNewFromTemplate, undefined, Menus.AFTER, Commands.FILE_NEW_UNTITLED);
});
