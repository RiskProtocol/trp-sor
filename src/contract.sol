// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PoolState {

    // Custom error for failed static calls
    error StaticCallFailed(address target, bytes data);

    // Calls addr with data which returns (uint256)
    function getUint(address addr, bytes memory data) internal view returns (uint result) {
        (bool success, bytes memory returnData) = addr.staticcall(data);
        
        if (!success || returnData.length != 32) {
            revert StaticCallFailed(addr, data);
        }
        
        result = abi.decode(returnData, (uint));
    }
    function getPoolInfo(bytes calldata encodedData) external view returns (uint[] memory) {
        (address[][] memory pools) = abi.decode(encodedData, (address[][]));
        uint totalElements = 0;

        // Calculate the total length of the result array
        for (uint i = 0; i < pools.length; i++) {
            totalElements += 1; // For the pool's getSwapFee call
            totalElements += 2 * (pools[i].length - 1); // For each token's getBalance and getDenormalizedWeight
        }

        uint[] memory results = new uint[](totalElements);
        uint count = 0;

        for (uint i = 0; i < pools.length; i++) {
            address poolAddr = pools[i][0];

            results[count] = getUint(poolAddr, abi.encodeWithSignature("getSwapFee()"));
            count++;

            for (uint j = 1; j < pools[i].length; j++) {
                address tokenAddr = pools[i][j];
                
                results[count] = getUint(poolAddr, abi.encodeWithSignature("getBalance(address)", tokenAddr));
                count++;
                results[count] = getUint(poolAddr, abi.encodeWithSignature("getDenormalizedWeight(address)", tokenAddr));
                count++;
            }
        }

        return results;
    }
}
