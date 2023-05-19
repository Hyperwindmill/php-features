const {  window } = require('vscode')
exports.openChoice=async(items,callBack,many=true)=>{
    const pick=window.createQuickPick();
    let selected=[];
    pick.items=items;
    pick.canSelectMany=(many?true:false);
    pick.onDidChangeSelection((selection)=>{
        selected=selection;
    });
    pick.onDidAccept(async()=>{
        await callBack(selected);
        pick.dispose();
    })
    pick.onDidHide(() => pick.dispose());
    pick.show();
};