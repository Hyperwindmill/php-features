const { Uri, window, workspace } = require('vscode');
const { getNamespaceFromPath } = require('./namespace');
const interact = require('./interact');

exports.classCreator=class classCreator{
    static createPHPFile(folder) {
        if (!folder || !folder.fsPath) {
            interact.askFolder().then(folder => {
                if (folder !== undefined) {
                    this.createPHPFile(Uri.parse(folder))
                }
            })
            return
        }
    
        interact.ask('class name').then((name) => {
            if (name.toLowerCase().endsWith('.php')) {
                name = name.substring(0, name.length -4)
            }
    
            if (name === undefined || name.length < 1) {
                return
            }
    
            const filename = folder.fsPath + '/' + name + '.php'
    
            this.createNewFile(
                filename,
                this.generate(name, getNamespaceFromPath(filename))
            )
        })
    }
    
    static createNewFile(filename, content) {
        const fileUri = Uri.file(filename)
    
        workspace.fs.stat(fileUri).then(() => {
            interact.error(
                'File "' + workspace.asRelativePath(fileUri) + '" already exists'
            )
        }, () => {
            workspace.fs.writeFile(fileUri, new TextEncoder().encode(content)
            ).then(() => {
                workspace.openTextDocument(fileUri).then(
                    document => window.showTextDocument(document).then(
                        document => interact.moveCursorTo(document.document.lineCount - 3, 4)
                    )
                )
            })
        })
    }
    
    static generate(name, ns) {
        let category = 'class'
        let uses = ''
        let extending = ''
    
        if (this.detectSuffix(name, 'class.detectTestCase', 'Test')) {
            uses = 'use PHPUnit\\Framework\\TestCase;\n\n'
            extending = ' extends TestCase'
        } else if (this.detectSuffix(name, 'class.detectInterface', 'Interface')) {
            category = 'interface'
        }
    
        return '<?php\n\n'
            + 'namespace ' + ns + ';\n\n'
            + uses
            + category + ' ' + name + extending + '{\n'
            + '    \n}\n'
    }
    
    static detectSuffix(name, option, suffix) {
        return name !== suffix && name.endsWith(suffix);
    }
}