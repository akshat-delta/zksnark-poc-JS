pragma circom 2.0.0;

/*
 * Proof of Reserves Circuit
 *
 * This circuit proves that:
 * 1. The exchange has recorded user balances that sum to a claimed total
 * 2. All user balances are non-negative (no negative balances)
 * 3. A specific user's balance is included in the total
 *
 * WITHOUT revealing individual user balances
 */

// Helper template to check if a number is non-negative (>= 0)
// In our case, we use the constraint that the number can be represented
// with the given number of bits, which implicitly ensures non-negativity
template NonNegative() {
    signal input balance;

    // Check that balance fits in 64 bits (prevents negative numbers in field arithmetic)
    signal bits[64];
    var sum = 0;

    for (var i = 0; i < 64; i++) {
        bits[i] <-- (balance >> i) & 1;
        bits[i] * (bits[i] - 1) === 0; // Ensure each bit is 0 or 1
        sum += bits[i] * (2 ** i);
    }

    sum === balance;
}

// Helper template to check if two numbers are equal
template IsEqual() {
    signal input in[2];
    signal output out;

    component isz = IsZero();
    isz.in <== in[0] - in[1];
    out <== isz.out;
}

// Helper template to check if a number is zero
template IsZero() {
    signal input in;
    signal output out;

    signal inv;

    inv <-- in != 0 ? 1/in : 0;

    out <== -in*inv + 1;
    in*out === 0;
}

// Main Proof of Reserves Circuit
template ProofOfReserves(numUsers) {
    // Private inputs: individual user balances (kept secret)
    signal input userBalances[numUsers];

    // Private input: the index of the user who wants to verify their balance
    signal input userIndex;

    // Private input: the user's expected balance (user provides this)
    signal input userExpectedBalance;

    // Public input: the total claimed reserves
    signal input claimedTotal;

    // Public output: confirmation that proof is valid
    signal output isValid;

    // Step 1: Verify all balances are non-negative
    component nonNegChecks[numUsers];
    for (var i = 0; i < numUsers; i++) {
        nonNegChecks[i] = NonNegative();
        nonNegChecks[i].balance <== userBalances[i];
    }

    // Step 2: Calculate the sum of all user balances
    signal calculatedSum;
    signal partialSums[numUsers];

    partialSums[0] <== userBalances[0];
    for (var i = 1; i < numUsers; i++) {
        partialSums[i] <== partialSums[i-1] + userBalances[i];
    }
    calculatedSum <== partialSums[numUsers - 1];

    // Step 3: Verify the sum equals the claimed total
    calculatedSum === claimedTotal;

    // Step 4: Verify the specific user's balance matches their expectation
    // We use a selector approach: multiply each balance by 1 if it matches userIndex, 0 otherwise
    signal selectedBalance;
    signal selectors[numUsers];
    signal products[numUsers];

    component equalChecks[numUsers];
    for (var i = 0; i < numUsers; i++) {
        equalChecks[i] = IsEqual();
        equalChecks[i].in[0] <== i;
        equalChecks[i].in[1] <== userIndex;
        selectors[i] <== equalChecks[i].out;

        products[i] <== selectors[i] * userBalances[i];
    }

    // Sum up all products (only the selected one will be non-zero)
    signal partialProducts[numUsers];
    partialProducts[0] <== products[0];
    for (var i = 1; i < numUsers; i++) {
        partialProducts[i] <== partialProducts[i-1] + products[i];
    }
    selectedBalance <== partialProducts[numUsers - 1];

    // Verify it matches the expected balance
    selectedBalance === userExpectedBalance;

    // Output validation signal
    isValid <== 1;
}

// Instantiate the circuit with 5 users (can be adjusted)
component main {public [claimedTotal]} = ProofOfReserves(5);
