const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');

async function generateProof() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  🏦 Exchange: Generating Proof of Reserves');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
        // Load exchange data (this would be from the exchange's database)
        const exchangeData = JSON.parse(
            fs.readFileSync(path.join(__dirname, '..', 'data', 'exchange_data.json'), 'utf8')
        );

        console.log('📊 Exchange Data:');
        console.log(`   Total Users: ${exchangeData.users.length}`);
        console.log(`   Claimed Total Reserves: ${exchangeData.totalReserves} BTC`);
        console.log(`   Public Wallet Address: ${exchangeData.publicWalletAddress}`);
        console.log(`\n👥 User Balances (PRIVATE - not revealed in proof):`);
        exchangeData.users.forEach((user, idx) => {
            console.log(`   User ${idx}: ${user.balance} BTC`);
        });

        // Calculate actual sum to verify internal consistency
        const actualSum = exchangeData.users.reduce((sum, user) => sum + user.balance, 0);
        console.log(`\n   ✓ Actual sum: ${actualSum} BTC`);

        if (actualSum !== exchangeData.totalReserves) {
            throw new Error('Internal error: Sum of balances does not match claimed total!');
        }

        // Prepare circuit inputs
        // The exchange proves that a specific user's balance is included
        // Let's prove for User 2 (index 2)
        const userToProve = 2;
        const userBalance = exchangeData.users[userToProve].balance;

        const input = {
            userBalances: exchangeData.users.map(u => u.balance),
            userIndex: userToProve,
            userExpectedBalance: userBalance,
            claimedTotal: exchangeData.totalReserves
        };

        console.log(`\n🔐 Generating zero-knowledge proof...`);
        console.log(`   (Proving User ${userToProve}'s balance of ${userBalance} BTC is included)`);

        // Generate witness
        const wasmPath = path.join(__dirname, '..', 'build', 'proof_of_reserves_js', 'proof_of_reserves.wasm');
        const wtnsPath = path.join(__dirname, '..', 'build', 'witness.wtns');

        await snarkjs.wtns.calculate(input, wasmPath, wtnsPath);

        // Generate proof
        const zkeyPath = path.join(__dirname, '..', 'build', 'proof_of_reserves_final.zkey');
        const { proof, publicSignals } = await snarkjs.groth16.prove(zkeyPath, wtnsPath);

        // Save proof and public signals
        const proofData = {
            proof,
            publicSignals,
            metadata: {
                timestamp: new Date().toISOString(),
                claimedTotal: exchangeData.totalReserves,
                publicWalletAddress: exchangeData.publicWalletAddress,
                userIndexProven: userToProve,
                description: 'Proof that exchange reserves match liabilities'
            }
        };

        fs.writeFileSync(
            path.join(__dirname, '..', 'build', 'proof.json'),
            JSON.stringify(proofData, null, 2)
        );

        console.log('\n✅ Proof generated successfully!');
        console.log('\n📤 PUBLIC Information (shared with users):');
        console.log(`   • Claimed Total: ${exchangeData.totalReserves} BTC`);
        console.log(`   • Wallet Address: ${exchangeData.publicWalletAddress}`);
        console.log(`   • Proof: build/proof.json`);
        console.log('\n🔒 PRIVATE Information (never revealed):');
        console.log(`   • Individual user balances`);
        console.log(`   • Number of users`);
        console.log(`   • Distribution of wealth`);

        console.log('\n═══════════════════════════════════════════════════════');
        console.log('  Next step: Run "npm run verify-proof" to verify');
        console.log('═══════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ Proof generation failed:', error.message);
        process.exit(1);
    }
}

generateProof();
