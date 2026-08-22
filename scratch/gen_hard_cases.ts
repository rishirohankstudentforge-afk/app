import fs from 'fs';

function solveQuery(s: string, L: number, R: number): number {
    const sub = s.substring(L, R + 1);
    const n = sub.length;
    let c = 0;
    for (let i = 0; i < n; i++) {
        if (sub[i] === '1') c++;
    }

    const blocks: { char: string, len: number }[] = [];
    let i = 0;
    while (i < n) {
        const char = sub[i];
        const start = i;
        while (i < n && sub[i] === char) i++;
        blocks.push({ char, len: i - start });
    }

    let max_1s = c;
    for (let j = 1; j < blocks.length - 1; j++) {
        if (blocks[j].char === '1') {
            const L_i = blocks[j].len;
            const Z_L = blocks[j - 1].len;
            const Z_R = blocks[j + 1].len;

            let Z_max = 0;
            for (let k = 0; k < blocks.length; k++) {
                if (blocks[k].char === '0') {
                    if (blocks[k].len > Z_max) Z_max = blocks[k].len;
                }
            }

            const new_Z = Z_L + L_i + Z_R;
            const gain = Math.max(Z_max, new_Z) - L_i;
            if (c + gain > max_1s) {
                max_1s = c + gain;
            }
        }
    }
    return max_1s;
}

function solve(s: string, queries: number[][]): number[] {
    const ans = new Int32Array(queries.length);
    for (let i = 0; i < queries.length; i++) {
        ans[i] = solveQuery(s, queries[i][0], queries[i][1]);
    }
    return Array.from(ans);
}

function main() {
    const s = "1000100";
    const q = [[1, 5], [0, 6], [0, 4]];
    console.log(solve(s, q));

    const cases = [];
    for (let t = 0; t < 15; t++) {
        const isHard = t >= 4;
        const n = isHard ? 10000 : 5000 + Math.floor(Math.random() * 1000);
        const qCount = isHard ? 10000 : 5000 + Math.floor(Math.random() * 1000);

        let sGen = "";
        for (let i = 0; i < n; i++) {
            sGen += Math.random() < 0.5 ? '0' : '1';
        }

        const queriesGen = [];
        let queriesStr = "[";
        for (let i = 0; i < qCount; i++) {
            let L = Math.floor(Math.random() * n);
            let R = Math.floor(Math.random() * n);
            if (L > R) {
                const temp = L;
                L = R;
                R = temp;
            }
            queriesGen.push([L, R]);
            queriesStr += `[${L},${R}]`;
            if (i < qCount - 1) queriesStr += ",";
        }
        queriesStr += "]";

        const start = Date.now();
        const ansGen = solve(sGen, queriesGen);
        console.log(`Generated case ${t + 1} in ${Date.now() - start}ms`);

        let ansStr = "[";
        for (let i = 0; i < qCount; i++) {
            ansStr += ansGen[i];
            if (i < qCount - 1) ansStr += ",";
        }
        ansStr += "]";

        cases.push({
            input: `"${sGen}", ${queriesStr}`,
            expectedOutput: ansStr
        });
    }

    fs.writeFileSync("scratch/expert_cases_new.json", JSON.stringify(cases, null, 2));
    console.log("Done generating cases!");
}

main();
