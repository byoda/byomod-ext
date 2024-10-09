<script lang='ts'>
    // export let target: HTMLElement;
    // export let props: Record<string, any>;

    import browser from 'webextension-polyfill';
    import {SocialNetwork} from './lib/datatypes';
    import {socialNetworks} from './lib/constants';
    import type {iListOfLists} from './lib/datatypes';
    import ByoList from './lib/list';
    import type {iByoList} from './lib/list';
    import ByoStorage from './lib/storage';

    const byo_storage: ByoStorage = new ByoStorage();

    let list_url: string = '';
    let listOfLists: iListOfLists  = byo_storage.load_list_of_lists_sync();
    console.log('Subscribed lists: ', listOfLists.lists);

    const load_lists = async() => {
        console.log('Loading lists');
        let all_lists: Map<string, ByoList> = new Map<string, ByoList>();
        for (let mod_list of listOfLists.lists) {
            console.log('Reading URL: ', mod_list);
            let byo_list: ByoList = new ByoList(mod_list);
            let result: boolean = await byo_list.initialize();
            if (result) {
                console.log('Adding list: ', mod_list);
                all_lists.set(mod_list, byo_list);
            }
        }
        return all_lists;
    }

    const add_list = () => {
        console.log('add_list: ', list_url);
        if (! list_url) return;

        if (list_url in listOfLists) {
            console.info('List already subscribed: ', list_url);
            return;
        }
        try {
            console.log('Adding list: ', list_url);
            let new_list: ByoList = new ByoList(list_url);
            try {
                await new_list.download();
                await new_list.save()
            } catch (e) {
                console.error('Failed to download list and save: ', list_url);
                return;
            }
        } catch (e) {
            console.error('Invalid URL: ', list_url);
            return;
        };
        // Svelte trickery for updating lists:
        // https://learn.svelte.dev/tutorial/updating-arrays-and-objects
        listOfLists.lists.push(list_url);
        listOfLists.lists = listOfLists.lists;
        byo_storage.save_list_of_lists_sync(listOfLists);
        console.log('URL parsed: ', list_url);
        list_url = '';
    };

    const open_fullscreen = () => {
        browser.tabs.create({ url: browser.runtime.getURL('configure.html') });
    };
</script>

<main class='flex flex-col justify-center items-center'>
{#await load_lists()}
    <p>Loading lists...</p>
{:then lists}
    <p>Lists: {listOfLists.lists.length}</p>
    <table>
        <tr>
            <th>Lists</th>
            <th>Entries</th>
            <th></th>
            <th></th>
        </tr>
        {#each listOfLists.lists as list_url}
            {#if lists.has(list_url)}
                <tr>
                    <td>{lists.get(list_url).url.href}</td>
                    <td>{lists.get(list_url).list.block_list.length}</td>
                </tr>
            {/if}
        {/each}
    </table>
    <br/>
    <form on:submit|preventDefault={add_list} method="POST">
        <label>BYOMod list URL
            <input
                name='list_url'
                type='url'
                class='border-2 border-gray-300 p-2'
                placeholder='Enter a URL for a BYOMod list'
                bind:value={list_url}
            >
        </label>
    <button
          class='bg-blue-600 px-[6px] py-[14px] mt-6 text-white font-semibold'
        type='submit' formaction="?/add_list">Add</button
        >
    </form>
{/await}
</main>