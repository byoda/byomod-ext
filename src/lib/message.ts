import type {iMessage} from './datatypes'

export default class Message {
    message: iMessage<any>

    constructor(source: string, type: string, data: any) {
        this.message = {
            source: source,
            type: type,
            data: data
        }
    }

    send(): void {
        chrome.runtime.sendMessage(JSON.stringify(this.message))
    }

    public static setup_listen(): Function | undefined {
        chrome.runtime.onMessage.addListener(
            (request, sender, sendResponse) => {
                try {
                    let message: iMessage<any> = JSON.parse(request) as iMessage<any>
                    if (message.type === 'auth_tokens') {
                    }

                } catch (e) {
                    console.log(`Invalid message: ${request}: ${e}`)
                }
            }
        )
        return undefined
    }

    public static get_extension_id(): string {
        return chrome.runtime.id
    }
}
