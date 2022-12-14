import { ForegroundColor } from 'chalk';
import { ConsoleManager, OptionPopup, InputPopup, PageBuilder, ButtonPopup, ConfirmPopup } from 'console-gui-tools-cjs';
import { Endpoint, EndpointGuiOptions } from './endpoint';

type EndpointDesc = {
    endpoint: Endpoint<any>;
    displayName: string;
    status: 'waiting' | 'running' | 'finished' | 'error' | 'pushed' | 'cleared';
    value: any;
    guiOptions: EndpointGuiOptions<any>;
}

export class GuiManager {
    public static instance: GuiManager = null;

    protected title = 'RxJs-ETL-Kit'; // Title of the console
    public isPaused: boolean = false;
    public makeStepForward: boolean = false;
    protected consoleManager: ConsoleManager;
    protected endpoints: EndpointDesc[] = [];

    constructor(title = '', startPaused = false, logPageSize = 8) {
        if (GuiManager.instance) throw new Error("GuiManager: gui manager allready created. You cannot create more then one gui manager.");

        GuiManager.instance = this;

        this.consoleManager = new ConsoleManager({
            title: this.title,
            logPageSize,            // Number of lines to show in logs page
            showLogKey: 'ctrl+l',   // Change layout with ctrl+l to switch to the logs page
        })
        
        this.title = title;
        this.isPaused = startPaused;

        for(let i = 0; i < logPageSize; i++) this.consoleManager.log('');

        // this.consoleManager.on("exit", () => {
        //     this.exit();
        // })

        // And manage the keypress event from the library
        this.consoleManager.on("keypressed", (key) => {
            switch (key.name) {
                case 'space':
                    this.isPaused = !this.isPaused;
                    this.updateConsole();
                    break
                case 'return':
                    this.makeStepForward = this.isPaused;
                    break
                case 'escape':
                    new ConfirmPopup("popupQuit", "Exit application", "Are you sure want to exit?").show().on("confirm", () => this.quitApp())
                    break
                default:
                    break
            }
        })

        
    }

    public quitApp() {
        process.exit();
    }

    // Creating a main page updater:
    protected updateConsole(){
        const p: PageBuilder = new PageBuilder();

        p.addRow({ text: " Process:  ", color: 'white' }, { text: `${this.isPaused ? ' paused ' : ' started '}`, color: 'black', bold: true, bg: this.isPaused ? 'bgYellow' : 'bgGreen' });

        p.addSpacer();

        p.addRow({ text: "Endpoints:", color: 'white', bg: 'bgBlack' });
        this.endpoints.forEach(desc => {
            let color: ForegroundColor;
            switch (desc.status) {
                case 'running':
                    color = 'blue';
                    break;
                case 'finished':
                    color = 'green';
                    break;
                case 'error':
                    color = 'red';
                    break;
                case 'pushed':
                    color = 'magenta';
                    break;
                case 'cleared':
                    color = 'yellow';
                    break;
                case 'waiting':
                    color = 'white';
                    break;
                default:
                    color = 'white';
            }
            p.addRow({ text: `  ` }, 
                { text: `${this.getEndpointDisplayName(desc)}`, color: 'blue' }, 
                { text: `  ${desc.status.padEnd(8, ' ')}`, color }, 
                { text: `  ${desc.value ? (desc.guiOptions.watch && desc.status !== 'error' ? desc.guiOptions.watch(desc.value) : desc.value) : ''}`, color: 'white' });
        })

        // Spacer
        p.addSpacer();

        // if (lastErr.length > 0) {
        //     p.addRow({ text: lastErr, color: 'red' })
        //     p.addSpacer(2)
        // }

        p.addRow({ text: "Commands:", color: 'white', bg: 'bgBlack' });
        p.addRow({ text: `  'space'`, color: 'gray', bold: true },  { text: `   - Pause/resume process`, color: 'white', italic: true });
        p.addRow({ text: `  'enter'`, color: 'gray', bold: true },  { text: `   - Make one step in paused mode`, color: 'white', italic: true });
        p.addRow({ text: `  'esc'`, color: 'gray', bold: true },    { text: `     - Quit`, color: 'white', italic: true });

        this.consoleManager.setPage(p)
    }

    public log(message: string) {
        this.consoleManager.log(message);
    }
    public warn(message: string) {
        this.consoleManager.warn(message);
    }
    public error(message: string) {
        this.consoleManager.error(message);
    }
    public info(message: string) {
        this.consoleManager.info(message);
    }

    public registerEndpoint(endpoint: Endpoint<any>, guiOptions: EndpointGuiOptions<any> = {}) {
        const displayName = guiOptions.displayName ? guiOptions.displayName : `Endpoint ${this.endpoints.length}`;
        const desc: EndpointDesc = {endpoint, displayName, status: 'waiting', value: '', guiOptions};
        this.endpoints.push(desc);

        endpoint.on('read.start', () => { desc.status = 'running'; this.updateConsole(); });
        endpoint.on('read.end', () => { desc.status = 'finished'; this.updateConsole(); });
        endpoint.on('read.data', v => { desc.status = 'running'; desc.value = v; this.updateConsole(); });

        endpoint.on('read.error', v => { desc.status = 'error'; desc.value = v; this.updateConsole(); });
        endpoint.on('push', v => { desc.status = 'pushed'; desc.value = v; this.updateConsole(); });
        endpoint.on('clear', v => { desc.status = 'cleared'; desc.value = v; this.updateConsole(); });

        this.updateConsole();
    }

    protected getEndpointNameLength(): number {
        const maxName = this.endpoints.reduce((p, c) => p.displayName > c.displayName ? p : c);
        return maxName.displayName.length;
    }

    protected getEndpointDisplayName(desc: EndpointDesc): string {
        return desc.displayName.padEnd(this.getEndpointNameLength() + 4, ' ');
    }
}
