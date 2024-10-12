<script lang='ts'>
    import browser from 'webextension-polyfill'

    import {SocialNetwork} from './lib/social_network'
    import type {iListOfLists} from './lib/datatypes'
    import type {iMessage} from './lib/datatypes'
    import ByoList from './lib/list'
    import ByoStorage from './lib/storage'
    import {SOCIAL_NETWORKS_BY_PLATFORM} from './lib/constants'
    import Message from './lib/message'

    console.log('Extension reporting for duty')
    console.log(`Social networks: ${SOCIAL_NETWORKS_BY_PLATFORM.size}`)

    const byo_storage: ByoStorage = new ByoStorage()

    let list_url: string = ''
    let listOfLists: iListOfLists  = byo_storage.load_list_of_lists_sync()
    console.log('Subscribed lists: ', listOfLists.lists)

    Message.setup_listen()
    const load_lists = async() => {
        console.log('Loading lists')
        let all_lists: Map<string, ByoList> = new Map<string, ByoList>()
        for (let mod_list of listOfLists.lists) {
            console.log('Reading URL: ', mod_list)
            let byo_list: ByoList = new ByoList(mod_list)
            let result: boolean = await byo_list.initialize()
            if (result) {
                console.log('Adding list: ', mod_list)
                all_lists.set(mod_list, byo_list)
            }
        }
        return all_lists
    }

    const load_blocks = async() => {
        console.log('Loading blocks')
        let found_net_with_blocks: boolean = false
        for (let [platform, net] of SOCIAL_NETWORKS_BY_PLATFORM) {
            if (net.supported === false) {
                continue
            }
            console.log(`Loading handles for network: ${platform}`)
            try {
                await net.load_blocks()
                if (net.block_handles.size > 0) {
                    found_net_with_blocks = true
                }
            } catch (e) {
                console.error(`Failed to load handles for network ${platform}, ${e}`)
            }
        }
        console.log('Found networks with blocks: ', found_net_with_blocks)
        return found_net_with_blocks
    }

    const add_list = async() => {
        console.log('Adding list: ', list_url)
        if (!list_url) return

        if (list_url in listOfLists) {
            console.info('List already subscribed: ', list_url)
            return
        }
        try {
            console.log('Adding list: ', list_url)
            let new_list: ByoList = new ByoList(list_url)
            try {
                await new_list.download()
                await new_list.save()
            } catch (e) {
                console.error('Failed to download list and save: ', list_url)
                return
            }

            // Convert from BYOMod list to handles per social network
            for  (var block_entry of new_list.list.block_list) {
                for (var socialAccount of block_entry.social_accounts) {
                    let platform: string = socialAccount.platform.toLowerCase().replace(' ', '')
                    let handle: string = socialAccount.handle
                    if (handle === undefined || handle === null || handle === '') {
                        console.log(`No handle for platform ${platform}`)
                        continue
                    }
                    let net: SocialNetwork = SOCIAL_NETWORKS_BY_PLATFORM.get(platform)
                    if (net === undefined) {
                        console.log(`Unknown platform ${platform} for handle ${handle}`)
                        continue
                    }
                    if (net.supported === false) {
                        continue
                    }
                    console.log(`Adding handle ${handle} to block to network: ${net.name}`)
                    try {
                        await net.add_handle(handle)
                    } catch (e) {
                        console.error(`Failed to add block for handle ${handle} to network ${net}`)
                        continue
                    }
                }
            }

            // Persist the handles to local storage and the content scripts of
            // the platforms
            for (let [platform, net] of SOCIAL_NETWORKS_BY_PLATFORM) {
                if (net.supported === false) {
                    continue
                }
                let tabs = await chrome.tabs.query({url: `https://x.com/home`, active: true})
                if (tabs.length) {
                    let message: iMessage<string> = {
                        source: 'extension',
                        type: 'handles',
                        data: JSON.stringify(Array.from(net.block_handles))
                    }
                    console.log(`Sending ${platform} handles to block`)
                    await chrome.tabs.sendMessage(tabs[0]['id'], JSON.stringify(message))
                } else {
                    console.error(`No tabs found for platform ${platform}`)
                }
                try {
                    await net.save_blocks()
                } catch (e) {
                    console.error(`Failed to load handles for network ${platform}`)
                    continue
                }

            }
        } catch (e) {
            console.error('Invalid URL: ', list_url, e)
            return
        }

        // Svelte trickery for updating lists:
        // https://learn.svelte.dev/tutorial/updating-arrays-and-objects
        listOfLists.lists.push(list_url)
        listOfLists.lists = listOfLists.lists
        byo_storage.save_list_of_lists_sync(listOfLists)
        console.log(`List added: ${list_url}`)
        list_url = ''
    }

    const open_fullscreen = () => {
        browser.tabs.create({ url: browser.runtime.getURL('configure.html') })
    }
</script>

<main class='flex flex-col justify-center items-center'>
{#await load_blocks()}
    <p>Loading blocks...</p>
{:then found_net_with_blocks}
    {#if found_net_with_blocks}
        <table>
            <tr>
                <th>Platform</th>
                <th>Blocks</th>
            </tr>
            {#each SOCIAL_NETWORKS_BY_PLATFORM.values() as net}
                {#if net.block_handles.size > 0}
                    <tr>
                        <td>{net.name}</td>
                        <td>{net.block_handles.size}</td>
                    </tr>
                {/if}
            {/each}
        </table>
    {/if}
{/await}

<br/>

{#await load_lists()}
    <p>Loading lists...</p>
{:then lists}
    <table>
        <tr>
            <th>Configured Lists</th>
            <th>Blocks</th>
            <th></th>
            <th></th>
        </tr>
        {#each lists.keys() as list_url}
            <tr>
                <td>{lists.get(list_url).url.href}</td>
                <td>{lists.get(list_url).list.block_list.length}</td>
            </tr>
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