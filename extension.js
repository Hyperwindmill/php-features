const { commands } = require('vscode');
const { classCreator } = require('./src/classCreator');
const { classFunctions } = require('./src/classFunctions');
const { getConfig } = require('./src/config');

function activate(context) {
    if (getConfig('activate.menuHelpers', true)) {
        context.subscriptions.push(
            commands.registerCommand('phpfeatures.newPHPClass', (folder) => classCreator.createPHPFile(folder))
        )
        context.subscriptions.push(
            commands.registerCommand('phpfeatures.gettersAndSetters', classFunctions.addGettersAndSetters),
            commands.registerCommand('phpfeatures.overrideMethod', classFunctions.overrideMethod),
        )
    }
}
function deactivate() { }
exports.activate = activate
exports.deactivate = deactivate