const { window,commands } = require('vscode');
const { getConfig } = require('./config');
const {openChoice}=require('./common/ListChoice');
const {classParser}=require('./common/classParser');

exports.classFunctions = class classFunctions {
    static capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    static async overrideMethod() {
        try {
            const editor = window.activeTextEditor;
            if (typeof (editor) === 'undefined') return;
            const currentText = editor.document.getText();
            const varRegx = new RegExp(/class\s*?(?<clname>[a-zA-Z0-9]+)\s*?extends\s*?(?<parent>[a-zA-Z0-9]+)/, "gi");
            const match = varRegx.exec(currentText);
            if (!match) return;
            const sposition = editor.document.positionAt(currentText.search(match[0]) + (match[0].length - 1));
            const definition = await commands.executeCommand('vscode.executeDefinitionProvider', editor.document.uri, sposition);
            if (!definition[0]) throw 'Definition not found';
            let parentPath;
            if (definition[0].targetUri) {
                parentPath = definition[0].targetUri.path;
            } else if (definition[0].uri) {
                parentPath = definition[0].uri.path;
            } else {
                throw 'No compatible intellisense found';
            }
            const parentParser = new classParser(match.groups.parent, null, parentPath);
            await parentParser.getMethods();
        }
        catch (e) {
            window.showErrorMessage(e);
            console.log(e);
        }
    }
    static async addGettersAndSetters() {
        try {
            const editor = window.activeTextEditor;
            if (typeof (editor) === 'undefined') return;
            const currentText = editor.document.getText();
            const varRegx = new RegExp(/(?<mod>private|protected)\s*?(?<type>[a-zA-Z0-9]+)?\s*?(?<label>\$[a-zA-Z0-9]+)\s*?(=|;)/, "gi");
            let variables = [];
            let match;
            while (match = varRegx.exec(currentText)) {
                variables.push(match?.groups);
            }
            variables = variables.filter((varv) => {
                const pattern = 'function (g|s)et' + (varv.label.substring(1)) + '\\(';
                const getSetterRegx = new RegExp(pattern, 'i');
                if (getSetterRegx.test(currentText)) {
                    return false;
                }
                return true;
            });
            if (variables.length > 0) {
                openChoice(variables, async (selected) => {
                    if (selected.length > 0) {
                        let newSetters = [];
                        const withTypes = getConfig('activate.typedVariables', true);
                        const returnThis = getConfig('activate.returnThis', false);
                        for (const cvar of selected) {
                            newSetters.push(`\tpublic function get${this.capitalizeFirstLetter(cvar.label.substr(1))}()${(withTypes && typeof (cvar.type) !== 'undefined' ? `: ${cvar.type}` : '')}{\n\t\treturn $this->${cvar.label.substr(1)};\n\t}\n`);
                            newSetters.push(`\tpublic function set${this.capitalizeFirstLetter(cvar.label.substr(1))}(${(withTypes && typeof (cvar.type) !== 'undefined' ? `${cvar.type} ` : '')}$value)${(withTypes ? `:${(returnThis ? ' self' : ' void')}` : '')}{\n\t\t$this->${cvar.label.substr(1)}=$value;${(returnThis ? `\n\t\treturn $this;` : '')}\n\t}\n`);
                        }
                        const position = editor.selection;
                        editor.edit(builder => {
                            builder.replace(position, newSetters.join(""));
                        });
                    }
                });
            }
        }
        catch (e) {
            console.log(e);
        }
    }
}