import * as cp from 'child_process';

// Call a local bash scripts to launch the piper speech engine
export default class Piper{

    // Danger. Throught trial and error I found the the audio process is on pid +3
    // I believe the shell is running on pid +1, piper is on pid +2 and aplay on pid +3
    stop(pid:number){
        return new Promise( (res, rej) => {
            if (pid != -1 ){
                process.kill(pid + 2);
                process.kill(pid + 3);
                return res;
            }
            return rej;
        });
    }

    export(text:string, voice:string | undefined, filename:string){
        cp.execFile(`export_piper.sh`, [voice!, filename, text])
    }

    speak(text:string, voice:string | undefined, speed:Number | undefined){

        let child = cp.execFile(`read_piper.sh`, [voice!, text]);
        let child_id = child.pid ? child.pid : -1;
        return child_id;
    }
}
