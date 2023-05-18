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
    }
    async getMethods(overrideable=false){
        await this.parseCode();
        console.log(JSON.stringify(this.ast));
    }
};
exports.classParser=classParser;