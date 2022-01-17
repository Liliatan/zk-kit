import { RLN } from "../src"
import { ZkIdentity, SecretType } from "../../identity/src"
import { MerkleProof, FullProof } from "@zk-kit/types"
import { genSignalHash, genExternalNullifier, generateMerkleProof, poseidonHash } from "../src/utils"
import * as path from "path"
import * as fs from "fs"

const identityCommitments: Array<bigint> = []
const SPAM_TRESHOLD = 3

beforeAll(() => {
  const leafIndex = 3

  for (let i = 0; i < leafIndex; i++) {
    const tmpIdentity = new ZkIdentity()
    tmpIdentity.genMultipartSecret(SPAM_TRESHOLD)
    const tmpCommitment: bigint = tmpIdentity.genIdentityCommitment(SecretType.MULTIPART_SECRET)
    identityCommitments.push(tmpCommitment)
  }
})

describe("RLN with non default spam threshold", () => {
  describe("RLN features", () => {
    it("Generate RLN witness", () => {
      const identity: ZkIdentity = new ZkIdentity()
      identity.genMultipartSecret(SPAM_TRESHOLD)

      const identityCommitment: bigint = identity.genIdentityCommitment(SecretType.MULTIPART_SECRET)
      const identitySecret: bigint[] = identity.getMultipartSecret()

      const commitments: Array<bigint> = Object.assign([], identityCommitments)
      commitments.push(identityCommitment)

      const signal = "hey hey"
      const epoch: string = genExternalNullifier("test-epoch")
      const rlnIdentifier: bigint = RLN.genIdentifier()

      const merkleProof: MerkleProof = generateMerkleProof(15, BigInt(0), 2, commitments, identityCommitment)
      const witness: FullProof = RLN.genWitness(identitySecret, merkleProof, epoch, signal, rlnIdentifier)

      expect(typeof witness).toBe("object")
    })
    it.skip("Generate RLN proof and verify it", async () => {
      /**
       * Compiled RLN circuits are needed to run this test so it's being skipped in hooks
       */
      const identity: ZkIdentity = new ZkIdentity()
      identity.genMultipartSecret(SPAM_TRESHOLD)

      const identityCommitment: bigint = identity.genIdentityCommitment(SecretType.MULTIPART_SECRET)
      const identitySecret: bigint[] = identity.getMultipartSecret()

      const commitments: Array<bigint> = Object.assign([], identityCommitments)
      commitments.push(identityCommitment)

      const signal = "hey hey"
      const signalHash = genSignalHash(signal)
      const epoch: string = genExternalNullifier("test-epoch")
      const rlnIdentifier: bigint = RLN.genIdentifier()

      const merkleProof: MerkleProof = generateMerkleProof(15, BigInt(0), 2, commitments, identityCommitment)
      const witness: FullProof = RLN.genWitness(identitySecret, merkleProof, epoch, signal, rlnIdentifier)

      const [y, nullifier] = RLN.calculateOutput(
        identitySecret,
        BigInt(epoch),
        signalHash,
        SPAM_TRESHOLD,
        rlnIdentifier
      )
      const publicSignals = [y, merkleProof.root, nullifier, signalHash, epoch, rlnIdentifier]

      const vkeyPath: string = path.join("./zkeyFiles", "rln_3", "verification_key.json")
      const vKey = JSON.parse(fs.readFileSync(vkeyPath, "utf-8"))

      const wasmFilePath: string = path.join("./zkeyFiles", "rln_3", "rln.wasm")
      const finalZkeyPath: string = path.join("./zkeyFiles", "rln_3", "rln_final.zkey")

      const fullProof: FullProof = await RLN.genProof(witness, wasmFilePath, finalZkeyPath)
      const res: boolean = await RLN.verifyProof(vKey, { proof: fullProof.proof, publicSignals })

      expect(res).toBe(true)
    }, 30000)
    it("Should retrieve user secret after spaming", () => {
      const identity: ZkIdentity = new ZkIdentity()
      identity.genMultipartSecret(SPAM_TRESHOLD)

      const identitySecret: bigint[] = identity.getMultipartSecret()

      const signal1 = "hey 1"
      const signalHash1 = genSignalHash(signal1)
      const signal2 = "hey 2"
      const signalHash2 = genSignalHash(signal2)
      const signal3 = "hey 3"
      const signalHash3 = genSignalHash(signal3)
      const signal4 = "hey 4"
      const signalHash4 = genSignalHash(signal4)

      const epoch: string = genExternalNullifier("test-epoch")
      const rlnIdentifier: bigint = RLN.genIdentifier()

      const [y1] = RLN.calculateOutput(identitySecret, BigInt(epoch), signalHash1, SPAM_TRESHOLD, rlnIdentifier)
      const [y2] = RLN.calculateOutput(identitySecret, BigInt(epoch), signalHash2, SPAM_TRESHOLD, rlnIdentifier)
      const [y3] = RLN.calculateOutput(identitySecret, BigInt(epoch), signalHash3, SPAM_TRESHOLD, rlnIdentifier)
      const [y4] = RLN.calculateOutput(identitySecret, BigInt(epoch), signalHash4, SPAM_TRESHOLD, rlnIdentifier)

      const retrievedSecret: bigint = RLN.retrieveSecret(
        [signalHash1, signalHash2, signalHash3, signalHash4],
        [y1, y2, y3, y4]
      )

      expect(retrievedSecret).toEqual(poseidonHash(identitySecret))
    })
  })
})
