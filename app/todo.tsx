"use client";

import { useOptimistic } from 'react';
import { saveAction } from './actions';

export function TodoList({ items }: { items: string[] }) {
    // async function formAction(formData: { get: (arg0: string) => unknown; }) {
    //     addOptimisticItem(formData.get('item'));
    //     await saveAction(formData);
    // }
    // const [optimisticItems, addOptimisticItem] = useOptimistic(
    //     items,
    //     (state, newItem) => [
    //         ...state, 
    //     ]
    // );

    return (
        <>
            <h1>My List</h1>
            {/* <form action={formAction}>
                <input type="text" name="item" placeholder="Make a video ... " />
                <button type="submit">Add</button>
            </form>
            <ul>
                {optimisticItems.map((item: any, index: any) => (
                    <li key={index}>
                        {item.text}
                        {!!item.sending && <small> (Sending ... )</small>}
                    </li>
                ))}
            </ul> */}
        </>
    );
}

