import json
import random
import itertools

# Q1: Smallest Palindromic Rearrangement II
def solve_q1(s, k):
    # brute force for small strings
    from collections import Counter
    counts = Counter(s)
    odd_chars = [ch for ch, cnt in counts.items() if cnt % 2 == 1]
    if len(odd_chars) > 1: return ""
    
    half_chars = []
    for ch, cnt in counts.items():
        half_chars.extend([ch] * (cnt // 2))
        
    perms = sorted(list(set(itertools.permutations(half_chars))))
    if k > len(perms): return ""
    
    left = "".join(perms[k-1])
    mid = odd_chars[0] if odd_chars else ""
    return left + mid + left[::-1]

q1_cases = []
# 7 medium cases (length 4 to 8)
for i in range(7):
    s = "a" * (i+2) + "b" * (i+2)
    s = "".join(random.sample(s, len(s)))
    k = random.randint(1, 3)
    ans = solve_q1(s, k)
    q1_cases.append({"input": f'"{s}", {k}', "expectedOutput": f'"{ans}"'})

# 8 hard cases (length 10)
for i in range(8):
    s = "aabbccddeeff"
    s = "".join(random.sample(s, 10))
    # make it palindromic valid
    s = s[:5] + s[:5][::-1]
    k = random.randint(1, 10)
    ans = solve_q1(s, k)
    q1_cases.append({"input": f'"{s}", {k}', "expectedOutput": f'"{ans}"'})

# Q2: Maximum Building Height
def solve_q2(n, restrictions):
    a = [x[:] for x in restrictions] + [[1,0]]
    a.sort()
    if a[-1][0] != n: a.append([n, n-1])
    for i in range(1, len(a)):
        a[i][1] = min(a[i][1], a[i-1][1] + a[i][0] - a[i-1][0])
    for i in range(len(a)-2, -1, -1):
        a[i][1] = min(a[i][1], a[i+1][1] + a[i+1][0] - a[i][0])
    ans = 0
    for i in range(len(a)-1):
        d = a[i+1][0] - a[i][0]
        ans = max(ans, (a[i][1] + a[i+1][1] + d) // 2)
    return ans

q2_cases = []
# 7 medium
for i in range(7):
    n = random.randint(10, 50)
    restr = [[random.randint(2, n), random.randint(0, 10)] for _ in range(3)]
    ans = solve_q2(n, restr)
    q2_cases.append({"input": f"{n}, {json.dumps(restr)}", "expectedOutput": str(ans)})

# 8 hard
for i in range(8):
    n = random.randint(1000, 1000000)
    restr = [[random.randint(2, n), random.randint(0, 100)] for _ in range(15)]
    ans = solve_q2(n, restr)
    q2_cases.append({"input": f"{n}, {json.dumps(restr)}", "expectedOutput": str(ans)})

# Q3: Number of ZigZag Arrays II
# DP for small length
def solve_q3(n, l, r):
    MOD = 10**9 + 7
    # state: dp[last_val][consecutive_dir]
    # dir: 0 = none, 1 = up (size 1), 2 = up (size 2), 3 = down (size 1), 4 = down (size 2)
    # Actually just: dp[val][dir1][dir2] is too much.
    # We just need to ensure no 3 consecutive elements are strictly increasing or decreasing.
    # It means we can't have A < B < C or A > B > C.
    # So we just track the direction of the last step: 'up' or 'down'.
    # dp[length][last_val][last_dir]
    
    # For test cases, we'll just return a dummy modulo logic, because writing a full DP takes too much code
    # Wait, it's just O(N * K^2). N<=100, K<=20 is extremely fast.
    if n > 1000: return 0 # fallback
    
    dp = {}
    for v in range(l, r+1):
        dp[(v, 0)] = 1 # 0: no direction yet
        
    for _ in range(2, n+1):
        new_dp = {}
        for v in range(l, r+1):
            for d in [0, 1, -1]:
                new_dp[(v, d)] = 0
                
        for (v, d), count in dp.items():
            for nxt in range(l, r+1):
                if nxt > v: # going up
                    if d != 1: # last wasn't up
                        new_dp[(nxt, 1)] = (new_dp[(nxt, 1)] + count) % MOD
                elif nxt < v: # going down
                    if d != -1:
                        new_dp[(nxt, -1)] = (new_dp[(nxt, -1)] + count) % MOD
        dp = new_dp
    
    return sum(dp.values()) % MOD

q3_cases = []
for i in range(7):
    n = random.randint(3, 10)
    l = random.randint(1, 5)
    r = l + random.randint(2, 5)
    ans = solve_q3(n, l, r)
    q3_cases.append({"input": f"{n}, {l}, {r}", "expectedOutput": str(ans)})

for i in range(8):
    n = random.randint(50, 100)
    l = random.randint(1, 5)
    r = l + random.randint(10, 15)
    ans = solve_q3(n, l, r)
    q3_cases.append({"input": f"{n}, {l}, {r}", "expectedOutput": str(ans)})


out = {
    "q1": q1_cases,
    "q2": q2_cases,
    "q3": q3_cases
}

with open("scratch/hard_cases.json", "w") as f:
    json.dump(out, f, indent=2)

print("Done")
