import * as path from "path"
import { getTester, getUtils } from "./utils"

/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "ok", "fail"] }] */

async function utils(templateName: string, args: number[]) {
    const srcPath = path.join(__dirname, "..", "circuits", "hashtower-hash-chain.circom")
    const circomlibPath = path.join(__dirname, "..", "..", "..", "node_modules", "circomlib", "circuits")
    const tester = await getTester(srcPath, templateName, args, { include: [circomlibPath] })
    return getUtils(tester)
}

describe("PickOne", () => {
    it("PickOne", async () => {
        const { ok, fail } = await utils("PickOne", [4])

        await ok({ in: [100, 200, 300, 400], sel: 0 }, { out: 100 })
        await ok({ in: [100, 200, 300, 400], sel: 1 }, { out: 200 })
        await ok({ in: [100, 200, 300, 400], sel: 2 }, { out: 300 })
        await ok({ in: [100, 200, 300, 400], sel: 3 }, { out: 400 })

        await fail({ in: [100, 200, 300, 400], sel: 4 }) // out of bounds
    })
})

describe("HashChain", () => {
    it("HashChain", async () => {
        const { ok, fail } = await utils("HashChain", [4])

        await ok({ in: [0, 1, 2, 3], len: 0 }, { out: 0 })
        await ok({ in: [0, 1, 2, 3], len: 1 }, { out: 0 })
        await ok(
            { in: [0, 1, 2, 3], len: 2 },
            { out: BigInt("12583541437132735734108669866114103169564651237895298778035846191048104863326") }
        )
        await ok(
            { in: [0, 1, 2, 3], len: 3 },
            { out: BigInt("11790059851550142146278072775670916642282838830554510149311470233718605478544") }
        )
        await ok(
            { in: [0, 1, 2, 3], len: 4 },
            { out: BigInt("20127075603631019434055928315203707068407414306847615530687456290565086592967") }
        )

        await ok({ in: [100, 200, 300, 400], len: 0 }, { out: 0 })
        await ok({ in: [100, 200, 300, 400], len: 1 }, { out: 100 })
        await ok(
            { in: [100, 200, 300, 400], len: 2 },
            { out: BigInt("3699275827636970843851136077830925792907611923069205979397427147713774628412") }
        )
        await ok(
            { in: [100, 200, 300, 400], len: 3 },
            { out: BigInt("3925045059169335782833407477321845405342042180089864692501953598893457304808") }
        )
        await ok(
            { in: [100, 200, 300, 400], len: 4 },
            { out: BigInt("14874163058214740000325542972470514093833183500825720625361773479542469519892") }
        )

        await fail({ in: [100, 200, 300, 400], len: 5 })
    })
})
