import { describe, it, expect } from '@jest/globals';

function reducer(state: any[], m: { index:number; text:string; final:boolean }) {
    const i = state.findIndex((r:any) => r.index === m.index);
    if (i >= 0) { const next = state.slice(); next[i] = { ...next[i], ...m }; return next; }
    return [...state, m];
}

describe('caption merging', () => {
    it('adds partial then upgrades to final', () => {
        let s:any[] = [];
        s = reducer(s, { index: 1, text: 'hello', final: false });
        expect(s[0]).toMatchObject({ index:1, text:'hello', final:false });
        s = reducer(s, { index: 1, text: 'hello world', final: true });
        expect(s[0]).toMatchObject({ index:1, text:'hello world', final:true });
    });
});
