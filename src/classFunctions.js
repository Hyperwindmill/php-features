const { window, commands,ProgressLocation,SnippetString } = require('vscode');
const { getConfig } = require('./config');
const { openChoice } = require('./common/ListChoice');
const { classParser } = require('./common/classParser');
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
exports.classFunctions = class classFunctions {

    static async overrideMethod(){
        try{
            await window.withProgress({
                location: ProgressLocation.Notification,
                title: "Override methods",
                cancellable: true
            },async(progress,token)=>{
                progress.report({ increment: 0 });
                const editor = window.activeTextEditor;
                if(typeof(editor)==='undefined') return;
                const currentText=editor.document.getText();
                progress.report({ increment: 10, message: "Searching parent class..." });
                const varRegx=new RegExp(/class\s*?(?<clname>[a-zA-Z0-9]+)\s*?extends\s*?(?<parent>[a-zA-Z0-9]+)/,"gi");
                const match=varRegx.exec(currentText);
                if(!match) return;
                const sposition=editor.document.positionAt(currentText.search(match[0])+(match[0].length-1));
                progress.report({ increment: 30, message: "Looking for definition..." });
                const definition = await commands.executeCommand('vscode.executeDefinitionProvider', editor.document.uri,sposition);
                if(!definition[0]) throw 'Definition not found';
                let parentPath;
                if(definition[0].targetUri){
                    parentPath=definition[0].targetUri.path;
                }else if(definition[0].uri){
                    parentPath=definition[0].uri.path;
                }else{
                    throw 'No compatible intellisense found';
                }
                progress.report({ increment: 60, message: "Parsing parent class..." });
                const parentParser=new classParser(match.groups.parent,null,parentPath);
                const methods=await parentParser.getMethods();
                
                progress.report({ increment: 80, message: "Parsing current class..." });
                const currentParser=new classParser(match.groups.clname,currentText);
                const currentMethods=await currentParser.getMethods();
                let finalMethods=[];
                progress.report({ increment: 90, message: "Extracting final methods..." });
                for(const mt in methods){
                    if(typeof(currentMethods[mt])==='undefined'){
                        finalMethods.push({label:mt,element:methods[mt]});
                    }
                }
                progress.report({ increment: 100, message: "Methods extracted" });
                if(finalMethods.length>0){
                    openChoice(finalMethods,async(selected)=>{
                        if(selected.length>0){
                            for(const methodData of selected){
                                const snip=new SnippetString(`\t${methodData.element.visibility} function ${methodData.element.name.name}(${
                                    methodData.element.arguments.map((el)=>{
                                        let type='';
                                        let name=`\\$${el.name.name}`;
                                        let inVal='';
                                        if(el.type){
                                            type=el.type.raw+' ';
                                        }
                                        if(el.value){
                                            if(el.value.kind==='number'){
                                                inVal='="'+el.value+'"';
                                            }
                                            else{
                                                inVal='='+el.value;
                                            }
                                        }
                                        return `${type}${name}${inVal}`;
                                    }).join(', ')
                                }){\n\t\t$0\n\t}`);
                                await editor.insertSnippet(snip,editor.selection.active);
                                break;//make sure just 1
                            }
                        }
                    },false);
                }
            });
        }
        catch(e){
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
                            newSetters.push(`\tpublic function get${capitalizeFirstLetter(cvar.label.substr(1))}()${(withTypes && typeof (cvar.type) !== 'undefined' ? `: ${cvar.type}` : '')}{\n\t\treturn $this->${cvar.label.substr(1)};\n\t}\n`);
                            newSetters.push(`\tpublic function set${capitalizeFirstLetter(cvar.label.substr(1))}(${(withTypes && typeof (cvar.type) !== 'undefined' ? `${cvar.type} ` : '')}$value)${(withTypes ? `:${(returnThis ? ' self' : ' void')}` : '')}{\n\t\t$this->${cvar.label.substr(1)}=$value;${(returnThis ? `\n\t\treturn $this;` : '')}\n\t}\n`);
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