export class SocialNetwork {
    name: string;
    url: string;
    supported: boolean;
    jwt: string | undefined;
    csrf_token: string | undefined;
    block_handles: Set<string> = new Set();

    constructor(
            name: string, url: string, supported: boolean = false,
            jwt: string | undefined = undefined,
            csrf_token: string | undefined = undefined) {
        this.name = name;
        this.url = url;
        this.supported = supported;
        this.jwt = jwt;
        this.csrf_token = csrf_token;
    }

    get_keyname(key: string): string {
        return `${this.name}_${key}`
    }

    add_handle(handle: string) {
        this.block_handles.add(handle);
    }

    async load_blocks() {
        let key: string = this.get_keyname('block_handles');
        let data: string | null = window.localStorage.getItem(key);
        if (data !== null) {
            let handles: string[] = JSON.parse(data) as string[];
            for (let handle in handles) {
                this.block_handles.add(handle);
            }
        }
    }

    async save_blocks() {
        let key: string = this.get_keyname('block_handles');
        let values: string[] = Array.from(this.block_handles);
        window.localStorage.setItem(key, JSON.stringify(values));
    }
};