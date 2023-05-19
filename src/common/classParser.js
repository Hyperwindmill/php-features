const { Uri,workspace,window } = require('vscode');
const fs = require("fs");
const engine = require("php-parser");

class classParser{
    constructor(className,fileContent,filePath){
        this.fileContent=fileContent;
        this.filePath=filePath;
        this.className=className;
    }
    async parseCode(){
        if(!this.fileContent){
            this.fileContent=fs.readFileSync(Uri.parse(this.filePath).fsPath,{encoding:'utf8'});
        } 
        if(!this.fileContent){
            throw 'Unable to read the parent class file';
        }
        if(!this.className){
            throw 'Class name not found';
        }
        const parser = new engine();
        this.ast=await parser.parseCode(this.fileContent);
        if(!this.ast) throw 'Unable to parse parent code';
        this.ast=this.findMyClass(this.ast);
        if(!this.ast) throw 'Parent class not found';
    }
    findMyClass(astData){
        if(!astData) return null;
        if(typeof(astData)=='object'){
            if(astData.hasOwnProperty('name')){
                if(astData.name){
                    if(astData.name.hasOwnProperty('kind') && astData.name.hasOwnProperty('name')){
                        if(astData.name.kind==='identifier' && astData.name.name===this.className){
                            return astData;
                        }
                    }
                }
            }
            if(astData.hasOwnProperty('children')){
                if(typeof(astData.children)==='object' || typeof(astData.children)==='array'){
                    for(const child of astData.children){
                        const childGood=this.findMyClass(child);
                        if(childGood) return childGood;
                    }
                }
            }
        }
        return null;
    }
    async getMethods(overrideable=false){
        await this.parseCode();
        let out={};
        if(this.ast.hasOwnProperty('body')){
            for(const bodyElement of this.ast.body){
                if(bodyElement.hasOwnProperty('kind') && bodyElement.hasOwnProperty('name')){
                    //assuming good element data
                    if(bodyElement.kind==='method'){
                        if(!overrideable || bodyElement.visibility.match(/(protected|public)/)){
                            out[bodyElement.name.name] = bodyElement;
                        }
                    }
                }
            }
        }
        return out;
    }
};
exports.classParser=classParser;