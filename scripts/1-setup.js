const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

async function runCommand(command, description) {
    console.log(`\n🔧 ${description}...`);
    try {
        const { stdout, stderr } = await execAsync(command);
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        console.log(`✅ ${description} completed`);
    } catch (error) {
        console.error(`❌ Error during ${description}:`, error.message);
        throw error;
    }
}

async function setup() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  zk-SNARK Proof of Reserves - Setup & Compilation');
    console.log('═══════════════════════════════════════════════════════\n');

    const buildDir = path.join(__dirname, '..', 'build');
    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, { recursive: true });
    }

    try {
        // Step 1: Compile the circuit
        await runCommand(
            'circom circuits/proof_of_reserves.circom --r1cs --wasm --sym -o build',
            'Compiling Circom circuit'
        );

        // Step 2: View circuit info
        await runCommand(
            'snarkjs r1cs info build/proof_of_reserves.r1cs',
            'Getting circuit information'
        );

        // Step 3: Start Powers of Tau ceremony (trusted setup)
        await runCommand(
            'snarkjs powersoftau new bn128 12 build/pot12_0000.ptau -v',
            'Starting Powers of Tau ceremony'
        );

        // Step 4: Contribute to ceremony
        await runCommand(
            'snarkjs powersoftau contribute build/pot12_0000.ptau build/pot12_0001.ptau --name="First contribution" -v -e="random entropy"',
            'Contributing to Powers of Tau'
        );

        // Step 5: Prepare phase 2
        await runCommand(
            'snarkjs powersoftau prepare phase2 build/pot12_0001.ptau build/pot12_final.ptau -v',
            'Preparing Phase 2'
        );

        // Step 6: Generate zkey (proving key)
        await runCommand(
            'snarkjs groth16 setup build/proof_of_reserves.r1cs build/pot12_final.ptau build/proof_of_reserves_0000.zkey',
            'Generating proving key (zkey)'
        );

        // Step 7: Contribute to phase 2
        await runCommand(
            'snarkjs zkey contribute build/proof_of_reserves_0000.zkey build/proof_of_reserves_final.zkey --name="Second contribution" -v -e="more random entropy"',
            'Contributing to phase 2'
        );

        // Step 8: Export verification key
        await runCommand(
            'snarkjs zkey export verificationkey build/proof_of_reserves_final.zkey build/verification_key.json',
            'Exporting verification key'
        );

        console.log('\n═══════════════════════════════════════════════════════');
        console.log('  ✅ Setup Complete!');
        console.log('═══════════════════════════════════════════════════════');
        console.log('\nGenerated files:');
        console.log('  📄 build/proof_of_reserves.r1cs - Circuit constraints');
        console.log('  📄 build/proof_of_reserves.wasm - WASM witness calculator');
        console.log('  🔑 build/proof_of_reserves_final.zkey - Proving key');
        console.log('  🔑 build/verification_key.json - Verification key');
        console.log('\nNext step: Run "npm run generate-proof" to generate a proof\n');

    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        process.exit(1);
    }
}

setup();
