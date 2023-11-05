import * as vscode from 'vscode';
import Piper from './pipe_proccess';

let piper:Piper;
let output:vscode.OutputChannel;
let active_voice = -1;

const getVoice = (): string | undefined => 
    vscode.workspace.getConfiguration('speech').get<string>('voice');

const getSpeed = (): number | undefined =>
    vscode.workspace.getConfiguration('speech').get<number>('speed');

const getSubstitutions = (): { [key: string]: string } => 
    vscode.workspace.getConfiguration('speech').get<{ [key: string]: string }>('substitutions') || {};

const outputChannel = (text:string) => {
    if(!output){
        output = vscode.window.createOutputChannel("VSCode Speech");
    }
    output.appendLine(text);
}

const setVoice = async (newVoice:string) => {
    await vscode.workspace.getConfiguration().update("speech.voice", newVoice, vscode.ConfigurationTarget.Global);
}

const stopSpeaking = () => {
    outputChannel(`[${active_voice}] stopping voice`);
    piper.stop(active_voice).then(() => {
        active_voice = -1;
    })
}

const cleanText = (text: string): string => {
    text = text.trim();
    
    // escape quotation characters
    text = text.replaceAll(`"`, "\"");
    text = text.replaceAll(`'`, "\'");
    text = text.replaceAll(`;`, "\;");

    for (let [pattern, replacement] of Object.entries(getSubstitutions())) {
        text = text.replaceAll(pattern, replacement);
    }
    return text;
}


// ---------------- SPEAK FUNCTIONS ----------
const speakText = (text: string) => {
    text = cleanText(text);
    if (text.length > 0) {
        vscode.window.showInformationMessage(`${getVoice()} started speaking`)
        active_voice = piper.speak(text, getVoice(), getSpeed());
        outputChannel(`[${active_voice}] Starting Speech with voice ${getVoice()}`);
    }
};

const speakCurrentSelection = (editor: vscode.TextEditor) => {
    const selection = editor.selection;
    if (!selection)
        return;

    speakText(editor.document.getText(selection));
};

const speakDocument = (editor: vscode.TextEditor) => {
    speakText(editor.document.getText());
};


// ---------------- EXPORT FUNCTIONS ----------

const exportText = (text: string) => {
    text = cleanText(text);
    if (text.length > 0) {
        let filename = vscode.window.activeTextEditor?.document.fileName;
        if (!filename) filename = 'output';
        vscode.window.showInformationMessage(`create audio file: ${filename}.wav`);
        piper.export(text, getVoice(), filename);
    }
};

const exportCurrentSelection = (editor: vscode.TextEditor) => {
    const selection = editor.selection;
    if (selection)
        exportText(editor.document.getText(selection));
};

const exportDocument = (editor: vscode.TextEditor) => {
    exportText(editor.document.getText());
};


// ---------------- ACTIVATE ----------

export function activate(context: vscode.ExtensionContext) {
    
    piper = new Piper();
    outputChannel("activating vscode-speech extension!");

    context.subscriptions.push(vscode.commands.registerTextEditorCommand('speech.setVoice', async (editor) => {
        vscode.window.showQuickPick(
            ["amy", "joe", "alan", "nem", "ryan", "art", "alba", "aru", "les", "lee"], {
            onDidSelectItem: item => {
                setVoice(item.toString());
            }
        });
    }));

    context.subscriptions.push(vscode.commands.registerTextEditorCommand('speech.exportSelection', async (editor) => {
        if (editor){
            exportCurrentSelection(editor);
        }
    }));

    context.subscriptions.push(vscode.commands.registerTextEditorCommand('speech.exportDocument', async (editor) => {
        if (editor){
            exportDocument(editor);
        }
    }));

    context.subscriptions.push(vscode.commands.registerTextEditorCommand('speech.speakDocument', (editor) => {
        stopSpeaking();
        if (!editor)
            return;
        speakDocument(editor);
    }));

    context.subscriptions.push(vscode.commands.registerTextEditorCommand('speech.speakSelection', (editor) => {
        stopSpeaking();
        if (!editor)
            return;
        speakCurrentSelection(editor);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('speech.stopSpeaking', () => {
        stopSpeaking();
    }));
}
