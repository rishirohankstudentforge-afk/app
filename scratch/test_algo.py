import math

def solve(s, queries):
    n = len(s)
    # Prefix sums for 1s
    pref1 = [0] * (n + 1)
    for i in range(n):
        pref1[i+1] = pref1[i] + (1 if s[i] == '1' else 0)
        
    # Find all 1-blocks
    one_blocks = [] # (start, end, length)
    zero_blocks = [] # (start, end, length)
    
    i = 0
    while i < n:
        char = s[i]
        start = i
        while i < n and s[i] == char:
            i += 1
        if char == '1':
            one_blocks.append((start, i - 1, i - start))
        else:
            zero_blocks.append((start, i - 1, i - start))
            
    # For each 1-block, what is the length of the 0-block to its left and right?
    # Actually, we just need the 0-blocks between 1-blocks.
    # Let internal_0[k] be the length of the 0-block between one_blocks[k] and one_blocks[k+1].
    internal_0 = []
    for k in range(len(one_blocks) - 1):
        # the 0-block is between one_blocks[k][1] and one_blocks[k+1][0]
        internal_0.append(one_blocks[k+1][0] - one_blocks[k][1] - 1)
        
    # RMQ structures
    def build_rmq(arr, op=max):
        if not arr: return []
        m = len(arr)
        k = int(math.log2(m)) + 1
        st = [[0] * m for _ in range(k)]
        for i in range(m): st[0][i] = arr[i]
        for j in range(1, k):
            for i in range(m - (1 << j) + 1):
                st[j][i] = op(st[j-1][i], st[j-1][i + (1 << (j-1))])
        return st

    def query_rmq(st, L, R, op=max):
        if L > R: return 0 if op == max else float('inf')
        j = int(math.log2(R - L + 1))
        return op(st[j][L], st[j][R - (1 << j) + 1])

    # For internal 1-blocks, we need max(Z_L + Z_R) and min(L_i)
    # An internal 1-block is one_blocks[k], its Z_L is internal_0[k-1], Z_R is internal_0[k]
    # This is valid for k from 1 to len(one_blocks)-2
    val_ZL_ZR = []
    val_L = []
    for k in range(len(one_blocks)):
        if 0 < k < len(one_blocks) - 1:
            val_ZL_ZR.append(internal_0[k-1] + internal_0[k])
        else:
            val_ZL_ZR.append(0)
        val_L.append(one_blocks[k][2])
        
    st_ZL_ZR = build_rmq(val_ZL_ZR, max)
    st_L = build_rmq(val_L, min)
    st_Z = build_rmq(internal_0, max)

    # Next 1 / Prev 1 arrays
    next_1 = [-1] * n
    prev_1 = [-1] * n
    last = -1
    for i in range(n):
        if s[i] == '1': last = i
        prev_1[i] = last
    last = -1
    for i in range(n-1, -1, -1):
        if s[i] == '1': last = i
        next_1[i] = last
        
    # Block index of a 1
    one_block_idx = {}
    for idx, (start, end, length) in enumerate(one_blocks):
        for j in range(start, end + 1):
            one_block_idx[j] = idx

    ans = []
    for L, R in queries:
        c = pref1[R+1] - pref1[L]
        first_1 = next_1[L]
        last_1 = prev_1[R]
        
        if first_1 == -1 or first_1 > R:
            # No 1s in [L, R]
            ans.append(c)
            continue
            
        b_first = one_block_idx[first_1]
        b_last = one_block_idx[last_1]
        
        # Z_max in [L, R]
        z_max = 0
        z_max = max(z_max, first_1 - L)
        z_max = max(z_max, R - last_1)
        if b_first < b_last:
            z_max = max(z_max, query_rmq(st_Z, b_first, b_last - 1, max))
            
        if b_last - b_first >= 2:
            # There are internal 1-blocks!
            max_ZL_ZR = query_rmq(st_ZL_ZR, b_first + 1, b_last - 1, max)
            min_L = query_rmq(st_L, b_first + 1, b_last - 1, min)
            gain = max(z_max - min_L, max_ZL_ZR)
            ans.append(c + gain)
        else:
            ans.append(c)
            
    return ans

print("Ex 1:", solve("01", [[0,1]]))
print("Ex 2:", solve("0100", [[0,3],[0,2],[1,3],[2,3]]))
print("Ex 3:", solve("1000100", [[1,5],[0,6],[0,4]]))
print("Ex 4:", solve("01010", [[0,3],[1,4],[1,3]]))
