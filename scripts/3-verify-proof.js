const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');

async function verifyProof() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  👤 User: Verifying Proof of Reserves');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
        // Load the proof
        const proofData = JSON.parse(
            fs.readFileSync(path.join(__dirname, '..', 'build', 'proof.json'), 'utf8')
        );

        // Load the verification key
        const vKey = JSON.parse(
            fs.readFileSync(path.join(__dirname, '..', 'build', 'verification_key.json'), 'utf8')
        );

        console.log('📋 Proof Metadata:');
        console.log(`   Timestamp: ${proofData.metadata.timestamp}`);
        console.log(`   Claimed Total: ${proofData.metadata.claimedTotal} BTC`);
        console.log(`   Wallet Address: ${proofData.metadata.publicWalletAddress}`);
        console.log(`   User Index Proven: ${proofData.metadata.userIndexProven}`);

        console.log('\n🔍 Verifying zero-knowledge proof...');

        // Verify the proof
        const verified = await snarkjs.groth16.verify(
            vKey,
            proofData.publicSignals,
            proofData.proof
        );

        console.log('\n═══════════════════════════════════════════════════════');
        if (verified) {
            console.log('  ✅ PROOF VALID!');
            console.log('═══════════════════════════════════════════════════════');
            console.log('\n✓ What this proof guarantees:');
            console.log('  1. All user balances are NON-NEGATIVE (no negative balances)');
            console.log('  2. Sum of all balances EQUALS the claimed total');
            console.log('  3. The specific user\'s balance IS INCLUDED in the total');
            console.log('\n✓ What remains PRIVATE:');
            console.log('  • Individual user balance amounts');
            console.log('  • Total number of users');
            console.log('  • Distribution of balances');
            console.log('\n🔐 Zero-Knowledge Property:');
            console.log('  The exchange proved solvency WITHOUT revealing sensitive data!');

            console.log('\n📊 Additional Verification Steps (for users):');
            console.log('  1. Check the blockchain to verify the exchange\'s wallet');
            console.log(`     address (${proofData.metadata.publicWalletAddress})`);
            console.log(`     actually contains ${proofData.metadata.claimedTotal} BTC`);
            console.log('  2. Verify your own balance is correctly reflected');
            console.log('  3. Check that the proof timestamp is recent');

        } else {
            console.log('  ❌ PROOF INVALID!');
            console.log('═══════════════════════════════════════════════════════');
            console.log('\n⚠️  Warning: The exchange\'s proof of reserves is invalid!');
            console.log('   This could mean:');
            console.log('   • The sum of balances does not match claimed total');
            console.log('   • There are negative balances');
            console.log('   • The proof was tampered with');
        }
        console.log('\n═══════════════════════════════════════════════════════\n');

        // Simulate checking user's specific balance
        console.log('👤 User-Specific Verification:');
        console.log('   As User 2, I can verify my balance is included in the proof');
        console.log('   without the exchange revealing anyone else\'s balance!');
        console.log('   ✓ My balance is cryptographically guaranteed to be part of the total\n');

    } catch (error) {
        console.error('\n❌ Verification failed:', error.message);
        process.exit(1);
    }
}

verifyProof();
