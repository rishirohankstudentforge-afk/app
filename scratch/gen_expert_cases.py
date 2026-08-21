import json
import random
import re

# Q1: Trapping Rain Water
def trap(height):
    if not height: return 0
    l, r = 0, len(height) - 1
    left_max, right_max = height[l], height[r]
    ans = 0
    while l < r:
        if left_max < right_max:
            l += 1
            left_max = max(left_max, height[l])
            ans += left_max - height[l]
        else:
            r -= 1
            right_max = max(right_max, height[r])
            ans += right_max - height[r]
    return ans

q1_cases = []
# 4 medium cases (length 10-20)
for _ in range(4):
    n = random.randint(10, 20)
    arr = [random.randint(0, 10) for _ in range(n)]
    ans = trap(arr)
    q1_cases.append({"input": f"[{','.join(map(str, arr))}]", "expectedOutput": str(ans)})

# 11 hard cases (length 500-1000)
for _ in range(11):
    n = random.randint(500, 1000)
    arr = [random.randint(0, 100) for _ in range(n)]
    ans = trap(arr)
    q1_cases.append({"input": f"[{','.join(map(str, arr))}]", "expectedOutput": str(ans)})

# Q2: Regular Expression Matching
def isMatch(s, p):
    # we can just use python's re module!
    # standard re uses greedy, but leetcode style is exact full match
    # so we add ^ and $
    pattern = "^" + p + "$"
    try:
        if re.match(pattern, s):
            return "true"
        return "false"
    except:
        return "false"

q2_cases = []
# 4 medium cases
medium_pairs = [
    ("aa", "a"), ("aa", "a*"), ("ab", ".*"), ("aab", "c*a*b")
]
for s, p in medium_pairs:
    ans = isMatch(s, p)
    q2_cases.append({"input": f'"{s}", "{p}"', "expectedOutput": f'"{ans}"'})

# 11 hard cases
hard_pairs = [
    ("mississippi", "mis*is*p*."),
    ("a", "ab*"),
    ("aaa", "ab*a*c*a"),
    ("aaba", "ab*a*c*a"),
    ("aaa", "aaaa"),
    ("ab", ".*c"),
    ("abcdef", ".*"),
    ("a", ".*..a*"),
    ("aasdfasdfasdfasdfas", "aasdf.*asdf.*asdf.*asdf.*s"),
    ("abbabaaaaaaacaa", "a*.*b.a.*c*b*a*c*"),
    ("bccbbabcaccacbcacaa", ".*b.*c*.*.*.c*a*.c")
]
for s, p in hard_pairs:
    ans = isMatch(s, p)
    q2_cases.append({"input": f'"{s}", "{p}"', "expectedOutput": f'"{ans}"'})

out = {
    "q1": q1_cases,
    "q2": q2_cases
}

with open("scratch/expert_cases.json", "w") as f:
    json.dump(out, f, indent=2)

print("Done")
