const {  window } = require('vscode')
exports.openChoice=async(items,callBack)=>{
    const pick=window.createQuickPick();
    let selected=[];
    pick.items=items;
    pick.canSelectMany=true;
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